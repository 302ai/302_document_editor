"use client";
import Papa from 'papaparse';
import { BsCopy } from "react-icons/bs";
import { ErrMessage } from '../ErrMessage';
import { onDownloadTable } from "@/lib/tool";
import { MdFullscreen } from "react-icons/md";
import { MarkdownViewer } from "../MarkdownViewer";
import MarkmapComponent from "../MarkmapComponent";
import { useEffect, useRef, useState } from "react";
import { RxDoubleArrowRight } from "react-icons/rx";
import { Button } from "@/components/tailwind/ui/button"
import { toast } from "@/components/tailwind/ui/use-toast";
import LoadAnimation from '@/components/tailwind/LoadAnimation';
import { useAppDispatch, useAppSelector } from "@/app/store/hooks";
import { selectGlobal, setGlobalState } from "@/app/store/globalSlice";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/tailwind/ui/tabs";
import { getLocalStorage, setLocalStorage } from "@/lib/utils";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/tailwind/ui/dialog";
import { useCompletion } from 'ai/react';
import { useTranslations } from 'next-intl';

export const FullTextSummary = () => {
  const t = useTranslations();
  const dispatch = useAppDispatch();
  const global = useAppSelector(selectGlobal);
  const [editMindMap, setEditMindMap] = useState(false)
  const [activeTab, setActiveTab] = useState("MindMap")
  const [downloadMarkmapType, setDownloadMarkmapType] = useState({ fullScreen: '', default: '' })

  // Processing Brain Map Data
  const onBrainMapData = () => {
    if (global.novelSummary) {
      const { novelSummary } = global;
      const firstNewlineIndex = novelSummary.indexOf('\n');
      return novelSummary.substring(firstNewlineIndex + 1)?.replace(/```/g, '');
    }
    return ''
  }

  // Copy the result content
  const onHandleCopyResult = (text: string) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        toast({ duration: 2000, description: t('copy_success') })
      })
      .catch(err => {
        toast({ duration: 2000, description: t('copy_error') })
      });
  }

  // Zoom in to view
  const enlargeView = () => {
    return (
      <Dialog>
        <DialogTrigger asChild>
          <div className="absolute right-2 top-14"><MdFullscreen className="text-3xl cursor-pointer text-[#8e47f0]" /></div>
        </DialogTrigger>
        <DialogContent className=" h-[80%] sm:max-w-[80%] w-[80%] flex flex-col z-[99999]">
          <DialogHeader>
            <DialogTitle>{global.novelTitle || t('Untitled')}-{activeTab === 'MindMap' ? t('Full_text_summary_mind_map') : t('Full_text_summary_table')}</DialogTitle>
            <DialogDescription />
          </DialogHeader>
          {activeTab === "MindMap" &&
            <>
              <div className="border h-full">
                <MarkmapComponent closeDownload={() => { setDownloadMarkmapType({ fullScreen: '', default: '' }) }} markdown={onBrainMapData()} type={downloadMarkmapType.fullScreen} />
              </div>
              <div onClick={() => setDownloadMarkmapType((v) => ({ ...v, fullScreen: 'jpeg' }))}>
                <Button variant="outline" size="sm">{t('Download')}</Button>
              </div>
            </>
          }
          {activeTab === "Table" &&
            <>
              <div className="border h-full p-3 custom-scrollbar overflow-auto">{onRenderingTable(global.novelTable)}</div>
              <div>
                <Button className="mr-3" variant="secondary" size="sm" onClick={() => { onHandleCopyResult(global.novelTable) }} >
                  {t('copyCSY')}
                </Button>
                <Button variant="outline" size="sm" onClick={() => { onDownloadTable(global.novelTable, global.novelTitle, t) }}>
                  {t('Download')}
                </Button>
              </div>
            </>
          }
        </DialogContent>
      </Dialog >
    )
  }

  // Rendering Table
  const onRenderingTable = (csvData: string) => {
    if (!csvData) return;
    const rows: any = Papa.parse(csvData, {
      comments: '```',
      skipEmptyLines: true,
    })
    if (rows.data.length) {
      const longestSublistIndex = rows.data.reduce((maxIndex: number, sublist: any, index: number, array: any[]) => {
        return sublist.length > array[maxIndex].length ? index : maxIndex;
      }, 0);
      const transposedData = rows.data[longestSublistIndex].map((_: any, colIndex: number) => rows.data.map((row: any) => row[colIndex]));
      const nonEmptyColumnIndices = transposedData.map((col: any, index: number) => col.some((cell: any) => cell) ? index : -1)
        .filter((index: number) => index !== -1);

      const tableData = rows.data.map((row: any) => nonEmptyColumnIndices.map((index: number) => row[index]))
        .filter((sublist: any) => !sublist.every((cell: any) => cell && cell?.trim()?.indexOf('---') > -1));

      return (
        <table>
          <tbody>
            {
              tableData.map((_: string, index: number) => {
                return (
                  <tr key={`${index}`}>
                    {
                      tableData[index].map((item: string, index2: number) => {
                        if (index2 === 0) {
                          return (<th key={`${item}-${index2}`}>{item}</th>)
                        } else {
                          return (<td key={`${item}-${index2}`}>{item}</td>)
                        }
                      })
                    }
                  </tr>
                )
              })
            }
          </tbody>
        </table>
      )
    }
    return <></>
  }

  const { completion, complete, setCompletion, isLoading } = useCompletion({
    id: "fullTextSummary",
    api: "/api/generateWritingNew",
    onFinish: async (prompt, completion) => { },
    onResponse: async (response) => {
      if (!response.ok) {
        try {
          const errorData = await response.json();
          toast({
            duration: 2000,
            description: (ErrMessage(errorData.error.err_code, global.language))
          })
        } catch (parseError) {
          toast({
            duration: 2000,
            description: (ErrMessage(0, global.language))
          })
        }
      }
    },
  });

  const onFullTextSummary = (name: 'novelSummary' | 'novelTable') => {
    summaryTarget.current = name;
    const content = localStorage.getItem('txt-content');
    complete(content, {
      body: {
        params: {
          title: global.novelTitle,
        },
        type: name === 'novelSummary' ? 'Full text summary' : 'Full text summary Table',
      }
    })
  }

  const summaryTarget = useRef('');
  useEffect(() => {
    if (summaryTarget.current && completion) {
      const key = summaryTarget.current;
      if (completion && !completion?.endsWith('-') && isLoading) {
        dispatch(setGlobalState({ [key]: completion }))
      }
      if (global.novelSummary && !isLoading) {
        if (summaryTarget.current === 'novelSummary') {
          onFullTextSummary('novelTable');
        }
        setLocalStorage(key, completion);
        setCompletion('');
      }
    }
  }, [completion, isLoading])

  useEffect(() => {
    const novelSummary = getLocalStorage('novelSummary')?.replace(/```markdown|```/g, '');
    const novelTable = getLocalStorage('novelTable')
    dispatch(setGlobalState({ novelTable, novelSummary }))
  }, [])

  return (
    <div className="w-[50vw] border-l h-full flex flex-col gap-3 relative">
      {
        isLoading &&
        <div className='absolute left-0 top-0 w-full h-full bg-[#ffffff8a] backdrop-blur-sm z-[9999] gap-4 flex flex-col justify-center items-center'>
          <LoadAnimation />
          <span className='font-bold'>{summaryTarget.current === 'novelSummary' ? t('Summarizing_the_entire_text') : t('Generate_a_table')}</span>
        </div>
      }
      <div className="flex justify-between items-center pr-3 h-[50px]">
        <div className='flex items-center'>
          <Button
            onClick={() => dispatch(setGlobalState({ selectRightMenu: '' }))}
            className={`text-foreground w-[45px] h-[45px] flex items-center justify-center m-1 bg-[hsl(var(--accent))] hover:bg-[hsl(var(--accent))] `}
          >
            <RxDoubleArrowRight className="text-lg " />
          </Button>
          <Button variant="ghost" className='p-0 w-[45px] h-[45px]' onClick={() => { onHandleCopyResult(global.novelSummary) }} >
            <BsCopy />
          </Button>
        </div>
        {
          global.novelSummary &&
          <span className='text-[#8e47f0] cursor-pointer' onClick={() => { onFullTextSummary('novelSummary'); }}>
            {t('Click_to_summarize_the_full_text')}
          </span>
        }
      </div>
      <div className={`h-[50%] w-full custom-scrollbar relative`}>
        {
          !global.novelSummary && !isLoading &&
          <div className='absolute w-full h-full px-3 py-2 bg-[#ffffff8a] backdrop-blur-[2px] flex items-center justify-center'>
            <Button onClick={() => { onFullTextSummary('novelSummary') }}>{t('Start_summarizing')}</Button>
          </div>
        }
        <MarkdownViewer content={global.novelSummary} editMindMap={editMindMap} onEditMindMap={setEditMindMap} />
      </div>
      <Tabs defaultValue="MindMap" className='flex flex-col justify-between relative' onValueChange={setActiveTab} style={{ height: 'calc(50% - 50px)' }}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="MindMap">{t('Mind_map')}</TabsTrigger>
          <TabsTrigger value="Table">{t('table')}</TabsTrigger>
        </TabsList>
        {
          activeTab === "MindMap" &&
          <TabsContent value="MindMap" className="flex flex-col justify-between h-full relative">
            <MarkmapComponent closeDownload={() => { setDownloadMarkmapType({ fullScreen: '', default: '' }) }} markdown={onBrainMapData()} type={downloadMarkmapType.default} />
            <Button variant="outline" size="sm" className=" absolute left-3 bottom-3" onClick={() => setDownloadMarkmapType((v) => ({ ...v, default: 'jpeg' }))}>
              {t('Download')}
            </Button>
          </TabsContent>
        }
        {
          activeTab === "Table" &&
          <TabsContent value="Table" className="flex flex-col justify-between h-full relative overflow-hidden">
            <div className="p-2 w-full custom-scrollbar">
              {onRenderingTable(global.novelTable)}
            </div>
            <div className='p-3'>
              <Button className="mr-3" variant="secondary" size="sm" onClick={() => { onHandleCopyResult(global.novelTable) }} >
                {t('copyCSY')}
              </Button>
              <Button variant="outline" size="sm" onClick={() => { onDownloadTable(global.novelTable, global.novelTitle, t) }}>
                {t('Download')}
              </Button>
            </div>
          </TabsContent>
        }
        {enlargeView()}
      </Tabs>
    </div>
  )
}
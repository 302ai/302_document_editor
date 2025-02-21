import { selectGlobal, setGlobalState } from "@/app/store/globalSlice";
import { useAppDispatch, useAppSelector } from "@/app/store/hooks";
import { Input } from "@/components/tailwind/ui/input";
import { languageMenuList } from "@/lib/language";
import { MdScreenSearchDesktop } from "react-icons/md";
import { useEffect, useState } from "react";
import { Button } from "@/components/tailwind/ui/button";
import { Checkbox } from "@/components/tailwind/ui/checkbox";
import { MdDeleteOutline } from "react-icons/md";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/tailwind/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/tailwind/ui/dialog";
import { IoSearch } from "react-icons/io5";
import { toast } from "@/components/tailwind/ui/use-toast";
import ky from "ky";
import { ErrMessage } from "../ErrMessage";
import { v4 as uuidv4 } from 'uuid';
import { Loader2 } from "lucide-react";
import { MarkdownViewer } from "../MarkdownViewer";
import { useCompletion } from "ai/react";
import LoadAnimation from "@/components/tailwind/LoadAnimation";
import { useTranslations } from "next-intl";
import { Textarea } from "@/components/tailwind/ui/textarea";
import { useConstant } from "./constant";

interface IListData {
  id: string;
  title: string;
  url: string;
  content: string;
  summaryContent?: string;
}

export const InformationSearch = () => {
  const t = useTranslations();
  const dispatch = useAppDispatch();
  const global = useAppSelector(selectGlobal);
  const [inputValue, setInputValue] = useState('');
  const [selectList, setSelectList] = useState([]);
  const [list, setList] = useState<IListData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchLoad, setSearchLoad] = useState(false);
  const [recommendedList, setRecommendedList] = useState([]);
  const [selectData, setSelectData] = useState({ lang: 'Chinese', template: '', searchType: 'Tavily' });
  const [abstract, setAbstract] = useState<Partial<IListData>>({})
  const [isContentSummary, setIsContentSummary] = useState(false)
  const [customizeWebsite, setCustomizeWebsite] = useState({ open: false, title: '', url: '', content: '', })

  const { templateList, searchTypeList } = useConstant(t)

  const SelectModule = (type: 'lang' | 'template' | 'searchType', list: Array<{ value: string, label: string }>) => {
    return (
      <Select onValueChange={(value) => setSelectData((v) => ({ ...v, [type]: value }))} value={selectData[type]}>
        <SelectTrigger className={`${type === 'lang' ? 'w-[180px]' : 'w-[200px]'}`}>
          <SelectValue placeholder={type === "template" && t('SelectTemplate')} />
        </SelectTrigger>
        <SelectContent className="z-[99999]">
          <SelectGroup>
            {list.map(item => (<SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>))}
          </SelectGroup>
        </SelectContent>
      </Select>
    )
  }

  const { completion, complete, setCompletion, stop } = useCompletion({
    id: "informationSearch",
    api: "/api/informationSearch",
    onFinish: async (prompt, completion) => {
      setIsLoading(false);
    },
    onResponse: async (response) => {
      if (!response.ok) {
        setAbstract({});
        setCompletion('');
        setIsLoading(false);
        try {
          const errorData = await response.json();
          toast({
            duration: 2000,
            style: { zIndex: 99999 },
            description: (ErrMessage(errorData.error.err_code, global.language))
          })
        } catch (parseError) {
          toast({
            duration: 2000,
            style: { zIndex: 99999 },
            description: (ErrMessage(0, global.language))
          })
        }
      }
    },
  });

  // Select All
  const onSelectAll = () => {
    const ids = list.map(item => item.id);
    setSelectList(ids)
  }

  // Single Choice
  const onSingleChoice = (checked: boolean, id: string) => {
    if (checked) {
      setSelectList((v) => ([...v, id]))
    } else {
      setSelectList((v) => v.filter(f => f !== id))
    }
  }

  // Delete unselected
  const onDeleteUnselected = () => {
    const tempList = list.filter(f => selectList.includes(f.id))
    if (!selectList.includes(abstract?.id)) {
      setAbstract({})
    }
    setList(tempList)
    localStorage.setItem('listData', JSON.stringify(tempList))
  }

  // empty
  const onEmptyList = () => {
    setSelectList([]);
    setList([]);
    localStorage.removeItem('listData')
    setAbstract({})
  }

  // Single deletion
  const onDelete = (id: string) => {
    if (id === abstract?.id) {
      setAbstract({})
    }
    const newList = list.filter(f => f.id !== id);
    setList(newList)
    setSelectList((v => v.filter(f => f !== id)))
    localStorage.setItem('listData', JSON.stringify(newList))
  }

  // Search List
  const onSearch = async (query?: string) => {
    setSearchLoad(true);
    if (query) {
      setInputValue(query);
      localStorage.setItem('informationSearchValue', query)
    }
    const tempQuery = query || inputValue;
    const paddedQuery = tempQuery.padEnd(6, ' ');
    try {
      const result: any = await ky('/api/informationSearch', {
        method: 'post',
        timeout: false,
        body: JSON.stringify({
          type: 'search',
          query: paddedQuery,
          language: selectData.lang,
          searchType: selectData.searchType,
        })
      }).then(res => res.json())
      if (result?.error) {
        setSearchLoad(false);
        toast({
          duration: 2000,
          description: (ErrMessage(result?.error?.err_code, global.language))
        })
        return;
      }
      const listData: IListData[] = result.list?.map(f => ({ ...f, id: uuidv4() }));
      const oldData: string[] = JSON.parse(JSON.stringify(list)).map(m => m.url);
      const newData = listData.filter(f => !oldData.includes(f.url))
      localStorage.setItem('recommendedList', JSON.stringify(result.recommendedList))
      setAbstract({})
      setSearchLoad(false);
      setList((v) => {
        const newList = [...newData, ...v]
        localStorage.setItem('listData', JSON.stringify(newList))
        return newList
      })
      setRecommendedList(result.recommendedList)
    } catch (error) {
      setSearchLoad(false);
      toast({
        duration: 2000,
        description: (t('informationSearchFailed'))
      })
    }
  }

  // Content Summary
  const onContentSummary = async () => {
    await stop()
    if (!abstract?.summaryContent) {
      setIsLoading(true);
      complete('', {
        body: {
          type: 'contentSummary',
          url: [abstract.url],
        }
      })
    }

  }

  // Start creating
  const onStartCreating = () => {
    const url = list.filter(f => selectList.includes(f.id)).map(item => item.url);
    const params = {
      informationUrl: url,
      informationTemplate: selectData.template,
      informationLang: selectData.lang,
      selectRightMenu: '',
      informationCreationStatus: true,
      informationGenerationStatus: true,
    }
    dispatch(setGlobalState({ ...params }))
  }

  // 自定义网址
  const onCustomizeWebsite = () => {
    const onSubmit = () => {
      const { title, url, content } = customizeWebsite;
      const id = uuidv4();
      const temp = { id, title, url, content }
      setList((v) => {
        const newList = [{ ...temp }, ...v]
        localStorage.setItem('listData', JSON.stringify(newList))
        return newList
      })
      setCustomizeWebsite({ open: false, title: '', url: '', content: '', })
    }
    const onSaveValue = (type: 'title' | 'url' | 'content', value: string) => {
      setCustomizeWebsite((v) => ({ ...v, [type]: value }))
    }
    return (
      <Dialog open={customizeWebsite.open} onOpenChange={(open) => setCustomizeWebsite((v) => ({ ...v, open }))}>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            className="text-[#8e47f0] border-[#8e47f0] hover:text-[#8e47f0]  hover:bg-[#8e47f014]"
          >
            {t('Add_URL')}
          </Button>
        </DialogTrigger>
        <DialogContent className=" flex flex-col z-[99999] border-2 ">
          <DialogHeader>
            <DialogTitle >{t('Add_URL')}</DialogTitle>
            <DialogDescription />
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <div>
              <p className="text-sm">{t('Add_URL_title')}</p>
              <Input onChange={(e) => onSaveValue('title', e.target.value)} placeholder={t('Add_URL_title_tips')} />
            </div>
            <div>
              <p className="text-sm">{t('website')}<span className="text-red-500">*</span></p>
              <Input onChange={(e) => onSaveValue('url', e.target.value)} placeholder={t('website_tips')} />
            </div>
            <div>
              <p className="text-sm">{t('describe')}</p>
              <Textarea onChange={(e) => onSaveValue('content', e.target.value)} className="min-h-[150px]" placeholder={t('describe_tips')} />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              disabled={!customizeWebsite.url}
              className="text-[#8e47f0] border-[#8e47f0] hover:text-[#8e47f0]  hover:bg-[#8e47f014]"
              onClick={onSubmit}
            >
              {t('add')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog >
    )
  }

  // Initial value
  useEffect(() => {
    const listData = localStorage.getItem('listData');
    const recommendedList = localStorage.getItem('recommendedList')
    const informationSearchValue = localStorage.getItem('informationSearchValue')
    try {
      if (listData) {
        const tempList = JSON.parse(listData || '[]')
        setList(tempList)
      }
      if (recommendedList) {
        const tempRecommendedList = JSON.parse(recommendedList || '[]')
        setRecommendedList(tempRecommendedList)
      }
      if (informationSearchValue) {
        setInputValue(informationSearchValue)
      }
    } catch (error) {

    }
  }, [])

  useEffect(() => {
    if (completion) {
      setAbstract((v) => ({ ...v, summaryContent: completion }))
    }
  }, [completion])

  useEffect(() => {
    if (!isLoading && abstract?.id) {
      const newList = list.map(item => item.id === abstract.id ? { ...item, summaryContent: abstract?.summaryContent } : item)
      setList(newList)
      localStorage.setItem('listData', JSON.stringify(newList))
    }
  }, [isLoading])

  useEffect(() => {
    if (isContentSummary && abstract.url) {
      onContentSummary()
    }
  }, [isContentSummary])

  return (
    <Dialog
      open={global.selectRightMenu === "InformationSearch"}
      onOpenChange={(open) => { dispatch(setGlobalState({ selectRightMenu: open ? 'InformationSearch' : '' })) }}
    >
      <DialogTrigger asChild>
        <div className="flex flex-col justify-center items-center gap-2 cursor-pointer group" >
          <MdScreenSearchDesktop className={`text-2xl group-hover:text-[#8e47f0]`} />
          <div className={`text-xs text-center group-hover:text-[#8e47f0]`}>{t('Information_search')}</div>
        </div>
      </DialogTrigger>
      <DialogContent className="h-[85%] sm:max-w-[85%] flex flex-col z-[9999] border-2 overflow-hidden">
        <DialogHeader>
          <DialogTitle />
          <DialogDescription />
        </DialogHeader>
        <div className="border h-full rounded-md flex flex-col" style={{ height: 'calc(100% - 65px)' }}>
          <div className="md:px-[5%] py-5">
            <div className="flex items-center gap-5">
              <div className="border w-full rounded-md flex items-center">
                <Input
                  value={inputValue}
                  className="border-none"
                  placeholder={t('Enter_your_description')}
                  onKeyDown={(e) => {
                    const dom = window.document.getElementById("searchBut")
                    if (e?.key === "Enter" && dom) dom.click()
                  }}
                  onChange={(e) => { setInputValue(e.target.value); localStorage.setItem('informationSearchValue', e.target.value) }}
                />
                {
                  searchLoad ? <Loader2 className="animate-spin mx-3" style={{ width: 20, height: 20 }} />
                    : <div id="searchBut" onClick={() => { onSearch() }} ><IoSearch className="cursor-pointer text-2xl mx-3" /></div>
                }
              </div>
              {SelectModule('searchType', searchTypeList)}
            </div>
            {
              recommendedList?.length > 0 &&
              <div className="flex gap-2 items-center text-sm text-slate-500 mt-2 px-3">
                <div className="flex-none">{t('Recommended_for_you')}：</div>
                <div className="flex gap-3 flex-wrap text-[#8e47f0]">
                  {recommendedList.map(item => (
                    <div className="cursor-pointer" key={item} onClick={() => { onSearch(item) }}>{item}</div>
                  ))}
                </div>
              </div>
            }
          </div>
          <div className="border-t flex flex-1" style={{ height: 'calc(100% - 110px)' }}>
            <div className="border-r w-[35%] p-2 h-full">
              {
                list.length ?
                  <div className="flex justify-between items-center text-sm text-[#8e47f0] mb-5 flex-1">
                    <div className="flex gap-3">
                      <span className="cursor-pointer" onClick={onSelectAll}>{t('Select All')}</span>
                      <span className="cursor-pointer" onClick={() => { setSelectList([]) }}>{t('Reset')}</span>
                    </div>
                    {
                      !isLoading &&
                      <div className="flex gap-3">
                        <span className="text-slate-500 cursor-pointer" onClick={onDeleteUnselected}>{t('Delete_unselected')}</span>
                        <span className="text-red-600 cursor-pointer" onClick={onEmptyList}>{t('empty')}</span>
                      </div>
                    }
                  </div> : <></>
              }
              <div className="flex flex-col gap-5 felx-1 custom-scrollbar overflow-x-hidden" style={{ height: 'calc(100% - 40px)' }}>
                {
                  list.length ? list.map(item => (
                    <div className="flex justify-between items-center gap-3 w-full cursor-pointer" key={item.id}>
                      <div className="flex items-center gap-3" style={{ width: "calc(100% - 32px)" }}>
                        <Checkbox
                          id={item.id}
                          checked={selectList.includes(item.id)}
                          onCheckedChange={(checked: boolean) => { onSingleChoice(checked, item.id) }}
                        />
                        <div className="text-sm truncate cursor-pointer group" onClick={() => { stop(); setAbstract({ ...item }); setIsContentSummary(false); setIsLoading(false) }}>
                          <div className={`truncate group-hover:text-[#8e47f0] ${abstract?.id === item.id && 'text-[#8e47f0]'}`}>{item?.title || customizeWebsite.url}</div>
                          <div className={`truncate text-xs text-slate-500 group-hover:text-[#b28be9] ${abstract?.id === item.id && 'text-[#b28be9]'}`}>
                            {item?.content}
                          </div>
                        </div>
                      </div>
                      <div className="overflow-hidden">
                        {(isLoading && item.id === abstract?.id) ?
                          <Loader2 className="animate-spin w-5 h-5" /> :
                          <MdDeleteOutline className="text-red-600 text-xl" onClick={() => { onDelete(item.id) }} />
                        }
                      </div>
                    </div>
                  )) :
                    <div className="flex justify-center items-center h-full flex-col gap-3">
                      <img src="/empty.png" />
                      <div className="text-slate-500">{t('No_list_data')}</div>
                    </div>
                }
              </div>
            </div>
            <div className="p-2 w-full relative">
              {
                isLoading &&
                <div className='absolute left-0 top-0 w-full h-full bg-[#ffffff8a] z-[9999] flex justify-center items-center'>
                  <LoadAnimation />
                </div>
              }
              {
                abstract?.id ?
                  <>
                    <div className="flex justify-end items-center pb-1">
                      {
                        !isContentSummary ?
                          <div className="flex items-center gap-3">
                            <div onClick={() => window.open(abstract?.url)} className="text-[#8e47f0] cursor-pointer text-sm">
                              {t('Open_browser')}
                            </div>
                            <span className="cursor-pointer text-blue-400 text-sm" onClick={() => setIsContentSummary(true)}>
                              {t('ContentSummary')}
                            </span>
                          </div>
                          :
                          <span className="cursor-pointer text-blue-400 text-sm" onClick={() => setIsContentSummary(false)} >
                            {t('View_the_original_text')}
                          </span>

                      }
                    </div>
                    <div className="custom-scrollbar" style={{ height: 'calc(100% - 24px)' }}>
                      {
                        isContentSummary ?
                          <MarkdownViewer content={abstract.summaryContent} />
                          :
                          <iframe src={abstract.url} className="custom-scrollbar h-full w-full" style={{ height: 'calc(100% - 10px)' }} />
                      }
                    </div>
                  </> :
                  <div className="flex justify-center items-center h-full flex-col gap-3">
                    <img src="/empty.png" />
                    <div className="text-slate-500">{t('No_summary_data_available_at_the_moment')}</div>
                  </div>
              }
            </div>
          </div>
        </div>
        <DialogFooter className="w-full" style={{ justifyContent: 'space-between' }}>
          {onCustomizeWebsite()}
          <div className="flex gap-3">
            {SelectModule('lang', languageMenuList)}
            {SelectModule('template', templateList)}
            <Button
              variant="outline"
              disabled={searchLoad || selectList.length < 1 || global.informationGenerationStatus}
              className="text-[#8e47f0] border-[#8e47f0] hover:text-[#8e47f0]  hover:bg-[#8e47f014]"
              onClick={onStartCreating}
            >
              {t('Start_creating')}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog >
  )
}
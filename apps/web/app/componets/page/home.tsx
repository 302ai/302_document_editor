"use client";

import PoweredBy from '../PoweredBy';
import type { JSONContent } from "novel";
import { useEffect, useState } from "react";
import { ImSpinner3 } from "react-icons/im";
import { type EditorInstance } from "novel";
import { DocumentMenu } from '../DocumentMenu';
import { FaCircleCheck } from "react-icons/fa6";
import { RxDoubleArrowLeft } from "react-icons/rx";
import { RxDoubleArrowRight } from "react-icons/rx";
import { Button } from "@/components/tailwind/ui/button";
import { getLocalStorage, setPageLanguage } from "@/lib/utils";
import { useAppDispatch, useAppSelector } from '@/app/store/hooks';
import { selectGlobal, setGlobalState } from '@/app/store/globalSlice';
import TailwindAdvancedEditor from "@/components/tailwind/advanced-editor";
import AudioPlayer from '@/components/tailwind/generative/ai-sound-playback';
import TailwindAdvancedEditorCopy from "@/components/tailwind/advanced-editor-copy";
import { WordCount } from '../WordCount';
import { RightMenu } from '../RightMenu';
import { useTranslations } from "next-intl";
import { useAutoScroll } from '@/hooks/useAutoScroll';

const onActionBar = [
  { id: 1, type: 'File' },
  { id: 2, type: 'Edit', },
  { id: 3, type: 'AI', },
  { id: 4, type: 'Preference', },
]
const showBrand = process.env.NEXT_PUBLIC_SHOW_BRAND === "true";
export default function Page() {
  useAutoScroll();
  const t = useTranslations();
  const dispatch = useAppDispatch();
  const global = useAppSelector(selectGlobal);

  const [initialContent, setInitialContent] = useState<null | JSONContent>(null);
  const [editorInstance, setEditorInstance] = useState<EditorInstance | null>(null);
  const [openAudioPlayer, setOpenAudioPlayer] = useState({ text: '', disable: false });
  const [leftAndRightAreas, setLeftAndRightAreas] = useState({ left: false, right: false, ai: false });

  useEffect(() => {
    const lang = setPageLanguage()
    document.title = t('title')
    dispatch(setGlobalState({ language: lang }))
  }, [])

  useEffect(() => {
    const novelSummary = getLocalStorage('novelSummary');
    const novelTable = getLocalStorage('novelTable');
    dispatch(setGlobalState({ novelTable, novelSummary }))
  }, [])

  useEffect(() => {
    if (global.novelContent) {
      const { novelContent } = global;
      if (novelContent) {
        const dataTemp = novelContent?.content?.filter(node => node.type === 'heading' && node?.content?.length > 0 && node?.content[0]?.text)
          ?.map(node => node);
        setInitialContent(dataTemp || [])
      }
    }
  }, [global.novelContent]);

  const onRenderingLeftList = () => {
    const onLocation = (index: number) => {
      if (editorInstance) {
        const allH2Positions = [];
        editorInstance.view.state.doc.forEach((node, pos) => {
          if (node.type.name === 'heading') {
            allH2Positions.push(pos < 1 ? 1 : pos);
          }
        });
        const thirdH2Pos = allH2Positions[index];
        const oldScrollY = window.scrollY;
        editorInstance.chain().focus(thirdH2Pos === 1 ? thirdH2Pos : thirdH2Pos + 1).run();
        setTimeout(() => {
          if (oldScrollY < window.scrollY) {
            window.scrollBy(0, window.outerHeight - 200);
          } else {
            window.scrollBy(0, -50);
          }
        }, 10);
      }
    }
    if (initialContent) {
      return initialContent.map((item: JSONContent, index) => {
        return (
          <div
            key={`${item.text}-${index}`}
            onClick={() => { onLocation(index) }}
            className={
              `cursor-pointer hover:text-[#8e47f0]
               hover:bg-[#f1f5f9] py-1 text-sm
               ${item.attrs.level === 2 && 'ml-3'}
               ${item.attrs.level === 3 && 'ml-6'}
               ${item.attrs.level === 4 && 'ml-9'}
               ${item.attrs.level === 5 && 'ml-12'}
               `
            }
          >
            {item.content.map(item => item.text).join('')}
          </div>
        )
      })
    } else {
      return <></>
    }
  }

  return (
    <div className="flex min-h-screen h-full flex-col items-center w-full relative">
      {/* 顶部 */}
      <div className={`flex items-center py-1 px-3 justify-between sticky top-0 border-b z-10 w-full bg-background h-12`}>
        <div className="flex md:min-w-[120px] min-w-6">
          {
            showBrand &&
            <img src="https://file.302.ai/gpt/imgs/5b36b96aaa052387fb3ccec2a063fe1e.png" className="h-6 w-6 mr-2" alt="302" />
          }
          <span className="md:block hidden">{t('title')}</span>
        </div>
        <div className="flex items-center">
          {onActionBar.map(item => (
            <DocumentMenu
              key={item.id}
              type={item.type}
              editorInstance={editorInstance}
              onOpenAudioPlayer={() => {
                const text = editorInstance.getText()
                setOpenAudioPlayer({ disable: true, text })
              }}
            />
          ))}
        </div>
        {
          (openAudioPlayer.disable && openAudioPlayer.text) && (
            <div className='fixed top-[48px] left-1/3 -translate-x-1/3 border md:w-[500px] w-full bg-background'>
              <AudioPlayer text={openAudioPlayer.text} full={openAudioPlayer.disable} close={() => { setOpenAudioPlayer({ disable: false, text: '' }) }} />
            </div>
          )
        }
        <div className="flex items-center gap-3">
          <WordCount />
          <div className="md:block hidden">
            <FaCircleCheck className={` ${global.saveStatus ? 'hidden' : 'block'}`} />
            <ImSpinner3 className={`${global.saveStatus ? 'block' : 'hidden'} animate-spin`} />
          </div>
        </div>
      </div>

      <div className="mx-auto relative flex justify-between w-full">
        <div className={`z-[9998] bg-background sticky top-[48px] 
             ${leftAndRightAreas.left && 'border-r min-w-[250px] max-w-[250px]'}
             ${!leftAndRightAreas.left && 'min-w-[55px] max-w-[55px] border-r-0'}`
        } style={{ height: '100%' }}
        >
          <div className='flex items-end flex-col'>
            <div className={`justify-end w-full ${!initialContent?.length ? 'hidden' : 'flex'}`}>
              <Button
                className={`text-foreground p-0 w-[45px] h-[45px] flex items-center justify-center m-1 bg-[hsl(var(--accent))] hover:bg-[hsl(var(--accent))] `}
                onClick={() => { setLeftAndRightAreas(v => ({ ...v, left: !v.left })) }}
              >
                {leftAndRightAreas.left ? <RxDoubleArrowLeft className="text-lg" /> : <RxDoubleArrowRight className="text-lg" />}
              </Button>
            </div>
          </div>
          <div className={`p-3 ${leftAndRightAreas.left ? 'block' : 'hidden'} overflow-y-auto custom-scrollbar`} style={{ height: 'calc(100vh - 101px)' }}>
            {onRenderingLeftList()}
          </div>
        </div>

        {/* 写作区 */}
        <div className="mx-auto w-full h-full relative">
          <div className="mx-auto w-full flex h-full relative">
            <TailwindAdvancedEditor
              language={global.language}
              onEditorCreate={(editor) => {
                setEditorInstance(editor);
              }}
              className={`mx-auto ${global.wideLayout ? 'max-w-[1440px]' : 'max-w-[960px]'}`}
            />
            {
              (global.translateDualScreen || global.rewriteDualScreen || global.informationCreationStatus || global.newsSubscriptionCreationStatus) &&
              (<TailwindAdvancedEditorCopy
                className={`mx-auto ${global.wideLayout ? 'max-w-[1440px]' : 'max-w-[960px]'}`}
                editorInstance={editorInstance}
                language={global.language}
              />)
            }
          </div>
          {showBrand && <PoweredBy language={global.language} />}
        </div>
        <RightMenu editorInstance={editorInstance} />
      </div>
    </div >
  );
}

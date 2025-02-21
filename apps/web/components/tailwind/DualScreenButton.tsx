import type { EditorInstance, JSONContent } from "novel";
import { Button } from "./ui/button";
import { useAppDispatch, useAppSelector } from "@/app/store/hooks";
import { toast } from "./ui/use-toast";
import dayjs from "dayjs";
import React, { useEffect, useState } from "react";
import { addOrUpdateData } from "@/app/api/indexedDB";
import { selectGlobal, setGlobalState } from "@/app/store/globalSlice";
import { franc } from 'franc';
const hljs = require('highlight.js');
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { IoIosArrowForward } from "react-icons/io";
import { removeColgroupTags } from "@/lib/utils";
import html2md from "html-to-md";
import { useTranslations } from "next-intl";
import { languageMenuList } from "@/lib/language";

interface IProps {
  title: string,
  language: 'chinese' | 'english' | 'japanese',
  editorInstance: EditorInstance | null,
  editorInstanceCopy: EditorInstance | null,
  onRegenerate: (lingo?: string) => void;
}

interface IData {
  id: number;
  title: string
  markdown: string;
  htmlContent: string;
  novelContent: JSONContent;
  createdAt: string;
}
export default function DualScreenButton(props: IProps) {
  const t = useTranslations();
  const dispatch = useAppDispatch()
  const global = useAppSelector(selectGlobal);
  const { title, language, editorInstanceCopy, editorInstance, onRegenerate } = props;
  const [selectLanguage, setSelectLanguage] = useState('')

  const DUAL_SCREEN_BUTTON: Array<{ value: string, label: string }> = [
    { label: t('Copy_the_full_text'), value: 'Copy the full text' },
    { label: t('Replace_entire_text'), value: 'Replace entire text' },
    { label: t('Create_copy'), value: 'Create a copy' },
    { label: t('Regenerate'), value: 'Regenerate' },
    { label: t('Close'), value: 'Close' },
  ]


  useEffect(() => {
    if (global.translateDualLanguage) {
      const { translateDualLanguage } = global;
      setSelectLanguage(translateDualLanguage);
    }
  }, [global.translateDualLanguage])

  const highlightCodeblocks = (content: string) => {
    const doc = new DOMParser().parseFromString(content, 'text/html');
    doc.querySelectorAll('pre code').forEach((el) => {
      // @ts-ignore
      // https://highlightjs.readthedocs.io/en/latest/api.html?highlight=highlightElement#highlightelement
      hljs.highlightElement(el);
    });
    return new XMLSerializer().serializeToString(doc);
  };

  const onHandleCopyResult = () => {
    // const data = editorInstanceCopy.storage.markdown.getMarkdown()
    const htmlContent = removeColgroupTags(highlightCodeblocks(editorInstanceCopy.getHTML()));
    const data = html2md(htmlContent)
    let newStr = data.replace(/!\[.*?\]\(.*?\)/g, '\n$&\n');
    navigator.clipboard.writeText(newStr)
      .then(() => {
        toast({ duration: 2000, description: t('copy_success') })
      })
      .catch(err => {
        toast({ duration: 2000, description: t('copy_error') })
      });
  }

  const onToast = (description: string) => {
    toast({ duration: 2000, description })
  }

  // Save or modify
  const onSave = async () => {
    try {
      const id = window.localStorage.getItem("novel-id");
      const markdown = window.localStorage.getItem("markdown");
      const title = window.localStorage.getItem("novel-title");
      const createdAt = window.localStorage.getItem("createdAt");
      const htmlContent = window.localStorage.getItem("html-content");
      const novelContent = window.localStorage.getItem("novel-content");
      if (!title && !markdown) {
        return;
      }
      const data = {
        id: +id,
        title,
        novelContent: novelContent ? JSON.parse(novelContent) : null,
        htmlContent,
        markdown,
        createdAt,
      }
      await addOrUpdateData(data);
      onToast(t('save.success'))
    } catch (error) {
      onToast(t('save.error'))
    }
  }

  const onCreateCopy = async () => {

    if (editorInstanceCopy) {
      try {
        const novelContent = editorInstanceCopy?.getJSON();
        let htmlContent = highlightCodeblocks(editorInstanceCopy.getHTML())
        const markdownData = html2md(htmlContent)
        let markdown = markdownData.replace(/!\[.*?\]\(.*?\)/g, '\n$&\n');
        let newTitle = title
        if (global.informationCreationStatus) {
          const { tempTitle, content } = getFirstTitle(markdown)
          newTitle = tempTitle;
          markdown = content;
          // 处理 novelContent - 移除第一个标题节点
          if (novelContent.content && novelContent.content.length > 0) {
            const firstNode = novelContent.content[0];
            if (firstNode.type === 'heading') {
              novelContent.content.splice(0, 1);
            }
          }

          // 处理 htmlContent - 移除第一个标题标签
          const tempDiv = document.createElement('div');
          tempDiv.innerHTML = htmlContent;
          const firstHeading = tempDiv.querySelector('h1, h2, h3, h4, h5, h6');
          if (firstHeading) {
            firstHeading.remove();
          }
          htmlContent = tempDiv.innerHTML;

        }
        const id = dayjs().valueOf();
        const data = {
          id: +id,
          title: `${newTitle || ''}-${t('copy')}`,
          novelContent,
          htmlContent,
          markdown,
          createdAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
        }
        await addOrUpdateData(data);
        toast({ duration: 2000, description: t('Copy_created_successfully') })
      } catch (error) {
        toast({ duration: 2000, description: t('Copy_created_error') })
      }
    }
  }


  const getFirstTitle = (md) => {
    const lines = md.split('\n');
    const titleIndex = lines.findIndex(line => line.trim().startsWith('#'));

    if (titleIndex === -1) {
      return {
        tempTitle: '',
        content: md
      };
    }

    const tempTitle = lines[titleIndex].replace(/^#+\s+/, '');
    // 移除标题行并重新组合内容
    lines.splice(titleIndex, 1);
    const content = lines.join('\n').trim();
    return {
      tempTitle,
      content
    };
  }

  const onClickButton = async (key: string, lingo?: string) => {
    switch (key) {
      case 'Close':
        dispatch(setGlobalState({
          rewriteDualScreen: false,
          translateDualScreen: false,
          freeRewritingText: '',
          informationUrl: [],
          informationTemplate: '',
          informationLang: '',
          informationCreationStatus: false,
          newsSubscriptionCreationStatus: false,
        }))
        break;

      // copy
      case 'Copy the full text':
        onHandleCopyResult()
        break;

      // Create a copy
      case 'Create a copy':
        await onSave()
        onCreateCopy()
        break;

      // Regenerate
      case 'Regenerate':
        if (global.informationCreationStatus) {
          dispatch(setGlobalState({ selectRightMenu: 'InformationSearch' }))
          return
        }
        if (global.newsSubscriptionCreationStatus) {
          dispatch(setGlobalState({ selectRightMenu: 'NewsSubscription' }))
          return
        }
        onRegenerate(lingo)
        break;
      // Full text replacement
      case 'Replace entire text':
        const htmlContent = removeColgroupTags(highlightCodeblocks(editorInstanceCopy.getHTML()));
        const data = html2md(htmlContent)
        let newStr = data.replace(/!\[.*?\]\(.*?\)/g, '\n$&\n');
        const oldTitle = localStorage.getItem('novel-title') || '';
        editorInstance.chain().clearContent().run()
        let newTitle = title
        if (global.informationCreationStatus || global.newsSubscriptionCreationStatus) {
          const { tempTitle, content } = getFirstTitle(newStr)
          newTitle = tempTitle;
          newStr = content;
        }
        editorInstance.chain().focus().insertContentAt(0, newStr).run();
        window.localStorage.setItem("novel-title", newTitle);
        setTimeout(() => {
          window.scrollTo({
            top: 0,
            behavior: 'smooth', // Smooth scrolling
          });
        }, 0)
        dispatch(setGlobalState({
          novelTitle: newTitle, replaceStatus: false, rewriteDualScreen: false,
          translateDualScreen: false, freeRewritingText: '', editorStatus: true,
          novelSummary: '', novelTable: '', titleRecord: { oldTitle: oldTitle, status: true },
          selectRightMenu: '', informationGenerationStatus: false, informationCreationStatus: false,
          newsSubscriptionCreationStatus: false, newsSubscriptionGenerationStatus: false
        }))
        break;

      default:
        break;
    }
  }

  const onLanguageSubmenu = (item: { value: string, label: string }) => {
    return (
      <Popover key={item.value}>
        <PopoverTrigger asChild>
          <Button key={item.value} size="sm" className="mx-3">
            {item.label}
            <IoIosArrowForward />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-52 p-1 z-[9999]" align='center' side='top'>
          <div>
            {
              languageMenuList.map((item2) => (
                <Button
                  variant="ghost"
                  key={item2.value}
                  className={`hover:text-[#8e47f0] w-full flex justify-between ${selectLanguage === item2.value && 'text-[#8e47f0]'}`}
                  size="sm"
                  onClick={() => {
                    const htmlContent = removeColgroupTags(highlightCodeblocks(editorInstanceCopy.getHTML()));
                    const data = html2md(htmlContent)
                    const langCode = franc(data);
                    if (langCode === item2.language) {
                      editorInstanceCopy.chain().clearContent().run()
                      editorInstanceCopy.chain().focus().insertContentAt(1, data).run();
                      dispatch(setGlobalState({ translateDualLanguage: item2.value }));
                      window.scrollTo({
                        top: 0,
                        behavior: 'smooth',
                      });
                    } else {
                      dispatch(setGlobalState({ translateDualLanguage: item2.value }))
                      onClickButton(item.value, item2.value)
                    }
                  }}
                >
                  <span>{item2.label}</span>
                </Button>
              ))
            }
          </div>
        </PopoverContent>
      </Popover>
    )
  }

  return (
    <div className="fixed bottom-3 right-[62px] z-[9998]">
      {DUAL_SCREEN_BUTTON.map((item) => {
        if (global.translateDualScreen && item.value === 'Regenerate') {
          return (onLanguageSubmenu(item))
        } else {
          return <Button key={item.value} size="sm" className="mx-3" onClick={() => { onClickButton(item.value) }}>{item.label}</Button>
        }
      })}
    </div>
  )
}
"use client";
import { defaultEditorContent } from "@/lib/content";
import { EditorContent, EditorRoot, type EditorInstance, type JSONContent, } from "novel";
import { ImageResizer, handleCommandNavigation } from "novel/extensions";
import { useEffect, useRef, useState } from "react";
import { defaultExtensions } from "./extensions";
import { handleImageDrop, handleImagePaste } from "novel/plugins";
import { uploadFn } from "./image-upload";
import { slashCommand } from "./slash-command";
import { useAppDispatch, useAppSelector } from "@/app/store/hooks";
import { selectGlobal, setGlobalState } from "@/app/store/globalSlice";
import Highlight from '@tiptap/extension-highlight';
import DualScreenButton from "./DualScreenButton";
import { toast } from "./ui/use-toast";
import { getLocalStorage } from "@/lib/utils";
import { ErrMessage } from "@/app/componets/ErrMessage";
import React from "react";
import { Loader2 } from "lucide-react";
import { useCompletion } from "ai/react";
import { useTranslations } from "next-intl";

const extensions = [...defaultExtensions, slashCommand, Highlight.configure({ multicolor: true })];

interface IProps { className: string, editorInstance: EditorInstance | null, language: 'chinese' | 'english' | 'japanese' }
const TailwindAdvancedEditorCopy = (props: IProps) => {
  const t = useTranslations();
  const dispatch = useAppDispatch();
  const [lingo, setLingo] = useState('')
  const [title, setTitle] = useState('');
  const global = useAppSelector(selectGlobal);
  const { className, language, editorInstance } = props;
  const [initialContent, setInitialContent] = useState<null | JSONContent>(null);
  const [editorInstanceCopy, setEditorInstanceCopy] = useState<EditorInstance | null>(null);
  const [position, setPosition] = useState<{ from: number, to: number }>({ from: 0, to: 0 })

  useEffect(() => {
    setInitialContent(defaultEditorContent);
  }, []);

  useEffect(() => {
    const { saveStatus, translateDualScreen } = global;
    if (!saveStatus) {
      if (editorInstance && editorInstanceCopy && translateDualScreen) {
        // Retrieve the content and index of the current operation
        const state = editorInstance.state;
        const selection = state.selection;
        // Get the block where the current selection is located
        const resolvedPos = state.doc.resolve(selection.anchor);
        // @ts-ignore
        const blockIndex = resolvedPos.path[1]; // Get the index of the block
        const markdown = localStorage.getItem('markdown')
        const markdownBlocks = markdown.split('\n\n');
        // Retrieve Markdown data for the current block
        const blockContent = markdownBlocks[blockIndex];

        if (!blockContent) {
          deleteBlock(blockIndex)
          return
        };
        const updateBlockContent = (blockIndex) => {
          const { state } = editorInstanceCopy;
          // Retrieve the content of the document
          const doc = state.doc;
          // Get the node of the block
          let [from, to] = [0, 0];
          for (let i = 0; i < blockIndex; i++) {
            from += doc.child(i).nodeSize;
          }
          if (from === 0 && blockIndex > 0) {
            let prevFrom = 0;
            for (let i = 0; i < blockIndex - 1; i++) {
              prevFrom += doc.child(i).nodeSize;
            }
            const prevBlock = doc.child(blockIndex - 1);
            from = prevFrom + prevBlock.nodeSize;
          }
          // Calculate the end position of the block (to)
          if (doc.childCount > blockIndex) {
            const blockNode = doc.child(blockIndex);
            to = from + blockNode.nodeSize;
          }
          setPosition({ from, to: to < 1 ? from : to - 1 })
          stop();
          isFirstUpdate.current = true;
          complete(blockContent, {
            body: {
              type: 'translate',
              params: { language: lingo || global.translateDualLanguage, },
            }
          })
        };
        updateBlockContent(blockIndex)
      }
    }
  }, [global.saveStatus])

  useEffect(() => {
    // Ensure that the editor content is updated
    if (editorInstanceCopy) {
      editorInstanceCopy.commands.setContent(initialContent || []);
    }

  }, [initialContent]);

  const deleteBlock = (blockIndex: number) => {
    try {
      const doc = editorInstanceCopy.state.doc;
      const blockNode = doc.child(blockIndex);
      if (blockNode.textContent?.trim()) {
        let from = 0;
        for (let i = 0; i < blockIndex; i++) {
          from += doc.child(i).nodeSize;
        }
        editorInstanceCopy.commands.deleteRange({
          from,
          to: from + blockNode.nodeSize
        });
      }
    } catch (error) {
    }
  };

  const isInitialized = useRef(false);
  const { completion, complete, setCompletion, stop, isLoading } = useCompletion({
    id: "sideScreen",
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

  const onHandleRewriteDualScreen = () => {
    const type = global.freeRewritingText ? 'free rewriting' : 'rewrite';
    const content = getLocalStorage('markdown')
    stop();
    complete(content, {
      body: {
        type,
        params: {
          tips: global.freeRewritingText,
        },
      }
    })
  }

  const translateTarget = useRef('')
  const onHandleTranslate = (type: 'title' | 'fullText', lang?: string) => {
    const novelTitle = localStorage.getItem('novel-title');
    const content = getLocalStorage('markdown')
    const prompt = type === 'title' ? novelTitle : content;
    translateTarget.current = type;
    if (type === 'title') {
      setTitle('');
    }
    stop();
    complete(prompt, {
      body: {
        type: 'translate',
        params: { language: lang || global.translateDualLanguage, },

      }
    })
  }

  // Monitor full text rewriting
  useEffect(() => {
    if (global.freeRewritingStatus && (global.translateDualScreen && isInitialized.current)) {
      isInitialized.current = false;
    }
    if (global.freeRewritingStatus && !isInitialized.current) {
      const novelTitle = localStorage.getItem('novel-title')
      setTitle(novelTitle)
      isInitialized.current = true;
      onHandleRewriteDualScreen();
      dispatch(setGlobalState({ informationGenerationStatus: false, informationCreationStatus: false, translateDualScreen: false, newsSubscriptionCreationStatus: false, newsSubscriptionGenerationStatus: false }))
    }
  }, [global.freeRewritingStatus, isInitialized.current])

  // Full text translation
  useEffect(() => {
    if (global.translateDualScreen && !isInitialized.current) {
      isInitialized.current = true;
      onHandleTranslate('title');
      dispatch(setGlobalState({ informationGenerationStatus: false, freeRewritingStatus: false, informationCreationStatus: false, newsSubscriptionCreationStatus: false, rewriteDualScreen: false, newsSubscriptionGenerationStatus: false }))
    }
  }, [global.translateDualScreen, isInitialized.current])


  // Listening to information creation
  useEffect(() => {
    if ((global.informationGenerationStatus || global.newsSubscriptionGenerationStatus) && (global.translateDualScreen && isInitialized.current)) {
      isInitialized.current = false;
    }
    if ((global.informationGenerationStatus || global.newsSubscriptionGenerationStatus) && !isInitialized.current) {
      isInitialized.current = true;
      stop();
      complete('', {
        body: {
          type: 'articleGeneration',
          params: {
            template: global.informationTemplate,
            language: global.informationLang,
            urls: global.informationUrl,
          },
        }
      })
      dispatch(setGlobalState({ freeRewritingStatus: false, translateDualScreen: false, rewriteDualScreen: false }))
    }
  }, [global.informationGenerationStatus, global.newsSubscriptionGenerationStatus, isInitialized.current])

  // data fetch
  const isFirstUpdate = useRef(true);
  const prevContent = useRef('');
  useEffect(() => {
    if (completion && !completion?.endsWith('-') && isLoading) {
      if (global.translateDualScreen && translateTarget.current === 'title') {
        setTitle(completion);
        return
      }
      try {
        const endPosition = editorInstanceCopy.state.doc.content.size;
        const data = completion.replace(/!\[.*?\]\(.*?\)/g, '\n$&\n');
        if (position.to || position.from) {
          if (isFirstUpdate.current) {
            editorInstanceCopy
              .chain()
              .focus()
              .deleteRange(position)
              .insertContentAt(position.from, data)
              .run();
            isFirstUpdate.current = false;
            prevContent.current = data
          } else {
            const newContent = data.slice(prevContent.current.length);
            const { from } = editorInstanceCopy.state.selection;
            editorInstanceCopy
              .chain()
              .insertContentAt(from, newContent)
              .run();
            prevContent.current = data
          }
        } else {
          editorInstanceCopy
            .chain()
            .focus()
            .insertContentAt({ from: 0, to: endPosition }, data)
            .run();
        }
      } catch (error) {

      }
    } else {
      setCompletion('')
    }
    if (global.translateDualScreen && !isLoading && translateTarget.current === 'title' && title) {
      onHandleTranslate('fullText', lingo)
    }
    if (completion && !isLoading) {
      if (global.informationCreationStatus || global.newsSubscriptionCreationStatus || global.freeRewritingStatus) {
        isInitialized.current = false;
      }
      dispatch(setGlobalState({ informationGenerationStatus: false, newsSubscriptionGenerationStatus: false, freeRewritingStatus: false }))
    }
  }, [completion, isLoading, translateTarget.current])

  if (!initialContent) return null;

  return (
    <div className={`relative w-full border-l`} style={{ height: 'revert' }}>
      <EditorRoot>
        {isLoading && (<div className='sticky mr-3 top-[50px] flex justify-end items-center z-[9999] text-[#8e47f0] text-sm'>
          {t('AI_is_thinking')}
          <Loader2 className="animate-spin" style={{ width: 16, height: 16 }} />
        </div>)}
        <div className={`${className} px-[35px] pt-[5px] pb-[25px] flex items-center  shadow-none ${(global.informationCreationStatus || global.newsSubscriptionCreationStatus) && 'hidden'}`}>
          <p className="text-3xl font-bold border-0">{title}</p>
        </div>
        <EditorContent
          initialContent={initialContent}
          extensions={extensions}
          editable={false}
          injectCSS={true}
          className={`editorInstanceCopy relative w-full border-muted bg-background ${className} editorContent shadow-none`}
          editorProps={{
            handleDOMEvents: {
              keydown: (_view, event) => handleCommandNavigation(event),
            },
            handlePaste: (view, event) => handleImagePaste(view, event, uploadFn),
            handleDrop: (view, event, _slice, moved) => handleImageDrop(view, event, moved, uploadFn),
            attributes: {
              class:
                "prose prose-lg dark:prose-invert prose-headings:font-title font-default focus:outline-none max-w-full",
            },
          }}
          onCreate={({ editor }) => {
            setEditorInstanceCopy(editor)
          }}
          onUpdate={({ editor }) => {
            setEditorInstanceCopy(editor)
          }}
          slotAfter={<ImageResizer />}
        >
          {!isLoading ?
            <DualScreenButton
              language={language}
              title={title}
              editorInstanceCopy={editorInstanceCopy}
              editorInstance={editorInstance}
              onRegenerate={(lingo?: string) => {
                if (editorInstanceCopy) {
                  if (global.rewriteDualScreen) {
                    onHandleRewriteDualScreen();
                  } else {
                    setLingo(lingo)
                    editorInstanceCopy.chain().clearContent().run();
                    onHandleTranslate('title', lingo)
                  }
                }
              }} />
            : <></>
          }
        </EditorContent>
      </EditorRoot>
    </div>
  );
};

export default TailwindAdvancedEditorCopy;

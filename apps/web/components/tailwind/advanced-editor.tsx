"use client";

const hljs = require('highlight.js');

import dayjs from 'dayjs';
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { toast } from "./ui/use-toast";
import { Loader2 } from 'lucide-react';
import { uploadFn } from "./image-upload";
import { Separator } from "./ui/separator";
import { defaultExtensions } from "./extensions";
import { PiMagicWandFill } from "react-icons/pi";
import { removeColgroupTags } from "@/lib/utils";
import { useEffect, useRef, useState } from "react";
import Highlight from '@tiptap/extension-highlight';
import { useDebouncedCallback } from "use-debounce";
import { defaultEditorContent } from "@/lib/content";
import { TextButtons } from "./selectors/text-buttons";
import { ErrMessage } from "@/app/componets/ErrMessage";
import { NodeSelector } from "./selectors/node-selector";
import { selectGlobal, setGlobalState } from "@/app/store/globalSlice";
import { ColorSelector } from "./selectors/color-selector";
import { ContentAction } from "./selectors/content.action";
import FindAndReplace from "@/app/componets/FindAndReplace";
import { slashCommand, suggestionItems } from "./slash-command";
import { handleImageDrop, handleImagePaste } from "novel/plugins";
import { useAppDispatch, useAppSelector } from "@/app/store/hooks";
import GenerativeMenuSwitch from "./generative/generative-menu-switch";
import { ImageResizer, handleCommandNavigation, Placeholder, addAIHighlight, removeAIHighlight } from "novel/extensions";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";
import { QUICK_INSERT_MENU } from "@/lib/language";
import { EditorCommand, EditorCommandEmpty, EditorCommandItem, EditorCommandList, EditorContent, EditorRoot, type EditorInstance, type JSONContent, } from "novel";
import { TextSelection } from 'prosemirror-state';
import { MdClose, MdSend } from 'react-icons/md';
import { TableMenu } from './ui/TableMenu';
import html2md from 'html-to-md'
import CustomPlugin from '@/lib/CustomPlugin';
import { useCompletion } from 'ai/react';
import { useTranslations } from 'next-intl';
import { MermaidExtension } from './mermaid/MermaidExtension';
import { MermaidMenu } from './mermaid/MermaidMenu';

const extensions = [...defaultExtensions, MermaidExtension, slashCommand, Highlight.configure({ multicolor: true })];

interface IProps { className: string, language: 'chinese' | 'english' | 'japanese', onEditorCreate }

const TailwindAdvancedEditor = (props: IProps) => {
  const t = useTranslations();
  const dispatch = useAppDispatch()
  const global = useAppSelector(selectGlobal);
  const { className, language, onEditorCreate } = props;

  const inputRef = useRef(null);
  const editorRef = useRef(null);
  const generateTarget = useRef('')
  const generateLongParams = useRef({ plan: '', written: '', sections: [] })
  const [openAI, setOpenAI] = useState(false);
  const [openNode, setOpenNode] = useState(false);
  const [openColor, setOpenColor] = useState(false);
  const [initialContent, setInitialContent] = useState<null | JSONContent>(null);
  const [editorInstance, setEditorInstance] = useState<EditorInstance | null>(null);
  const [quickInsertion, setQuickInsertion] = useState({ content: '', sub: 0, empty: true, request: '' });
  const [selectView, setSelectView] = useState({ from: 0, to: 0 })
  const [insertContent, setInsertContent] = useState('')
  const [illustration, setIllustration] = useState('');
  const [openAiQuickInsertion, setOpenAiQuickInsertion] = useState({ open: false, title: "", isLoad: false })
  const [popupPosition, setPopupPosition] = useState({ left: 0, top: 0 })


  //Apply Codeblock Highlighting on the HTML from editor.getHTML()
  const highlightCodeblocks = (content: string) => {
    const doc = new DOMParser().parseFromString(content, 'text/html');
    doc.querySelectorAll('pre code').forEach((el) => {
      // @ts-ignore
      // https://highlightjs.readthedocs.io/en/latest/api.html?highlight=highlightElement#highlightelement
      hljs.highlightElement(el);
    });
    return new XMLSerializer().serializeToString(doc);
  };

  // Store data
  const debouncedUpdates = useDebouncedCallback(async (editor: EditorInstance) => {
    const json = editor.getJSON();
    const htmlContent = removeColgroupTags(highlightCodeblocks(editor.getHTML()));
    const markdown = html2md(htmlContent, { emptyTags: ["colgroup"] })
    window.localStorage.setItem("novel-content", JSON.stringify(json));
    window.localStorage.setItem("markdown", markdown);
    window.localStorage.setItem("html-content", htmlContent);
    window.localStorage.setItem("txt-content", editor.getText());
    dispatch(setGlobalState({ saveStatus: false, novelContent: json, markdown }))
  }, 500);

  // Generate title or content
  const onGenerateContentOrTitle = async () => {
    let [type, content] = ['', '']
    if (global.novelTitle) {
      type = 'generate content';
      content = global.novelTitle;
    }
    if (editorInstance?.getText()) {
      type = 'generate title';
      content = editorInstance.getText();
    }
    generateTarget.current = type;
    editorInstance.setEditable(false)
    complete(content, {
      body: {
        type,
      }
    })
  }

  // Quick insertion
  const onQuickInsertion = async () => {
    generateTarget.current = 'quick insertion';
    complete(quickInsertion.content, {
      body: {
        type: 'quick insertion',
        params: {
          title: global.novelTitle,
          request: quickInsertion.request
        },
      }
    })
  }

  const { completion, complete, setCompletion, stop, isLoading } = useCompletion({
    id: "Advanced editor",
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

  const ReplaceQuicklyGeneratedData = () => {
    if (illustration) {
      const position = quickInsertion.sub > 1 ? { from: quickInsertion.sub, to: quickInsertion.sub + 1 } : editorInstance.state.doc.content.size;
      editorInstance.chain().focus().insertContentAt(position, `![Description of Image](${illustration})`).run();
      setIllustration('');
    } else {
      editorInstance.chain().focus().insertContentAt({ from: quickInsertion.sub, to: quickInsertion.sub + 1 }, insertContent).run();
    }
    setOpenAiQuickInsertion({ open: false, title: '', isLoad: false })
    dispatch(setGlobalState({ illustrationStatus: false }))
    setInsertContent(() => '')
    setQuickInsertion({ content: '', sub: 0, empty: true, request: '' })
    setPopupPosition({ left: 0, top: 0 })
  }

  const onGetPosition = () => {
    if (editorInstance) {
      const state = editorInstance.view.state;
      const selection = state.selection;
      // Get the anchor position of the current selection
      const anchorPos = selection.anchor;
      // Retrieve all content from the beginning of the document to the current selection anchor position
      const contentBeforeSelection = state.doc.textBetween(0, anchorPos, ' ');
      setQuickInsertion((v) => ({ ...v, content: contentBeforeSelection, sub: anchorPos }))
      // Using coordsAtPos to obtain the coordinates of anchor point positions
      const coords = editorInstance.view.coordsAtPos(anchorPos);
      // Coords.top and coords.left are coordinates relative to the editor viewport
      const { top, left } = coords;
      // If you need coordinates relative to the entire screen, you can add the editor's offset
      const editorRect = editorRef.current.getBoundingClientRect();
      let screenTop = top - editorRect.top;
      let screenLeft = left - editorRect.left - 450;
      // Limit the left boundary to ensure that pop ups do not exceed the screen
      screenLeft = screenLeft < 0 ? 0 : screenLeft;
      setPopupPosition({ left: screenLeft < 0 ? 0 : screenLeft, top: screenTop })
    }
  }

  // Ensure that the editor content is updated
  useEffect(() => {
    if (editorInstance) {
      editorInstance.commands.setContent(initialContent);
    }
  }, [initialContent]);

  useEffect(() => {
    const handleClick = (event) => {
      const dragHandle = event.target.closest('.drag-handle');
      if (dragHandle && editorInstance) {
        // Get the coordinates of the current click location
        const rect = dragHandle.getBoundingClientRect();
        const coords = {
          left: rect.left,
          top: rect.top,
        };
        const posAt = editorInstance.view.posAtCoords(coords);
        if (!posAt) return;
        const resolvedPos = editorInstance.state.doc.resolve(posAt.pos);
        // @ts-ignore
        const blockIndex = resolvedPos.path[1]; // Get the index of the block
        const blockNode = editorInstance.state.doc.child(blockIndex);
        const selection = TextSelection.create(editorInstance.state.doc, posAt.pos, blockNode.nodeSize - 1 + posAt.pos);
        setSelectView({ from: posAt.pos, to: blockNode.nodeSize - 1 + posAt.pos });
        const tr = editorInstance.state.tr.setSelection(selection).scrollIntoView();
        // Use Dispatch to apply selection and update editor status
        editorInstance.view.dispatch(tr);
        editorInstance.view.focus();
      }
    };

    document.addEventListener('mousedown', handleClick);
    return () => {
      document.removeEventListener('mousedown', handleClick);
    };
  }, [editorInstance]);

  // Monitor language changes
  useEffect(() => {
    // If there is an old editor instance, destroy it
    if (editorInstance) {
      // Update the configuration of Placeholder plugin
      const placeholderPlugin = editorInstance.extensionManager.extensions.find(
        (extension) => extension.name === 'placeholder'
      );
      if (placeholderPlugin) {
        // Update placeholder content here by reconfiguring
        placeholderPlugin.options.placeholder = t('editor_input_tips');
        // Force plugin to re render
        editorInstance.view.dispatch(
          editorInstance.view.state.tr.setMeta('placeholder', true)
        );
      }
    }
  }, [language]);

  // Set initial value
  useEffect(() => {
    const content = window.localStorage.getItem("novel-content");
    const novelTitle = window.localStorage.getItem("novel-title");
    if (content) {
      const json = JSON.parse(content);
      setInitialContent(json)
      dispatch(setGlobalState({ novelContent: json, novelTitle: novelTitle || '' }))
    } else {
      setInitialContent(defaultEditorContent);
      window.localStorage.setItem("novel-title", '');
      window.localStorage.setItem("novel-id", `${dayjs().valueOf()}`);
      window.localStorage.setItem("createdAt", dayjs().format('YYYY-MM-DD HH:mm:ss'));
    };
  }, [global.renew]);

  // Monitor CTRL+F to open the query window
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.ctrlKey && ['f', 'F'].includes(event.key)) {
        const findAndReplaceVisible = global.findAndReplaceVisible
        dispatch(setGlobalState({ findAndReplaceVisible: !findAndReplaceVisible }))
        event.preventDefault(); // 防止浏览器默认的查找行为
      }
      if (editorInstance) {
        if (event.ctrlKey && ['z', 'Z'].includes(event.key)) {
          event.preventDefault(); // 防止浏览器默认的查找行为
          const { titleRecord } = global
          if (titleRecord.status) {
            localStorage.setItem('novel-title', titleRecord.oldTitle)
            dispatch(setGlobalState({ novelTitle: titleRecord.oldTitle, titleRecord: { oldTitle: '', status: false } }))
          }
          event.preventDefault(); // 防止浏览器默认的查找行为
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [global.findAndReplaceVisible, editorInstance, global.novelTitle]);

  useEffect(() => {
    if (openAiQuickInsertion.open && inputRef.current) {
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 0);
    }
    if (global.editorStatus) {
      setOpenAiQuickInsertion({ open: false, title: '', isLoad: false })
      setInsertContent(() => '')
      setQuickInsertion({ content: '', sub: 0, empty: true, request: '' })
      dispatch(setGlobalState({ editorStatus: false, illustrationStatus: false }))
    }
  }, [openAiQuickInsertion.open, global.editorStatus])

  useEffect(() => {
    if (editorInstance) {
      const { view } = editorInstance;
      // Save current selection
      view.dom.addEventListener('mouseup', (event) => {
        const selection = document.getSelection();
        if (selection && !selection.isCollapsed && editorInstance?.isEditable) {
          const slice = editorInstance.state.selection.content();
          const text = editorInstance.storage.markdown.serializer.serialize(slice.content);
          removeAIHighlight(editorInstance)
          addAIHighlight(editorInstance, '#a800ff5c')
          dispatch(setGlobalState({ chatSelectText: text }))
        } else {
          removeAIHighlight(editorInstance)
        }
      });
    }

  }, [editorInstance])

  useEffect(() => {
    if (completion && !completion?.endsWith('-') && isLoading) {
      if (generateTarget.current === 'quick insertion') {
        setInsertContent(completion)
      }
      if (generateTarget.current === 'generate title') {
        dispatch(setGlobalState({ novelTitle: completion.replace(/^#/, "") }))
        return
      }
      if (generateTarget.current === 'generate content' || generateTarget.current === 'Ultra long writing next') {
        let data = completion
        try {
          const endPosition = editorInstance.state.doc.content.size;
          editorInstance.chain().focus().insertContentAt({ from: 0, to: endPosition }, data).run();
          window.scrollTo({
            top: document.documentElement.scrollHeight,
            behavior: 'smooth'
          });
        } catch (error) {

        }
      }
    }
    if (completion && !isLoading) {
      editorInstance?.setEditable(true)
      if (generateTarget.current === 'generate title') {
        window.localStorage.setItem("novel-title", completion.replace(/^#/, ""));
      }
      toast({
        duration: 2000,
        description: (t('editor_ai_writing_completed'))
      })
      setCompletion('');
    }
  }, [completion, isLoading, generateTarget.current])

  if (!initialContent) return null;
  return (
    <div className={`relative w-full h-full`}>
      <EditorRoot>
        <div className={`${className} py-3 px-7 flex items-center shadow-none`}>
          <Input
            type="text"
            value={global.novelTitle}
            disabled={isLoading}
            onChange={(e) => {
              dispatch(setGlobalState({ novelTitle: e.target.value }))
              window.localStorage.setItem("novel-title", e.target.value);
            }}
            placeholder={t('editor.Click_to_enter_title')}
            className="text-3xl font-bold h-16 border-0"
          />
          {((!editorInstance?.getText() && global.novelTitle) ||
            (!global.novelTitle && editorInstance?.getText())) && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant='ghost' disabled={isLoading} className="text-[#8e47f0] rounded-[100%] w-12 h-12" onClick={onGenerateContentOrTitle}>
                      {
                        isLoading ? <Loader2 className="animate-spin" style={{ width: 20, height: 20 }} />
                          : <PiMagicWandFill className="text-lg" />
                      }
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {editorInstance?.getText() && (<p>{t('editor.AI_generates_titles')}</p>)}
                    {global.novelTitle && (<p>{t('editor.AI_generates_text')}</p>)}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
        </div>

        <TableMenu editor={editorInstance} />
        <MermaidMenu editor={editorInstance} />
        <EditorContent
          initialContent={initialContent}
          ref={editorRef}
          extensions={[...extensions, ...CustomPlugin, Placeholder.configure({ placeholder: t('editor_input_tips'), includeChildren: true, }),]}
          className={`relative min-h-[100vh] h-full w-full border-muted bg-background ${className} editorContent shadow-none `}
          editorProps={{
            handleDOMEvents: {
              keydown: (_view, event) => handleCommandNavigation(event),
            },
            handlePaste: (view, event) => handleImagePaste(view, event, uploadFn),
            handleDrop: (view, event, _slice, moved) => handleImageDrop(view, event, moved, uploadFn),
            handleKeyDown: (view, event) => {
              if (!openAiQuickInsertion.open) return;
              if (event.key === '/') {
                onGetPosition();
              } else {
                setQuickInsertion((v) => ({ ...v, content: "", sub: 0 }))
                setPopupPosition({ left: 0, top: 0 })
              }
            },
            attributes: {
              class:
                "prose prose-lg dark:prose-invert prose-headings:font-title font-default focus:outline-none max-w-full",
            },
          }}
          onCreate={({ editor }) => {
            if (onEditorCreate) {
              setEditorInstance(editor)
              onEditorCreate(editor);
            }
          }}
          onUpdate={({ editor }) => {
            if (onEditorCreate) {
              setEditorInstance(editor)
              onEditorCreate(editor);
            }
            dispatch(setGlobalState({ saveStatus: true }))
            debouncedUpdates(editor);
          }}
          onFocus={({ editor }) => {
            setEditorInstance(editor)
            onEditorCreate(editor);
            debouncedUpdates(editor);
          }}
          slotAfter={<ImageResizer />}
        >
          <EditorCommand
            className="z-50 h-auto max-h-[330px] overflow-y-auto rounded-md border border-muted bg-background px-1 py-2 shadow-md transition-all"
            shouldFilter={true}
            vimBindings={true}
            filter={(value: string, search: string) => {
              return Number(value.includes(search));
            }}
          >
            <EditorCommandEmpty className="px-2 text-muted-foreground">No results</EditorCommandEmpty>
            <EditorCommandList className="w-60">
              {suggestionItems.filter(f => f.title !== 'AI' || quickInsertion.empty).map((item) => {
                return (
                  <EditorCommandItem
                    key={item.title}
                    onCommand={(val) => {
                      onGetPosition();
                      if (["AI"].includes(item.title)) {
                        setOpenAiQuickInsertion((v) => ({ ...v, open: true, title: item.title }));
                      }
                      if (["Generate illustrations", 'FlowChart'].indexOf(item.title) > -1) {
                        const state = editorInstance.view.state;
                        const selection = state.selection;
                        // 获取当前选区的锚点位置
                        const anchorPos = selection.anchor;
                        dispatch(setGlobalState({
                          selectRightMenu: item.title === 'FlowChart' ? 'FlowChart' : 'IntelligentMapping',
                          intelligentInsert: anchorPos
                        }))
                      }
                      return item.command({ ...val })
                    }}
                    value={QUICK_INSERT_MENU(t)[item.title]?.shortcutKeys}
                    className="flex w-full items-center space-x-2 rounded-md px-2 py-1 text-left text-sm hover:bg-accent aria-selected:bg-accent"
                  >
                    {
                      <div
                        className={
                          `flex w-full items-center space-x-2 rounded-md px-2 py-1 text-left text-sm aria-selected:bg-accent 
                           hover:bg-accent ${["Generate illustrations", "AI"].includes(item.title) ? 'text-[#8e47f0] ' : 'text-[#606060]'} aria-selected:bg-accent`
                        }
                        id={item.title}
                      >
                        <div className="flex h-10 w-10 items-center justify-center rounded-md border border-muted bg-background">
                          {item.icon}
                        </div>
                        <div className="font-medium flex justify-between items-center cursor-pointer w-full pr-2 ">
                          <span>{QUICK_INSERT_MENU(t)[item.title]?.name || item.title}{item.title === 'AI' ? t('Writing') : ''}</span>
                          <span>{QUICK_INSERT_MENU(t)[item.title]?.shortcutKeys}</span>
                        </div>
                      </div>
                    }
                  </EditorCommandItem>
                )
              })}
            </EditorCommandList>
          </EditorCommand>
          <GenerativeMenuSwitch open={openAI} onOpenChange={setOpenAI} selectView={selectView}>
            <Separator orientation="vertical" />
            <NodeSelector open={openNode} onOpenChange={setOpenNode} language={language} />
            <Separator orientation="vertical" />
            <ColorSelector open={openColor} onOpenChange={setOpenColor} language={language} />
            <Separator orientation="vertical" />
            <TextButtons />
            <Separator orientation="vertical" />
            <Separator orientation="vertical" />
            <ContentAction />
          </GenerativeMenuSwitch>
          {/* 查询窗口 */}
          {global.findAndReplaceVisible && (<FindAndReplace language={language} onclose={() => { dispatch(setGlobalState({ findAndReplaceVisible: false })) }} />)}
          {
            openAiQuickInsertion.open && (
              <div className={`
                absolute border-t text-sm bg-background md:w-[450px] w-full z-[9] rounded-[5px] px-[10px] py-[20px]
                left-[${popupPosition.left < 1 && popupPosition.top < 1 ? "50%" : `${popupPosition.left}px`}]
                ${(popupPosition.left < 1 && popupPosition.top < 1) && "-translate-x-1/2"}
              `}
                style={{ top: popupPosition.top + 55, boxShadow: '0px 0px 5px rgba(0, 0, 0, 0.3)' }}
              >
                <MdClose className=" absolute right-0 top-0 cursor-pointer text-2xl" onClick={() => {
                  setInsertContent('')
                  setIllustration('')
                  setPopupPosition({ left: 0, top: 0 })
                  dispatch(setGlobalState({ illustrationStatus: false }))
                  setOpenAiQuickInsertion({ open: false, title: '', isLoad: false })
                  setQuickInsertion({ content: '', sub: 0, empty: true, request: '' })
                }} />
                <div className='flex justify-between items-center'>
                  <Input
                    className="border-0 h-8 text-sm "
                    ref={inputRef}
                    placeholder={openAiQuickInsertion.title === 'AI' ? t('Please_enter_the_requirements') : t('editor.Please_enter_the_prompt_words_for_the_illustration')}
                    readOnly={isLoading}
                    autoFocus
                    onChange={(e) => { setQuickInsertion((v) => ({ ...v, request: e.target.value })) }}
                    onKeyDown={(e) => {
                      setTimeout(() => {
                        const dom = window.document.getElementById("freeRewritingBut")
                        if (e?.key === "Enter" && dom) dom.click()
                      }, 10)
                    }}
                  />
                  <div id="freeRewritingBut" onClick={async () => {
                    if (openAiQuickInsertion.title !== 'AI' && !quickInsertion.request) {
                      toast({
                        duration: 2000,
                        description: t('editor.Please_enter_the_prompt_words_for_the_illustration')
                      })
                      return;
                    }
                    if (!quickInsertion.request && !quickInsertion.content && !global.novelTitle) {
                      toast({
                        duration: 2000,
                        description: t('editor_Using_AI_writing_tips')
                      })
                      return;
                    }
                    setInsertContent(() => '')
                    setIllustration(() => '')
                    if (openAiQuickInsertion.title === 'AI') {
                      await onQuickInsertion()
                    } else {
                      // setOpenAiQuickInsertion((v) => ({ ...v, isLoad: true }));
                      // await generateIllustration()
                    }
                  }}>
                    {
                      (isLoading || openAiQuickInsertion.isLoad) ? <Loader2 className="animate-spin" style={{ width: 20, height: 20 }} />
                        : <MdSend className="text-[20px] cursor-pointer text-[#8e47f0]" />
                    }
                  </div>
                </div>
                {(insertContent || illustration) && (
                  <div className='border mt-2'>
                    <div className='p-2 mb-2 max-h-[65vh] overflow-y-auto custom-scrollbar'>
                      {openAiQuickInsertion.title === 'AI' ?
                        insertContent.replace(/^#/, "") :
                        <img src={illustration} alt="" />
                      }
                    </div>
                    <div className='flex justify-end items-center p-2'>
                      <Button size='sm' className='mr-2' onClick={() => ReplaceQuicklyGeneratedData()}>{t('editor.apply')}</Button>
                      <Button
                        size='sm'
                        onClick={() => {
                          const dom = window.document.getElementById("freeRewritingBut");
                          if (dom) dom.click()
                        }}
                      >{t('Regenerate')}</Button>
                    </div>
                  </div>
                )}
              </div>
            )
          }
        </EditorContent>
      </EditorRoot>
    </div >
  );
};

export default TailwindAdvancedEditor;

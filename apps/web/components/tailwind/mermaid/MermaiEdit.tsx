import mermaid from "mermaid";
import type { EditorInstance } from "novel";
import MonacoEditor from '@monaco-editor/react';
import { useEffect, useRef, useState } from "react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../ui/alert-dialog';
import { useTranslations } from "next-intl";

export const MermaiEdit = (props: { buttonIcon: JSX.Element, editor: EditorInstance, initialText?: string, onCallback?: (text: string) => void }) => {
  const { buttonIcon, editor, initialText, onCallback } = props;
  const mermaidrEditRef = useRef<HTMLDivElement>(null);
  const [mediumText, setMediumText] = useState('');
  const [mermaidError, setMermaidError] = useState('');
  const t = useTranslations()

  const onCommand = () => {
    if (initialText) {
      onCallback(mediumText);
      return;
    }
    const { state } = editor;
    const { selection } = state;
    const { $from } = selection;
    const text = "```mermaid\n" +
      `${mediumText}\n` +
      "```"
    // 查找当前 Mermaid 节点
    let mermaidNodePos = null;
    let mermaidNode = null;
    for (let d = $from.depth; d > 0; d--) {
      const node = $from.node(d);
      if (node.type.name === 'mermaid') {
        mermaidNodePos = $from.before(d);
        mermaidNode = node;
        break;
      }
    }
    if (mermaidNodePos !== null && mermaidNode) {
      if (mediumText !== null) {
        // 删除原有的节点
        editor.chain().focus().setNodeSelection(mermaidNodePos).deleteSelection().run();
        // 添加新的节点
        editor.chain().focus().insertContentAt(
          selection.$from.pos - selection.$from.parentOffset,
          {
            type: 'mermaid',
            content: [{ type: 'text', text }],
          },
          { updateSelection: true }
        ).run();
        onClear();
      }
    }
  }

  const getmermaidContent = (text: string) => {
    const mermaidContent = text?.replace(/^[\s\S]*?```mermaid\s*\n?/, '').replace(/```[\s\S]*$/, '').trim();
    return mermaidContent;
  }

  const onClear = () => {
    setMediumText('');
    setMermaidError('');
    mermaidrEditRef.current = null;
  }

  useEffect(() => {
    if (mermaidrEditRef.current && mediumText) {
      mermaid.initialize({ startOnLoad: false, theme: 'default' });
      mermaidrEditRef.current.innerHTML = mediumText;
      if (mediumText) {
        mermaid.parse(mediumText).then(res => {
          mermaid?.render(`mermaid-${Date.now()}`, mediumText)?.then(({ svg }) => {
            mermaidrEditRef.current.innerHTML = svg;
            setMermaidError('');
          }).catch((error) => {
            console.log('==========error', error);
            setMermaidError(error.message)
          });
        }).catch((error) => {
          console.log('==========error', error);
          setMermaidError(error.message)
        })
      }
    }
  }, [mediumText, mermaidrEditRef.current]);

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <button
          className="text-stone-600 hover:bg-stone-100 active:bg-stone-200 w-full"
          onClick={() => {
            let text = getmermaidContent(initialText);
            if (!initialText) {
              const mermaidNode = editor.state.selection.$anchor.parent;
              text = getmermaidContent(mermaidNode.textContent)
            }
            setTimeout(() => {
              setMediumText(text);
            }, 100)
          }}
        >
          {buttonIcon}
        </button>
      </AlertDialogTrigger>
      <AlertDialogContent className="z-[99999] w-[70vw]">
        <AlertDialogHeader>
          <AlertDialogTitle />
          <AlertDialogDescription />
        </AlertDialogHeader>
        <div className='flex gap-3 h-[70vh] relative'>
          <div className='border w-full h-full'>
            <MonacoEditor
              className='h-full w-full border-none outline-none resize-none p-3'
              defaultLanguage="html"
              value={mediumText}
              onChange={(value, en) => {
                setMediumText(value)
              }} />
          </div>
          <div className={`text-red-600 p-3 border w-full h-full ${mermaidError ? 'block' : 'hidden'}`}>{mermaidError}</div>
          <div className={`border overflow-auto w-full h-full ${mermaidError ? 'hidden' : 'block'}`} ref={mermaidrEditRef} id="mermaidrEdit" />
        </div>
        <AlertDialogFooter>
          <AlertDialogAction disabled={!!mermaidError.length || !mediumText.length} onClick={onCommand} >
            {t('Save')}
          </AlertDialogAction>
          <AlertDialogCancel onClick={() => { onClear() }}>
            {t('Cancel')}
          </AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
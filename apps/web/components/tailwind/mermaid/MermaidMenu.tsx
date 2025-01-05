// MermaidMenu.tsx
import { cn } from "@/lib/utils";
import { MermaiEdit } from './MermaiEdit';
import type { EditorInstance } from 'novel';
import { CornerDownLeft, Edit, Trash2 } from 'lucide-react';
import React, { useState, useEffect, useCallback } from 'react';
import { useTranslations } from "next-intl";

export interface MermaidMenuItem {
  id: string;
  name: string;
  command: (newContent?: string) => void;
  icon: JSX.Element;
  isDelete?: boolean;
}

export const MermaidMenu = ({ editor }: { editor: EditorInstance }) => {
  const t = useTranslations()
  const [show, setShow] = useState(false);
  const [mermaidLocation, setMermaidLocation] = useState(0);

  const deleteMermaidNode = useCallback(() => {
    const { state } = editor;
    const { selection } = state;
    const { $anchor } = selection;

    for (let depth = $anchor.depth; depth > 0; depth--) {
      const node = $anchor.node(depth);
      if (node.type.name === 'mermaid') {
        const pos = $anchor.before(depth);
        editor.chain().focus().deleteRange({ from: pos, to: pos + node.nodeSize }).run();
        setShow(false);
        return;
      }
    }
  }, [editor]);

  useEffect(() => {
    const handleWindowClick = (event: MouseEvent) => {
      const mermaidWrapper = (event.target as Element).closest('.mermaid-wrapper');
      if (mermaidWrapper) {
        setShow(true);
        const rect = mermaidWrapper.getBoundingClientRect();
        const scrollOffset = window.scrollY;
        const mermaidTop = rect.top + scrollOffset;
        if (mermaidLocation !== mermaidTop) {
          setMermaidLocation(mermaidTop);
        }
      } else {
        setShow(false);
      }
    };

    window.addEventListener("click", handleWindowClick);
    return () => {
      window.removeEventListener("click", handleWindowClick);
    };
  }, [editor, mermaidLocation]);

  const items: MermaidMenuItem[] = [
    {
      id: 'edit',
      name: t('edit'),
      command: () => { },
      icon: <div className="p-2"><Edit className={cn("h-5 w-5 text-lg")} /></div>,
    },
    {
      id: 'delete',
      name: t('delete.but'),
      command: deleteMermaidNode,
      icon: <Trash2 className={cn("h-5 w-5 text-lg text-red-600")} />,
      isDelete: true,
    },
    {
      id: 'Line break',
      name: t('Line_break'),
      command: () => {
        const { state } = editor;
        const { selection } = state;
        const { $from } = selection;
        const depthToCheck = $from.depth;
        let tablePosition = null;
        for (let d = depthToCheck; d > 0; d--) {
          const node = $from.node(d);
          if (node.type.name === 'mermaid') {
            tablePosition = $from.before(d);
            break;
          }
        }
        if (tablePosition !== null) {
          const tableNode = state.doc.nodeAt(tablePosition);
          const tableEndPos = tablePosition + (tableNode ? tableNode.nodeSize : 0);
          editor.chain().insertContentAt(tableEndPos, { type: 'paragraph', content: null }).setTextSelection(tableEndPos + 1).run();
        }
      },
      icon: <CornerDownLeft className={cn("h-5 w-5 text-lg")} />,
    },
  ];

  return (
    <section
      className="absolute left-2/4 translate-x-[-50%] overflow-hidden rounded border border-stone-200 bg-white shadow-xl z-[99999]"
      style={{ top: `${mermaidLocation - 75}px`, display: `${show ? 'flex' : 'none'}` }}
    >
      {items.map((item) => {
        if (item.id === 'edit') return <MermaiEdit key={item.id} buttonIcon={item.icon} editor={editor} />
        return (
          <button
            key={item.id}
            title={item.name}
            onClick={() => item.command()}
            className="text-stone-600 hover:bg-stone-100 active:bg-stone-200 p-2"
          >
            {item.icon}
          </button>
        )
      })}
    </section>
  );
};
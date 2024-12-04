import { useState, useEffect } from "react";
import { Rows, Trash2, Columns, CornerDownLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

interface TableMenuItem {
  name: string;
  command: () => void;
  icon: typeof Rows;
  isDelete?: boolean;
}

export const TableMenu = ({ editor }: { editor: any }) => {
  const t = useTranslations()
  const [show, setShow] = useState(false);
  const [tableLocation, setTableLocation] = useState(0);

  const items: TableMenuItem[] = [
    {
      name: t('Add_Column'),
      command: () => editor.chain().focus().addColumnAfter().run(),
      icon: Columns,
    },
    {
      name: t('Add_Row'),
      command: () => editor.chain().focus().addRowAfter().run(),
      icon: Rows,
    },
    {
      name: t('Delete_Column'),
      command: () => editor.chain().focus().deleteColumn().run(),
      icon: Columns,
      isDelete: true,
    },
    {
      name: t('Delete_Rows'),
      command: () => editor.chain().focus().deleteRow().run(),
      icon: Rows,
      isDelete: true,
    },
    {
      name: t('Delete_Table'),
      command: () => editor.chain().focus().deleteTable().run(),
      icon: Trash2,
      isDelete: true,
    },
    {
      name: t('Line_break'),
      command: () => {
        const { state } = editor;
        const { selection } = state;
        const { $from } = selection;
        // Retrieve the parent node containing the table, usually a section of the document
        const depthToCheck = $from.depth;
        let tablePosition = null;
        for (let d = depthToCheck; d > 0; d--) {
          const node = $from.node(d);
          if (node.type.name === 'table') {
            tablePosition = $from.before(d);
            break;
          }
        }
        if (tablePosition !== null) {
          // Ensure that the end position of the table has been calculated
          const tableNode = state.doc.nodeAt(tablePosition);
          const tableEndPos = tablePosition + (tableNode ? tableNode.nodeSize : 0);
          // Insert new paragraph and update cursor position
          editor.chain().insertContentAt(tableEndPos, { type: 'paragraph', content: null }).setTextSelection(tableEndPos + 1).run();
        }
      },
      icon: CornerDownLeft,
    },
  ];

  useEffect(() => {

    const handleWindowClick = () => {
      const selection = window.getSelection();

      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        let startNode = range.startContainer;

        // If startNode is a text node, retrieve its parent element
        if (startNode.nodeType === Node.TEXT_NODE) {
          startNode = startNode.parentNode;
        }

        // Check if it is a table within the editor
        if (!editor?.options.element?.contains(event.target as Node)) {
          return;
        }

        // Ensure that startNode is an element node and call closest ('table ')
        // @ts-ignore
        const tableNode = startNode.closest ? startNode.closest('table') : null;

        setShow(tableNode ? true : false)
        if (tableNode) {
          const activeTable = tableNode.getBoundingClientRect();
          const scrollOffset = window.scrollY;
          const tableTop = activeTable.top + scrollOffset;
          if (tableLocation !== tableTop) {
            setTableLocation(tableTop);
          }
        }
      }
    };

    window.addEventListener("click", handleWindowClick);

    return () => {
      window.removeEventListener("click", handleWindowClick);
    };
  }, [editor?.isActive('table'), tableLocation]);

  return (
    <section
      className="absolute left-2/4  translate-x-[-50%] overflow-hidden rounded border border-stone-200 bg-white shadow-xl z-[9999999999999]"
      style={{
        top: `${tableLocation - 75}px`,
        display: `${show ? 'flex' : 'none'}`
      }}
    >
      {items.map((item, index) => (
        <button
          key={index}
          onClick={item.command}
          className="p-2 text-stone-600 hover:bg-stone-100 active:bg-stone-200"
          title={item.name}
        >
          <item.icon
            className={cn("h-5 w-5 text-lg", {
              "text-red-600": item?.isDelete,
            })}
          />
        </button>
      ))}
    </section>
  );
};
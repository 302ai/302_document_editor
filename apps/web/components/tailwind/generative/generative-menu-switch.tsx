import { EditorBubble, useEditor } from "novel";
import { removeAIHighlight } from "novel/extensions";
import { } from "novel/plugins";
import { Fragment, type ReactNode, useEffect } from "react";
import { Button } from "../ui/button";
import { AISelector } from "./ai-selector";
import { PiMagicWandFill } from "react-icons/pi";
import { useAppSelector } from "@/app/store/hooks";
import { selectGlobal } from "@/app/store/globalSlice";


interface GenerativeMenuSwitchProps {
  children: ReactNode;
  open: boolean;
  selectView: { from: number, to: number }
  onOpenChange: (open: boolean) => void;
}
const GenerativeMenuSwitch = ({ children, open, selectView, onOpenChange }: GenerativeMenuSwitchProps) => {
  const { editor } = useEditor();
  const global = useAppSelector(selectGlobal);

  useEffect(() => {
    if (!open && global.selectRightMenu !== 'IntelligentMapping') removeAIHighlight(editor);
  }, [open]);

  useEffect(() => {
    if (global.selectRightMenu === 'IntelligentMapping') {
      onOpenChange(false)
    }
  }, [global.selectRightMenu])

  return (
    <EditorBubble
      tippyOptions={{
        placement: open ? "bottom-start" : "top",
        onHidden: () => {
          onOpenChange(false);
          editor.chain().unsetHighlight().run();
        },
      }}
      className="flex w-fit max-w-[90vw] overflow-hidden rounded-md border border-muted bg-background shadow-xl"
    >
      {open && <AISelector open={open} onOpenChange={onOpenChange} />}
      {!open && (
        <Fragment>
          <Button
            className="gap-1 rounded-none text-purple-500"
            variant="ghost"
            onClick={() => onOpenChange(true)}
            size="sm"
          >
            {/* <Magic className="h-5 w-5" /> */}
            <PiMagicWandFill />
            AI
          </Button>
          {children}
        </Fragment>
      )}
    </EditorBubble>
  );
};

export default GenerativeMenuSwitch;

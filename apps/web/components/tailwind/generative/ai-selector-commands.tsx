import { useEditor } from "novel";
import { CommandGroup, CommandItem } from "../ui/command";
import { languageMenuList } from "@/lib/language";
import { RiCameraLensLine } from "react-icons/ri";
import { BsTranslate } from "react-icons/bs";
import { VscDebugContinue } from "react-icons/vsc";
import { RiExpandWidthFill } from "react-icons/ri";
import { BsArrowsCollapseVertical } from "react-icons/bs";
import { FiRefreshCw } from "react-icons/fi";
import { RiSpeakLine } from "react-icons/ri";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Button } from "../ui/button";
import { TbChartAreaLine } from "react-icons/tb";
import { useTranslations } from "next-intl";
import { FcFlowChart } from "react-icons/fc";

interface AISelectorCommandsProps {
  onSelect: (value: string, option: { type: string, language?: string }) => void;
}

const AISelectorCommands = ({ onSelect }: AISelectorCommandsProps) => {
  const t = useTranslations();
  const { editor } = useEditor();

  const options = [
    {
      value: "summary",
      label: t("Summary"),
      icon: <RiCameraLensLine className="h-4 w-4 text-purple-500" />,
    },
    {
      value: "translate",
      label: t("Translate"),
      icon: <BsTranslate className="h-4 w-4 text-purple-500" />,
    },
    {
      value: "continued writing",
      label: t("Continued_writing"),
      icon: <VscDebugContinue className="h-4 w-4 text-purple-500" />,
    },
    {
      value: "expand written article",
      label: t("Expand_written_article"),
      icon: <RiExpandWidthFill className="h-4 w-4 text-purple-500" />,
    },
    {
      value: "abbreviation",
      label: t("Abbreviation"),
      icon: <BsArrowsCollapseVertical className="h-4 w-4 text-purple-500" />,
    },
    {
      value: "rewrite",
      label: t("Rewrite"),
      icon: <FiRefreshCw className="h-4 w-4 text-purple-500" />,
    },
    {
      value: "reading aloud",
      label: t("Reading_aloud"),
      icon: <RiSpeakLine className="h-4 w-4 text-purple-500" />,
    },
    {
      value: "illustration",
      label: t("Illustration"),
      icon: <TbChartAreaLine className="h-4 w-4 text-purple-500" />,
    },
    {
      value: "flow chart",
      label: t('FlowChart'),
      icon: <FcFlowChart className="h-4 w-4 text-purple-500" />,
    },
  ];


  const onTranslateSubmenus = (option) => {
    return (
      <Popover key={option.value}>
        <PopoverTrigger className="w-full">
          <CommandItem className="flex gap-2 px-4 w-full" key={option.value} value={option.value} >
            {option?.icon}
            {option.label}
          </CommandItem>
        </PopoverTrigger>
        <PopoverContent className="w-52 p-1 z-[9999]" align="end" side="right">
          <div>
            {
              languageMenuList.map((item) => (
                <Button
                  variant="ghost"
                  key={item.value}
                  className="hover:text-[#8e47f0] w-full flex justify-between"
                  size="sm"
                  onClick={() => {
                    const slice = editor.state.selection.content();
                    const text = editor.storage.markdown.serializer.serialize(slice.content);
                    onSelect(text, { type: option.value, language: item.value });
                  }}
                >
                  <span>{item.label}</span>
                </Button>
              ))
            }
          </div>
        </PopoverContent>
      </Popover>
    )
  }

  return (

    <CommandGroup>
      {options.map((option) => {
        if (option.value === 'translate') {
          return (onTranslateSubmenus(option))
        }
        return (
          <CommandItem
            onSelect={(value) => {
              const slice = editor.state.selection.content();
              const text = editor.storage.markdown.serializer.serialize(slice.content);
              onSelect(text, { type: value });
            }}
            className="flex gap-2 px-4"
            key={option.value}
            value={option.value}
          >
            {option?.icon}
            {option.label}
          </CommandItem>
        )
      })}
    </CommandGroup>
  );
};

export default AISelectorCommands;

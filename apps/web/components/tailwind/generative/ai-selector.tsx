"use client";

import { Command, CommandInput } from "@/components/tailwind/ui/command";
import { useCompletion } from "ai/react";
import { useEditor } from "novel";
import { addAIHighlight } from "novel/extensions";
import { useEffect, useState } from "react";
import Markdown from "react-markdown";
import { Button } from "../ui/button";
import CrazySpinner from "../ui/icons/crazy-spinner";
import Magic from "../ui/icons/magic";
import { ScrollArea } from "../ui/scroll-area";
import AISelectorCommands from "./ai-selector-commands";
import { IoIosRefresh } from "react-icons/io";
import { LuReplace } from "react-icons/lu";
import { TbRowInsertBottom } from "react-icons/tb";
import { FaRegCopy } from "react-icons/fa";
import { toast } from "../ui/use-toast";
import { IoMdSend } from "react-icons/io";
import AudioPlayer from "./ai-sound-playback";
import { useAppDispatch, useAppSelector } from "@/app/store/hooks";
import { selectGlobal, setGlobalState } from "@/app/store/globalSlice";
import { ErrMessage } from "@/app/componets/ErrMessage";
import ky from "ky";
import { useTranslations } from "next-intl";
//TODO: I think it makes more sense to create a custom Tiptap extension for this functionality https://tiptap.dev/docs/editor/ai/introduction

interface AISelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AISelector({ onOpenChange }: AISelectorProps) {
  const t = useTranslations();
  const { editor } = useEditor();
  const global = useAppSelector(selectGlobal);
  const [inputValue, setInputValue] = useState("");
  const [submitValue, setSubmitValue] = useState<{ value: string, params: any }>({ value: '', params: {} })
  // const [illustration, setIllustration] = useState('');
  const dispatch = useAppDispatch()

  const { completion, complete, setCompletion, isLoading } = useCompletion({
    id: "novel",
    api: "/api/generate",
    onResponse: async (response) => {
      if (response.status === 429) {
        onToast('You have reached your request limit for the day.')
        return;
      }
      if (!response.ok) {
        try {
          const errorData = await response.json();
          console.log('errorData', errorData, errorData.err_code);

          toast({
            duration: 2000,
            description: (ErrMessage(errorData.err_code, global.language))
          })
        } catch (parseError) {
          toast({
            duration: 2000,
            description: (ErrMessage(0, global.language))
          })
        }
      }
    },
    onError: (e) => {
    },
  });

  useEffect(() => {
    return () => {
      setCompletion("");
      setSubmitValue({ value: '', params: {} })
    };
  }, []);

  const hasCompletion = completion.length > 0;

  // copy
  const onHandleCopyResult = (text: string) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        onToast(t('copy_success'))
      })
      .catch(err => {
        onToast(t('copy_error'))
      });
  }

  // replace
  const onReplace = () => {
    const selection = editor.view.state.selection;
    editor
      .chain()
      .focus()
      .insertContentAt(
        {
          from: selection.from,
          to: selection.to,
        },
        completion,
      )
      .run();
  }

  // insert
  const InsertBelow = async () => {
    const selection = editor.view.state.selection;
    editor
      .chain()
      .focus()
      .insertContentAt(selection.to + 1, completion)
      .run();
  }

  // Regenerate
  const onRegenerate = async () => {
    complete(submitValue.value, {
      body: { ...submitValue.params }
    }); // Call 'complete' to regenerate
  }

  const onToast = (description: string) => {
    toast({ duration: 2000, description })
  }

  return (
    <Command className="md:w-[450px] w-screen">
      {hasCompletion && submitValue.params?.type !== 'reading aloud' && (
        <div className="flex max-h-[400px]">
          <ScrollArea>
            <div className="prose p-2 px-4 prose-sm">
              <Markdown>{completion}</Markdown>
            </div>
          </ScrollArea>
        </div>
      )}

      {isLoading && (
        <div className="flex h-12 w-full items-center px-4 text-sm font-medium text-muted-foreground text-purple-500">
          <Magic className="mr-2 h-4 w-4 shrink-0  " />
          {t('AI_is_thinking')}
          <div className="ml-2 mt-1">
            <CrazySpinner />
          </div>
        </div>
      )}
      {
        !isLoading && !hasCompletion && submitValue.params?.type !== 'reading aloud' && (
          <AISelectorCommands onSelect={async (value, option) => {
            if (['illustration', 'flow chart'].indexOf(option.type) > -1) {
              dispatch(setGlobalState({
                selectRightMenu: option.type === 'flow chart' ? 'FlowChart' : 'IntelligentMapping',
              }))
              return;
            }
            setSubmitValue({ value, params: { ...option } })
            if (['reading aloud', 'illustration', 'flow chart'].indexOf(option.type) === -1) {
              complete(value, {
                body: { ...option }
              })
            }
          }} />
        )
      }
      {
        !['reading aloud', 'illustration', 'flow chart'].includes(submitValue.params?.type) && (
          <div className="relative">
            <CommandInput
              value={inputValue}
              onValueChange={setInputValue}
              placeholder={t('Please_enter_the_requirements')}
            // onFocus={() => addAIHighlight()}
            />
            <Button
              size="icon"
              className="absolute right-2 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-purple-500 hover:bg-purple-900"
              disabled={isLoading}
              onClick={() => {
                if (completion) {
                  setSubmitValue({ value: completion, params: { type: "free rewriting", command: inputValue } })
                  return complete(completion, {
                    body: { type: "free rewriting", command: inputValue },
                  })
                }
                const slice = editor.state.selection.content();
                const text = editor.storage.markdown.serializer.serialize(slice.content);
                setSubmitValue({ value: text, params: { type: "free rewriting", command: inputValue } })
                complete(text, {
                  body: {
                    type: "free rewriting",
                    command: inputValue,
                  },
                })
              }}
            >
              <IoMdSend />
            </Button>
          </div>
        )
      }
      {
        !isLoading && hasCompletion && (
          <div className="flex justify-between ml-2 my-3">
            {
              submitValue?.params?.type !== 'free rewriting' && (
                <Button size="sm" className="text-sm" onClick={onRegenerate}><IoIosRefresh className="mr-2" />{t('Regenerate')}</Button>
              )
            }
            <div className={`${submitValue?.params?.type === 'free rewriting' && 'flex w-full justify-between'}`}>
              <Button size="sm" className={`text-sm mr-2`} onClick={onReplace}><LuReplace className="mr-2" />{t('replace')}</Button>
              <Button size="sm" className={`text-sm mr-2`} onClick={InsertBelow}><TbRowInsertBottom className="mr-2" />{t('insert')}</Button>
              <Button size="sm" className={`text-sm mr-2 `} onClick={() => { onHandleCopyResult(completion) }}><FaRegCopy className="mr-2" />{t('copy_txt')}</Button>
            </div>
          </div>
        )
      }
      {
        submitValue.params?.type === 'reading aloud' && (
          <AudioPlayer text={submitValue.value} />
        )
      }
      <div >
      </div>
    </Command>
  );
}

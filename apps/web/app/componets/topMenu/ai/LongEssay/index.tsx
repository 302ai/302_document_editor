import { Loader2 } from "lucide-react"
import { useTranslations } from "next-intl"
import type { EditorInstance } from "novel"
import { useAppSelector } from "@/app/store/hooks"
import { useEffect, useRef, useState } from "react"
import { IoMdAddCircleOutline } from "react-icons/io"
import { selectGlobal } from "@/app/store/globalSlice"
import { ErrMessage } from "@/app/componets/ErrMessage"
import { Switch } from "@/components/tailwind/ui/switch"
import { Button } from "@/components/tailwind/ui/button"
import { toast } from "@/components/tailwind/ui/use-toast"
import { Textarea } from "@/components/tailwind/ui/textarea"
import { ToastAction } from "@/components/tailwind/ui/toast"
import { MdOutlineRemoveCircleOutline } from "react-icons/md"
import { generateLengthyArticle, generateOutline } from "./service"
import { aspectRatioList, LANG_ABBREVIATION, type ActionType, type IOutline } from "./constant"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/tailwind/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/tailwind/ui/dialog"

const api_key = process.env.NEXT_PUBLIC_API_KEY;
const model = process.env.NEXT_PUBLIC_MODEL_NAME;

export const LongEssay = (props: { menuItem: { value: string, label: string, icon: any }, editorInstance: EditorInstance | null, }) => {
  const t = useTranslations();
  const { menuItem, editorInstance } = props;
  const global = useAppSelector(selectGlobal)
  const abortControllerRef = useRef<AbortController>(null);

  const PICTURE_SOURCE_LIST = [
    { value: 'only_ai', label: t('aiGenerated') },
    { value: 'only_net', label: t('ImageSearch') },
    { value: 'first_net', label: t('ImageSearchPriority') },
  ]

  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState({ outline: false, changwen: false })
  const [customPrompt, setCustomPrompt] = useState('')
  const [isIllustration, setIsIllustration] = useState(false)
  const [pictureSource, setPictureSource] = useState('only_ai')
  const [outlineList, setOutlineList] = useState<IOutline[]>([])
  const [outlineType, setOutlineType] = useState<'text' | 'image'>('text')
  const [actionType, setActionType] = useState<ActionType>('GenerateOutline')

  const onGenerateOutline = async () => {
    const title = global.novelTitle;
    if (title.trim().length < 1) {
      toast({
        duration: 2000,
        description: t('Please_enter_the_title_first')
      })
      return;
    }
    setIsLoading((v) => ({ ...v, outline: true }))
    const abortController = new AbortController();
    abortControllerRef.current = abortController;
    const result = await generateOutline({
      body: {
        title,
        model,
        custom_prompt: customPrompt,
        language: LANG_ABBREVIATION[global.language],
        include_illustration: isIllustration,
      },
      apiKey: api_key,
      signal: abortController.signal
    })
    if (result?.error) {
      if (result?.error?.name !== 'AbortError') {
        setIsLoading({ outline: false, changwen: false })
        toast({
          duration: 2000,
          description: (ErrMessage(result.error?.err_code, global.language))
        })
      }
    } else if (result?.data?.sections?.length) {
      setOutlineList(result.data.sections)
      setActionType('GenerateLengthyArticle')
    }
    setIsLoading((v) => ({ ...v, outline: false }))
  }

  const onGenerateLengthyArticle = async () => {
    const txtContent = localStorage.getItem('txt-content');
    if (txtContent) {
      toast({
        title: "",
        description: <div className='text-red-600'>{t('do_you_want_to_continue')}</div>,
        action: (
          <ToastAction altText="Goto schedule to undo" onClick={() => { onRequest() }}>{t('Confirm')}</ToastAction>
        ),
      })
      return;
    } else {
      await onRequest()
    }
  }

  const onRequest = async () => {
    const title = global.novelTitle;
    let txt = '';
    setIsLoading((v) => ({ ...v, changwen: true }))
    const abortController = new AbortController();
    abortControllerRef.current = abortController;
    await generateLengthyArticle(
      {
        body: {
          title,
          model,
          img_mode: pictureSource,
          sections: outlineList,
          custom_prompt: customPrompt,
          language: LANG_ABBREVIATION[global.language],
        },
        apiKey: api_key,
        signal: abortController.signal
      },
      (data) => {
        if (!txt) {
          toast({
            duration: Infinity,
            description: <div className='flex items-center'>
              <span>{t('AI_is_thinking')}</span>
              <Loader2 className="animate-spin ml-3 text-[#8e47f0]" style={{ width: 20, height: 20 }} />
            </div>,
            action: (<ToastAction altText="Goto schedule to undo" className="hidden" ></ToastAction>),
          })
          setOpen(false)
        }
        if (txt && txt.charAt(txt.length - 1) === '#' && data.charAt(0) !== '#') {
          txt += ' ';
        }
        txt += data
        try {
          const endPosition = editorInstance.state.doc.content.size;
          editorInstance.chain().focus().insertContentAt({ from: 0, to: endPosition }, txt).run();
          window.scrollTo({
            top: document.documentElement.scrollHeight,
            behavior: 'smooth'
          });
        } catch (error) {

        }
      },
      async (error) => {
        console.log('=========', error);
        if (error?.error?.name !== 'AbortError') {
          toast({
            duration: 2000,
            description: (ErrMessage(error.error?.err_code, global.language))
          })
        }
        setIsLoading({ outline: false, changwen: false })
      },
      async () => {
        toast({
          duration: 2000,
          description: (t('editor_ai_writing_completed'))
        })
      }
    )
  }

  const onAddOutline = () => {
    setOutlineList((v) => ([...v, { type: outlineType, content: '', aspect_ratio: outlineType === 'image' ? '1:1' : '' }]))
  }

  const onDeleteOutline = (index: number) => {
    setOutlineList((v) => v.filter((f, i) => i !== index))
  }

  const saveOutlineList = (index: number, name: string, value: string) => {
    setOutlineList((v) => v.map((item, i) => {
      if (i === index) {
        return { ...item, [name]: value }
      }
      return item;
    }))
  }

  useEffect(() => {
    if (!isIllustration) {
      setOutlineType('text')
    }
  }, [isIllustration])

  const onOpenChange = (value: boolean) => {
    if (!value && isLoading) {
      abortControllerRef.current?.abort();
    }
    if (value) {
      setIsLoading({ outline: false, changwen: false })
      setCustomPrompt('')
      setIsIllustration(false)
      setPictureSource('only_ai')
      setOutlineList([])
      setOutlineType('text')
      setActionType('GenerateOutline')
    }
    setOpen(value);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="ghost" className="w-full flex justify-between" size="sm">
          <div className="flex items-center ">
            {menuItem?.icon}
            <span className={`ml-2 text-[#8e47f0]`}>{menuItem.label}</span>
          </div>
        </Button>
      </DialogTrigger>
      <DialogContent className='z-[9999] max-w-fit' onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle />
          <DialogDescription />
        </DialogHeader>
        <div className="flex">
          <div className={`flex flex-col gap-4 w-[300px] ${actionType === 'GenerateLengthyArticle' && 'border-r-2 pr-5'}`}>
            <div className="font-bold">{t('customLongArticle')}</div>
            <Textarea
              value={customPrompt}
              className='min-h-[150px] custom-scrollbar'
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder={t('customRequirements')}
            />
            <div className="flex gap-5 items-center justify-between">
              <div>{t('needIllustrations')}</div>
              <Switch id="isIllustration" checked={isIllustration} onCheckedChange={setIsIllustration} />
            </div>
            {
              (isIllustration && actionType === 'GenerateLengthyArticle') &&
              <div className="flex gap-5 items-center justify-between">
                <div>{t('pictureSource')}</div>
                <Select value={pictureSource} onValueChange={(value) => setPictureSource(value)}>
                  <SelectTrigger className="max-w-[150px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="z-[9999] ">
                    <SelectGroup>
                      {
                        PICTURE_SOURCE_LIST.map(item => (
                          <SelectItem value={item.value} key={item.value}>{item.label}</SelectItem>
                        ))
                      }
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
            }{
              actionType === 'GenerateLengthyArticle' &&
              <Button onClick={onGenerateOutline} disabled={isLoading.outline || isLoading.changwen}>
                {t('regenerateOutline')}
                {isLoading.outline && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              </Button>
            }
          </div>
          {
            actionType === 'GenerateLengthyArticle' &&
            <div className="flex flex-col gap-4 h-[400px]  custom-scrollbar pl-5 w-[400px]">
              <div className="font-bold">{t('longArticleOutline')}</div>
              {
                outlineList.map((item, index) => (
                  <div className={`flex-col justify-between gap-2 ${(!isIllustration && item.type === 'image') ? 'hidden' : 'flex'}`} key={index}>
                    <div className={`flex gap-3 items-center`}>
                      {
                        item.type === 'text' ? t('content') :
                          <>
                            {t('picture')}
                            {
                              pictureSource !== 'only_ai' &&
                              <Select value={item?.aspect_ratio} onValueChange={(value) => saveOutlineList(index, 'aspect_ratio', value)}>
                                <SelectTrigger className="max-w-[100px] h-9">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="z-[9999]">
                                  <SelectGroup>
                                    {aspectRatioList.map(value => (<SelectItem key={value} value={value}>{value}</SelectItem>))}
                                  </SelectGroup>
                                </SelectContent>
                              </Select>
                            }
                          </>
                      }
                      <MdOutlineRemoveCircleOutline
                        onClick={() => onDeleteOutline(index)}
                        className="text-xl text-red-600 cursor-pointer"
                      />
                    </div>
                    <Textarea
                      value={item.content}
                      className='custom-scrollbar min-h-[60px]'
                      onChange={(e) => saveOutlineList(index, 'content', e.target.value)}
                    />
                  </div>
                ))
              }
              <div className="flex items-center justify-between mb-5 gap-4">
                <Select value={outlineType} onValueChange={(value: 'text' | 'image') => setOutlineType(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="z-[9999]">
                    <SelectGroup>
                      <SelectItem value="text">{t('content')}</SelectItem>
                      {isIllustration && <SelectItem value="image">{t('picture')}</SelectItem>}
                    </SelectGroup>
                  </SelectContent>
                </Select>
                <IoMdAddCircleOutline className="text-2xl text-[#8e47f0] cursor-pointer" onClick={onAddOutline} />
              </div>
            </div>
          }
        </div>
        <DialogFooter>
          {
            actionType === 'GenerateOutline' ?
              <Button disabled={isLoading.outline || isLoading.changwen} type="submit" onClick={onGenerateOutline}>
                {t('generateOutline')}
                {isLoading.outline && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              </Button> :
              <Button disabled={isLoading.outline || isLoading.changwen || !outlineList.length} type="submit" onClick={onGenerateLengthyArticle}>
                {t('generateLongArticle')}
                {isLoading.changwen && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              </Button>
          }
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
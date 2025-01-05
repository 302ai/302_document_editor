import { useEffect, useRef, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/app/store/hooks";
import { RxDoubleArrowRight } from "react-icons/rx";
import { selectGlobal, setGlobalState } from "@/app/store/globalSlice";
import { Button } from "@/components/tailwind/ui/button";
import { Textarea } from "@/components/tailwind/ui/textarea";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/tailwind/ui/select";
import type { EditorInstance } from "novel";
import ky from "ky";
import { toast } from "@/components/tailwind/ui/use-toast";
import { ErrMessage } from "../ErrMessage";
import { Edit, Loader2 } from "lucide-react";
import { removeAIHighlight } from "novel/extensions";
import { useTranslations } from "next-intl";
import { MermaiEdit } from "@/components/tailwind/mermaid/MermaiEdit";
import mermaid from "mermaid";
import { formatMermaidToMarkdown } from "@/components/tailwind/mermaid/MermaidTool";

const modelList = [
  'Flux-1.1-pro',
  'Flux-1-dev',
  'Flux-1-schnell',
  'Ideogram 2.0',
]

const IdeogramSize = [
  'auto',
  'ASPECT_1_1',
  'ASPECT_10_16',
  'ASPECT_16_10',
  'ASPECT_9_16',
  'ASPECT_16_9',
  'ASPECT_3_2',
  'ASPECT_2_3',
  'ASPECT_4_3',
  'ASPECT_3_4',
  'ASPECT_1_3',
  'ASPECT_3_1',
]

const fluxSize = [
  'auto',
  '1:1',
  '2:3',
  '3:2',
  '3:4',
  "4:3",
  '9:16',
  '16:9'
]
const searchTypeList = ['Google', 'Bing']
export const IntelligentMapping = (props: { editorInstance: EditorInstance | null }) => {
  const { editorInstance } = props;
  const t = useTranslations();
  const dispatch = useAppDispatch();
  const global = useAppSelector(selectGlobal);
  const [modelType, setModelType] = useState('Flux-1.1-pro')
  const [illustration, setIllustration] = useState('');
  const [content, setContent] = useState('')
  const [isload, setIsLoad] = useState(false)
  const insertFrom = useRef(0)
  const [imageSize, setImageSize] = useState('auto')
  const [searchType, setSearchType] = useState('Google')
  const [imageList, setImageList] = useState([]);
  const [tab, setTab] = useState(1)
  const mermaidrRef = useRef<HTMLDivElement>(null);
  const [mediumText, setMediumText] = useState('');

  const TabList = [
    { value: 1, label: t('Generate_illustrations_for_prompt_words') },
    { value: 2, label: t('AI_search_for_illustrations') },
    { value: 3, label: t('Generate_FlowChart') },
  ]

  const generateIllustration = async () => {
    if (isload) return;
    setIsLoad(true);
    const type = tab === 2 ? 'searchImage' : 'flow chart'
    try {
      const result: any = await ky('/api/generateIllustration', {
        method: 'post',
        timeout: false,
        body: JSON.stringify({
          type: tab === 1 ? modelType : type,
          size: imageSize,
          content,
          searchType,
        })
      }).then(res => res.json())
      if (result?.error) {
        setIsLoad(false);
        toast({
          duration: 2000,
          description: (ErrMessage(result?.error?.err_code, global.language))
        })
        return;
      }
      if (result?.output) {
        const text = formatMermaidToMarkdown(result.output)
        const mermaidContent = text.replace(/^[\s\S]*?```mermaid\s*\n?/, '').replace(/```[\s\S]*$/, '').trim();
        setMediumText(mermaidContent)
        setIsLoad(false);
        return;
      }
      if (result?.images) {
        const validImages = result?.images.filter(url => isValidImageUrl(url));
        setImageList(validImages);
        setIsLoad(false);
        return;
      }
      if (result?.data.length && result?.data[0]?.url) {
        setIllustration(result.data[0].url)
      }
      setIsLoad(false);
    } catch (error) {
      setIsLoad(false);
      toast({
        duration: 2000,
        description: (t('illustration_generation_failed'))
      })
    }
  }

  function isValidImageUrl(url) {
    const urlPattern = /^https?:\/\/.*\.(jpg|jpeg|png|gif|webp|bmp)(\?.*)?$/i;
    return urlPattern.test(url);
  }

  const onInsert = () => {
    let position = insertFrom.current || editorInstance.state.doc.content.size;
    if (global.intelligentInsert) {
      const cursorPos = global.intelligentInsert - 1;
      const $pos = editorInstance.state.doc.resolve(cursorPos);
      position = $pos.end();
    }
    if (editorInstance) {
      if (tab === 3 && mediumText) {
        const text = "```mermaid\n" +
          `${mediumText}\n` +
          "```"
        editorInstance.chain().focus().insertContentAt(position, {
          type: 'mermaid',
          content: [{ type: 'text', text }],
        }).run();
        return;
      }
      editorInstance.chain().focus().insertContentAt(position, `![Description of Image](${illustration})`).run();
      removeAIHighlight(editorInstance)
      dispatch(setGlobalState({ intelligentInsert: 0 }))
    }
  }

  const SelectModule = (type: string) => {
    const list = type.indexOf('Flux') > -1 ? fluxSize : IdeogramSize;
    return (
      <Select value={imageSize} onValueChange={setImageSize}>
        <SelectTrigger className="w-[180px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="z-[99999]">
          <SelectGroup>
            {list.map(item => (<SelectItem key={item} value={item}>{item}</SelectItem>))}
          </SelectGroup>
        </SelectContent>
      </Select>
    )
  }

  useEffect(() => {
    if (editorInstance) {
      const slice = editorInstance.state.selection.content();
      const selection = editorInstance.view.state.selection;
      // 获取当前块的最后位置
      const blockEndPosition = selection.$head.end();
      const text = slice.content.textBetween(0, slice.content.size, "\n");
      if (text) {
        setContent(text)
        insertFrom.current = blockEndPosition;
      } else {
        insertFrom.current = 0;
      }
    }
  }, [editorInstance?.state])

  useEffect(() => {
    if (global.selectRightMenu === 'FlowChart') {
      setTab(3)
    }
  }, [global.selectRightMenu])

  useEffect(() => {
    if (mermaidrRef.current && mediumText) {
      mermaid.initialize({ startOnLoad: false, theme: 'default' });
      mermaidrRef.current.innerHTML = mediumText;
      if (mediumText) {
        mermaid.parse(mediumText).then(res => {
          mermaid?.render(`mermaid-${Date.now()}`, mediumText)?.then(({ svg }) => {
            mermaidrRef.current.innerHTML = svg;
          }).catch((error) => {
            console.log('======>>error', error);
          });
        }).catch((error) => {
          console.log('======>>error', error);
        })
      }
    }
  }, [mediumText, mermaidrRef.current]);

  return (
    <div className="w-[450px] h-full border-l p-3 flex flex-col gap-5">
      <div className="flex justify-between items-center">
        <h3>{t('intelligent_mapping')}</h3>
        <Button variant="ghost" onClick={() => dispatch(setGlobalState({ selectRightMenu: '' }))}>
          <RxDoubleArrowRight className="text-lg" />
        </Button>
      </div>
      <div className="border p-[3px] rounded-md flex">
        {
          TabList.map(item => (
            <div
              key={item.value}
              onClick={() => setTab(item.value)}
              className={`flex justify-center items-center text-center cursor-pointer w-full rounded-md text-sm py-2 ${tab === item.value && "bg-[#8e47f0] text-white"}`}
            >
              {item.label}
            </div>
          ))
        }
      </div>
      <div>
        <Textarea
          className={`min-h-[210px] overflow-y-auto ${tab === 2 && 'min-h-[120px]'}`} value={content}
          onChange={(e) => { setContent(e.target.value) }}
          placeholder={t('Enter_your_description')}
        />
        <div className={`flex items-center gap-3 mt-5 w-full ${tab === 3 ? 'justify-end' : 'justify-between'} `}>
          <div className={`justify-between items-center gap-3 ${tab === 1 ? 'flex' : 'hidden'}`} >
            <Select onValueChange={(value) => { setModelType(value); setImageSize('auto') }} value={modelType}>
              <SelectTrigger className="w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="z-[99999]">
                <SelectGroup>
                  {modelList.map(key => (<SelectItem key={key} value={key}>{key}</SelectItem>))}
                </SelectGroup>
              </SelectContent>
            </Select>
            {SelectModule(modelType)}
          </div>
          <div className={`${tab === 2 ? 'flex' : 'hidden'}`}>
            <Select onValueChange={(value) => { setSearchType(value) }} value={searchType}>
              <SelectTrigger className="w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="z-[99999]">
                <SelectGroup>
                  {searchTypeList.map(key => (<SelectItem key={key} value={key}>{key}</SelectItem>))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={generateIllustration} disabled={content.trim().length < 1}>
            {isload ?
              <Loader2 className="animate-spin" style={{ width: 20, height: 20 }} /> :
              tab === 2 ? t('search') : t('Generate')
            }
          </Button>
        </div>
      </div>
      {(tab === 2 && imageList.length > 0) &&
        <div className="border rounded-sm h-[120px] w-full p-2 flex gap-2 custom-scrollbar">
          {
            imageList.map(item => (
              <img src={item} className="h-full w-auto object-contain cursor-pointer" onClick={() => setIllustration(item)} />
            ))
          }
        </div>
      }
      <div className="text-right">
        <div className="h-60 w-full border mb-5 relative">
          <div className={`${(tab === 3 && mediumText) ? 'block' : 'hidden'} h-60`}>
            <div className={`absolute right-3 top-1 bg-white w-[30px] h-[30px] p-[6px] ${!mediumText && 'hidden'}`}>
              <MermaiEdit
                editor={editorInstance}
                initialText={mediumText}
                onCallback={(text: string) => { setMediumText(text) }}
                buttonIcon={<Edit className="h-5 w-5 text-lg text-[#8e47f0]" />}
              />
            </div>
            <div className={`border overflow-auto w-full h-full custom-scrollbar`} ref={mermaidrRef} id="mermaid" />
          </div>
          {illustration && <img src={illustration} className="h-full w-full object-contain cursor-pointer" />}
        </div>
        <Button disabled={isload || (tab == 3 && !mediumText) || (tab !== 3 && !illustration)} onClick={onInsert}>
          {t('insert')}
        </Button>
      </div>
    </div>
  )
}
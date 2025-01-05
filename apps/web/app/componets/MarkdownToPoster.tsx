import { Button } from "@/components/tailwind/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/tailwind/ui/dialog';
import { Md2Poster, Md2PosterContent } from 'markdown-to-poster'
import { useEffect, useRef, useState } from "react";
import { Resizable } from 're-resizable';
import { PiTextT } from "react-icons/pi";
import { Slider } from "@/components/tailwind/ui/slider";
import { Loader2 } from "lucide-react";
import { Input } from "@/components/tailwind/ui/input";
import { Switch } from "@/components/tailwind/ui/switch";
import { toast } from "@/components/tailwind/ui/use-toast";
import { useTranslations } from "next-intl";
import { BsFiletypePng } from "react-icons/bs";
import { convertMermaidToSvg } from "@/components/tailwind/mermaid/MermaidTool";

const layoutThemeBase = `max-w-screen-2xl text-pretty prose prose-zinc prose-pre:text-balance prose-img:rounded-xl prose-img:w-full 
prose-img:shadow-lg prose-lg font-sans prose-zinc text-zinc-800 prose-headings:text-zinc-800`;

const layoutThemeClassic = `max-w-screen-2xl text-pretty prose prose-zinc prose-pre:text-balance prose-img:rounded-xl prose-img:w-full prose-img:shadow-lg
prose-lg font-serif prose-zinc text-zinc-700 prose-headings:text-zinc-700 prose-strong:text-red-800 prose-em:text-gray-950
prose-em:bg-gray-950/10 prose-blockquote:text-zinc-700 prose-blockquote:bg-gray-300/50 prose-blockquote:p-1 prose-img:rounded-none prose-img:shadow-lg`

const layoutThemeVibrant = `max-w-screen-2xl text-pretty prose prose-zinc prose-pre:text-balance prose-img:rounded-xl prose-img:w-full prose-img:shadow-lg
prose-lg font-sans prose-neutral text-neutral-700 prose-headings:text-neutral-700 prose-strong:decoration-wavy prose-strong:underline
prose-strong:decoration-red-400 prose-strong:bg-red-400/40 prose-em:text-neutral-950 prose-em:bg-yellow-400/50 prose-blockquote:not-italic 
prose-blockquote:border-l-0 prose-blockquote:shadow prose-blockquote:border-r-4 prose-blockquote:border-b-4 prose-blockquote:border-black/50 
prose-blockquote:bg-neutral-800/5 prose-blockquote:text-neutral-900 prose-blockquote:rounded-2xl prose-blockquote:py-1 prose-blockquote:pl-5 prose-blockquote:pr-2`

const bgList = [
  { className: 'bg-gradient-to-br from-blue-500 via-cyan-500  to-blue-500', value: 'blue' },
  { className: 'bg-gradient-to-br from-pink-600/80 via-red-400/80 to-pink-600/60', value: 'pink' },
  { className: 'bg-gradient-to-br from-purple-500 via-indigo-500/90 to-purple-800', value: 'purple' },
  { className: 'bg-gradient-to-br from-teal-600 via-green-700/70 to-teal-700', value: 'green' },
  { className: 'bg-gradient-to-br from-yellow-400 via-orange-400 to-yellow-500', value: 'yellow' },
  { className: 'bg-gradient-to-br from-black/90 via-gray-700 to-black/90', value: 'gray' },
  { className: 'bg-gradient-to-br from-red-500 to-orange-500 via-gray-0', value: 'red' },
  { className: 'bg-gradient-to-br from-indigo-700 via-blue-600/80 to-indigo-700', value: 'indigo' },

  { className: 'blueFrostedWave', value: 'blueFrostedWave' },
  { className: 'cartoon', value: 'cartoon' },
  { className: 'chrysanthemumAndLove', value: 'chrysanthemumAndLove' },
  { className: 'cute', value: 'cute' },
  { className: 'geometricBirds', value: 'geometricBirds' },
  { className: 'inkPainting', value: 'inkPainting' },
  { className: 'salesMan', value: 'salesMan' },
  { className: 'springGradientWave', value: 'springGradientWave' },
  { className: 'sunsetGradientWave', value: 'sunsetGradientWave' },

]

const aspectRatioList = ['!prose-sm', '!prose-base', '!prose-lg', '!prose-xl', '!prose-2xl']

const marginsList = ['!pt-2 !pb-4 !px-0', '!p-2', '!p-4', '!p-6', '!p-8', '!p-10', '!p-12', '!p-14', '!p-16']

const layoutThemeList = [
  { label: 'Base', value: layoutThemeBase },
  { label: 'Classic', value: layoutThemeClassic },
  { label: 'Vibrant', value: layoutThemeVibrant },
]

export const MarkdownToPoster = () => {
  const t = useTranslations()
  const markdownRef = useRef<any>(null);
  const resizableRef = useRef<any>(null);
  const signColorRef = useRef<any>(null);
  const [html, setHtml] = useState('');
  const [background, setBackground] = useState('bg-spring-gradient-wave')
  const [fontSize, setFontSize] = useState('!prose-base')
  const [margins, setMargins] = useState(4)
  const [layoutTheme, setLayoutTheme] = useState({ label: 'Base', value: layoutThemeBase })
  const [canvasSize, setCanvasSize] = useState(512)
  const [isload, setIsLoad] = useState(false)
  const [sign, setSign] = useState({ txt: 'Powered By 302AI', use: true })


  useEffect(() => {
    onHandlingMarkdowns()
  }, [])

  const onHandlingMarkdowns = async () => {
    const htmlContent = window.localStorage.getItem('html-content');
    const htmlText = await convertMermaidToSvg(htmlContent)
    setHtml(htmlText)
  }

  const onDownload = () => {
    setIsLoad(true)
    const title = window.localStorage.getItem('novel-title');
    try {
      markdownRef?.current?.handleCopy().then((res) => {
        const url = URL.createObjectURL(res);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${title}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      });
    } catch (error) {
      setIsLoad(false)
    }
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" className="hover:text-[#8e47f0] w-full flex justify-between" size="sm">
          <div className="flex items-center">
            <BsFiletypePng />
            <span className="ml-2">{t('MarkdownToPoster.Save_as_Image')}</span>
          </div>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-max z-[9999] h-[90%] overflow-hidden">
        <DialogHeader>
          <DialogTitle />
          <DialogDescription />
        </DialogHeader>
        <div className="flex gap-5 h-full flex-1 isolate">
          <div className="flex flex-col gap-5 w-[330px] min-w-[330px]">
            <div>
              <h3 className="font-bold mb-2">{t('MarkdownToPoster.bg')}</h3>
              <div className="flex flex-wrap gap-3">
                {bgList.map(item => (
                  <div
                    key={item.value}
                    onClick={() => setBackground(item.className)}
                    className={`h-[60px] w-[45px] cursor-pointer ${item.className} bg-cover rounded-lg`}
                  />
                ))}
              </div>
            </div>
            <div>
              <h3 className="font-bold mb-2">{t('MarkdownToPoster.fontSize')}</h3>
              <div className="flex flex-wrap gap-3">
                {aspectRatioList.map((item, index) => (
                  <div
                    key={item}
                    style={{ fontSize: (index * 2) + 18 }}
                    className={`cursor-pointer border p-2 flex justify-center items-center hover:text-[#8e47f0] hover:border-[#8e47f0] ${fontSize === item && 'border-[#8e47f0] text-[#8e47f0]'}`}
                    onClick={() => setFontSize(item)}
                  ><PiTextT /></div>
                ))}
              </div>
            </div>
            <div>
              <h3 className="font-bold mb-2">{t('MarkdownToPoster.LayoutTheme')}</h3>
              <div className="flex flex-wrap gap-3">
                {layoutThemeList.map((item, index) => (
                  <div
                    key={item.label}
                    onClick={() => setLayoutTheme(item)}
                    className={`cursor-pointer border px-3 py-1 hover:text-[#8e47f0] hover:border-[#8e47f0] ${layoutTheme.label === item.label && 'border-[#8e47f0] text-[#8e47f0]'}`}
                  >{item.label}</div>
                ))}
              </div>
            </div>
            <div>
              <h3 className="font-bold mb-2">{t('MarkdownToPoster.Margins')}({margins})</h3>
              <Slider value={[margins]} onValueChange={(value) => { setMargins(value[0]) }} max={8} min={0} step={1} />
            </div>
            <div>
              <h3 className="font-bold mb-2">{t('MarkdownToPoster.canvasSize')}({canvasSize})</h3>
              <Slider
                step={1}
                min={420}
                max={980}
                value={[canvasSize]}
                onValueChange={(value) => {
                  const newWidth = value[0];
                  if (resizableRef.current) {
                    resizableRef.current?.updateSize({ width: newWidth, height: "auto" });
                  }
                  setCanvasSize(newWidth);
                }}
              />
            </div>
            <div>
              <h3 className="font-bold mb-2">{t('MarkdownToPoster.signature')}</h3>
              <div className="flex justify-center items-center gap-3">
                <Input value={sign.txt} onChange={(e) => setSign((v => ({ ...v, txt: e.target.value })))} />
                <input type="color" onChange={(e) => {
                  if (signColorRef.current) {
                    signColorRef.current.style.color = e.target.value;
                  }
                }} />
                <Switch checked={sign.use} onCheckedChange={(value => { setSign((v => ({ ...v, use: value }))) })} />
              </div>
            </div>
            <Button onClick={onDownload} disabled={isload} className="bg-[#8e47f0] hover:bg-[#7e2def]">
              {
                isload ? <Loader2 className="animate-spin" style={{ width: 20, height: 20 }} /> :
                  t('MarkdownToPoster.download')
              }
            </Button>
          </div>
          <div className="w-full border-l">
            <Resizable
              ref={resizableRef}
              minWidth={420}
              maxWidth={980}
              className="mx-auto"
              size={{ width: canvasSize }}
              onResizeStop={(e, direction, ref, d) => {
                setCanvasSize((v) => v + d.width)
              }}
            >
              <div className={`custom-scrollbar`} style={{ height: 'calc(100vh - 165px)' }}>
                <Md2Poster
                  template="NewsDigest"
                  ref={markdownRef}
                  className={`${background} ${marginsList[margins]} bg-cover mx-auto w-full !max-w-max`}
                  copyFailedCallback={() => {
                    console.log('===========>>>>>>>>>下载失败');
                    toast({ duration: 2000, description: t('markdownToPoster.Poster_download_failed'), style: { zIndex: 99999 } })
                    setIsLoad(false)
                  }}
                  copySuccessCallback={() => {
                    console.log('===========>>>>>>>>>下载成功');
                    setIsLoad(false)
                  }}
                >
                  <Md2PosterContent
                    className="rounded-xl break-words prose-table:w-full shadow-xl w-full bg-white/95 backdrop-blur-md p-8 flex flex-col justify-between gap-4"
                    articleClassName={`${fontSize} prose !max-w-max ${[layoutTheme.value]}`}>
                    {html}
                  </Md2PosterContent>
                  {sign.use && <div ref={signColorRef} className="py-4 text-center">{sign.txt}</div>}
                </Md2Poster>
              </div>
            </Resizable>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

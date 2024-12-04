import { saveAs } from 'file-saver';
import { CgExport } from "react-icons/cg";
import { LuFileJson } from "react-icons/lu";
import { FaRegFilePdf } from "react-icons/fa";
import { asBlob } from 'html-docx-ts-improve';
import { FaRegFileWord } from "react-icons/fa";
import { GrDocumentTxt } from "react-icons/gr";
import { BsFiletypeHtml } from "react-icons/bs";
import { IoIosArrowForward } from "react-icons/io";
import { AiOutlineFileMarkdown } from "react-icons/ai";
import { Button } from "@/components/tailwind/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/tailwind/ui/popover";
import { toast } from '@/components/tailwind/ui/use-toast';
import ky from 'ky';
import { ErrMessage } from './ErrMessage';
import { selectGlobal } from '../store/globalSlice';
import { useAppSelector } from '../store/hooks';
import { useTranslations } from 'next-intl';

interface IProps { language: 'chinese' | 'english' | 'japanese' }

export function ExportMenu(props: IProps) {
  const t = useTranslations();
  const global = useAppSelector(selectGlobal);
  const { language } = props;
  const exportMenuList: Array<{ value: string, label: string, type: string, icon: any }> = [
    { type: 'json', label: t('Structured_document_json'), value: 'Structured document (.json)', icon: (<LuFileJson />) },
    { type: 'docx', label: t('Word_docx'), value: 'Word (.docx)', icon: (<FaRegFileWord />) },
    { type: 'pdf', label: t('PDF_pdf'), value: 'PDF (.pdf)', icon: (<FaRegFilePdf />) },
    { type: 'md', label: t('Markdown_md_'), value: 'Markdown (.md)', icon: (<AiOutlineFileMarkdown />) },
    { type: 'txt', label: t('This_document_txt'), value: 'This document (.txt)', icon: (<GrDocumentTxt />) },
    { type: 'html', label: t('HTML_htm'), value: 'HTML (.htm)', icon: (<BsFiletypeHtml />) },
  ]

  const getHtml = (title: string) => {
    let htmlContent = window.localStorage.getItem('html-content');
    if (!htmlContent) {
      onToast(t('not_export_content'))
      return;
    }
    const newContent = `<h1 style="text-align: center;">${title || t('Untitled')}</h1>`;

    const bodyContent = htmlContent.match(/<body[^>]*>((.|[\n\r])*)<\/body>/im)[1];

    const containerDiv = `
    <div style="max-width: 960px; width: 100%; margin: 0 auto; padding: 20px; box-sizing: border-box; display: flex; flex-direction: column;">
      ${bodyContent}
    </div>
  `;

    const tableStyles = ` <style>
      table {
        table-layout: auto;
        width: 100%;
        border-collapse: collapse;
        position: relative;
        vertical-align: top;
      }
      td, th {
        border: 1px solid #ddd;
        padding: 8px;
        word-wrap: break-word;
        word-break: break-word;
        white-space: normal;
        vertical-align: top;
        position: relative;
      }
      th {
        background-color: #f2f2f2;
        text-align: left;
        position: relative;
        vertical-align: top;
      }
      table p {
        margin: 5px 0;
      }
    </style>`;
    const metaCharset = `<meta charset="UTF-8">`;
    htmlContent = htmlContent.replace(/<head[^>]*>/i, `$&${metaCharset}${tableStyles}`);
    htmlContent = htmlContent.replace(/<body[^>]*>((.|[\n\r])*)<\/body>/im, `<body>${newContent}${containerDiv}</body>`);
    return htmlContent;
  }

  // Export HTML file
  const exportHTML = () => {
    const title = window.localStorage.getItem('novel-title');
    const htmlContent = getHtml(title);
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${title || t('Untitled')}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast({
      duration: 3000,
      description: t('Export_completed')
    })
  };

  // Export Markdown file
  const exportMarkdown = () => {
    let markdownContent = window.localStorage.getItem('markdown');
    const title = window.localStorage.getItem('novel-title');
    if (!markdownContent) {
      onToast(t('not_export_markdown'))
      return;
    }
    markdownContent = `#${title}\n${markdownContent}`;
    const blob = new Blob([markdownContent], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${title || t('Untitled')}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast({
      duration: 3000,
      description: t('Export_completed')
    })
  };

  // Export JSON file
  const exportJSON = () => {
    const novelContent = window.localStorage.getItem('novel-content');
    const title = window.localStorage.getItem('novel-title');

    if (!novelContent) {
      onToast(t('not_export_json'))
      return;
    }

    const jsonData = JSON.parse(novelContent);
    jsonData.isEditor = true;
    if (title) {
      jsonData.title = title;
    }

    const jsonString = JSON.stringify(jsonData, null, 2);

    const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${title || t('Untitled')}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast({
      duration: 3000,
      description: t('Export_completed')
    })
  };

  // Export txt file
  const exportTxt = () => {
    let txtContent = window.localStorage.getItem('txt-content');
    const title = window.localStorage.getItem('novel-title');

    if (!txtContent) {
      onToast(t('not_export_txt'))
      return;
    }
    txtContent = `${title}\n\n${txtContent}`
    const blob = new Blob([txtContent], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${title || t('Untitled')}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
    toast({
      duration: 3000,
      description: t('Export_completed')
    })
  };

  // Export docx
  const exportDocx = async () => {
    try {
      const htmlContent = localStorage.getItem('html-content');
      const title = localStorage.getItem('novel-title');

      const response = await fetch('/api/exportDocx', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          htmlContent,
          title
        })
      });

      if (!response.ok) {
        toast({ duration: 3000, description: t('Export_error') })
        return;
      }

      const blob = await response.blob();

      saveAs(blob, `${title || t('Untitled')}.docx`);
      toast({ duration: 3000, description: t('Export_completed') })
    } catch (error) {
      console.error('Export error:', error);
      toast({ duration: 3000, description: t('Export_error') })
    }
  }

  // Export PDF
  const exportPdf = async () => {
    const { language } = global
    const api_key = process.env.NEXT_PUBLIC_API_KEY;
    const fetchUrl = process.env.NEXT_PUBLIC_PDF_FETCH_URL;
    const title = window.localStorage.getItem('novel-title');
    const htmlContent = getHtml(title);
    try {
      const resp = await ky.post(fetchUrl, {
        headers: {
          Authorization: `Bearer ${api_key}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: htmlContent,
          api_key
        }),
        timeout: false,
      });

      const data = await resp.blob();
      if (data.size > 0) {
        const url = URL.createObjectURL(data);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${title || t('Untitled')}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        toast({
          duration: 3000,
          description: t('Export_completed')
        })
      }
    } catch (error) {
      console.log(error);
      toast({
        duration: 2000,
        description: (ErrMessage(error?.err_code, language))
      })
    }
  }

  const onClickButton = (type: string) => {
    toast({
      duration: Infinity,
      description: t('Exporting')
    })
    switch (type) {
      case 'html':
        exportHTML()
        break;
      case 'md':
        exportMarkdown()
        break;
      case 'json':
        exportJSON()
        break;
      case 'txt':
        exportTxt()
        break;
      case 'docx':
        exportDocx()
        break;
      case 'pdf':
        exportPdf()
        break;
      default:
        break;
    }
  }

  const onToast = (description: string) => {
    toast({ duration: 2000, description })
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" className="hover:text-[#8e47f0] w-full justify-between flex" size="sm">
          <div className="flex items-center">
            <CgExport className="mr-2" />
            {t('export')}
          </div>
          <IoIosArrowForward />
        </Button>
      </PopoverTrigger>
      <PopoverContent className=" p-1 z-[9999]" align='start' side='right' >
        <div>
          {
            exportMenuList.map((item) => (
              <Button variant="ghost" key={item.value} className="hover:text-[#8e47f0] w-full flex justify-between" size="sm" onClick={() => { onClickButton(item.type) }}>
                <div className="flex items-center">
                  {item?.icon}
                  <span className="ml-2">{item.label}</span>
                </div>
              </Button>
            ))
          }
        </div>
      </PopoverContent>
    </Popover>
  )
}

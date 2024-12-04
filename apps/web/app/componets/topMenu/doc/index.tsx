const hljs = require('highlight.js');
import ky from "ky";
import dayjs from "dayjs";
import { docxToHtml, exportJSON } from "@/lib/tool";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { ErrMessage } from "../../ErrMessage";
import { ExportMenu } from "../../ExportMenu";
import { RiDeleteBin6Line } from "react-icons/ri";
import { IoIosArrowForward } from "react-icons/io";
import { HiOutlineDocumentText } from "react-icons/hi";
import type { EditorInstance, JSONContent } from "novel";
import { Button } from "@/components/tailwind/ui/button";
import { toast } from "@/components/tailwind/ui/use-toast";
import { convertHtmlTablesToMarkdown, removeColgroupTags, setLocalStorage } from "@/lib/utils";
import { useAppDispatch, useAppSelector } from "@/app/store/hooks";
import { selectGlobal, setGlobalState } from "@/app/store/globalSlice";
import { addOrUpdateData, deleteData, getAllData } from "@/app/api/indexedDB";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/tailwind/ui/popover";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/tailwind/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/tailwind/ui/alert-dialog";
import html2md from "html-to-md";
import { useTranslations } from "next-intl";
import { FiFile, FiFilePlus } from "react-icons/fi";
import { LuFileUp } from "react-icons/lu";
import { MdOutlineSaveAlt } from "react-icons/md";
import { CgExport } from "react-icons/cg";
import { MarkdownToPoster } from "../../MarkdownToPoster";
import { BsFiletypePng } from "react-icons/bs";

interface IData {
  id: number;
  title: string
  markdown: string;
  createdAt: string;
  htmlContent: string;
  novelContent: JSONContent;
}

export const DocumentTab = (props: { editorInstance: EditorInstance | null }) => {
  const t = useTranslations();
  const { editorInstance } = props;
  const dispatch = useAppDispatch()
  const global = useAppSelector(selectGlobal);

  const [open, setOpen] = useState(false);
  const [saveLoad, setSaveLoad] = useState(false);
  const [controller, setController] = useState(null);
  const [historicalRecords, setHistoricalRecords] = useState<Array<IData>>([]);

  const actinFileMenu: { [key: string]: Array<{ lable: string, value: string, icon: any, }> } = {
    'file': [
      { lable: 'NewFile', value: 'New file', icon: (<FiFile />) },
      { lable: t('OpenLocalDocument'), value: 'Open local document', icon: (<LuFileUp />) },
      { lable: t('CreateACopy'), value: 'Create a copy', icon: (<FiFilePlus />) },

    ],
    'actionFile': [
      { lable: t('Save'), value: 'Save', icon: (<MdOutlineSaveAlt />) },
      { lable: t('Save_as_Image'), value: 'Save as Image', icon: (<BsFiletypePng />) },
      { lable: t('Export'), value: 'Export', icon: (<CgExport />) },
    ]
  }

  useEffect(() => {
    getAllData().then((res) => {
      setHistoricalRecords(res)
    })
  }, [global.renew, saveLoad])

  // Update storage doc data
  const onSave = async () => {
    try {
      const id = window.localStorage.getItem("novel-id");
      const markdown = window.localStorage.getItem("markdown");
      const title = window.localStorage.getItem("novel-title");
      const createdAt = window.localStorage.getItem("createdAt");
      const htmlContent = window.localStorage.getItem("html-content");
      const novelContent = window.localStorage.getItem("novel-content");
      if (!title && !markdown) {
        return;
      }
      setSaveLoad(true)
      const data = {
        id: +id,
        title,
        novelContent: novelContent ? JSON.parse(novelContent) : null,
        htmlContent,
        markdown,
        createdAt,
      }
      await addOrUpdateData(data);
      toast({ description: t('save.success') })
      setSaveLoad(false)
    } catch (error) {
      toast({ description: t('save.error') })
      setSaveLoad(false)
    }
  }

  // Delete Record
  const onDelete = (item) => {
    const ondel = async (e) => {
      e.stopPropagation();
      const id = window.localStorage.getItem('novel-id')
      try {
        const result = await deleteData(item.id);
        getAllData().then((res) => {
          setHistoricalRecords(res)
        })
        toast({ duration: 2000, description: t('delete.success') })
        if (id && item.id === +id) {
          onClearDocument()
        }
      } catch (error) {
        console.log('删除历史记录失败', error);
      }
    }
    return (
      <AlertDialog>
        <AlertDialogTrigger>
          <RiDeleteBin6Line className='min-w-[18px] ml-2 hover:text-red-600' />
        </AlertDialogTrigger>
        <AlertDialogContent className="z-[9999] w-80">
          <AlertDialogHeader>
            <AlertDialogTitle></AlertDialogTitle>
            <AlertDialogDescription className="flex items-center">
              {t('delete.tips')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('Cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={ondel}>{t('delete.but')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    )
  }

  // Clear the entire document
  const onClearDocument = () => {
    window.localStorage.removeItem("novel-id");
    window.localStorage.removeItem("markdown");
    window.localStorage.removeItem("novel-title");
    window.localStorage.removeItem("createdAt");
    window.localStorage.removeItem("html-content");
    window.localStorage.removeItem("txt-content");
    window.localStorage.removeItem("novel-content");
    window.localStorage.removeItem("novelSummary");
    window.localStorage.removeItem("novelTable");
    // Clear the entire document
    editorInstance.chain().clearContent().run();
    dispatch(setGlobalState({
      renew: !global.renew, markdown: '', novelTitle: '', translateDualScreen: false, editorStatus: true,
      novelContent: [], novelSummary: '', novelTable: '', rewriteDualScreen: false,
    }))
  }

  // Create a copy
  const onCreateCopy = async () => {
    setSaveLoad(true)
    try {
      const markdown = window.localStorage.getItem("markdown");
      let title = window.localStorage.getItem("novel-title");
      const createdAt = window.localStorage.getItem("createdAt");
      const htmlContent = window.localStorage.getItem("html-content");
      const novelContent = window.localStorage.getItem("novel-content");
      const id = dayjs().valueOf();
      if (title) {
        title = `${title}-${t('copy')}`
      }
      const data = {
        id: +id,
        title,
        novelContent: novelContent ? JSON.parse(novelContent) : null,
        htmlContent,
        markdown,
        createdAt,
      }
      await addOrUpdateData(data);
      toast({ description: t('Copy_created_successfully') })
      setSaveLoad(false)
    } catch (error) {
      toast({ description: t('Copy_created_error') })
      setSaveLoad(false)
    }
  }

  // Open the record file
  const onOpenRecords = (item: IData) => {
    window.localStorage.setItem("novel-id", `${item.id}`);
    window.localStorage.setItem("novel-title", item.title);
    window.localStorage.setItem("createdAt", item.createdAt);
    window.localStorage.setItem("html-content", item.htmlContent);
    window.localStorage.setItem("markdown", item.markdown);
    if (item.novelContent) {
      window.localStorage.setItem("novel-content", JSON.stringify(item.novelContent));
    }
    editorInstance.chain().focus("start").run();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    // Clear the entire document
    dispatch(setGlobalState({
      saveStatus: false, novelContent: item.novelContent, renew: !global.renew,
      rewriteDualScreen: false, translateDualScreen: false,
      novelTable: '', novelSummary: '', editorStatus: true,
    }))
  }

  // Convert doc to html to md
  const onDocxToHtml = async (file: File) => {
    try {
      const html = await docxToHtml(file)
      if (html) {
        onClearDocument();
        setTimeout(() => {
          const title = file.name.split('.')[0]
          const htmlContent = removeColgroupTags(highlightCodeblocks(html));
          const markdown = html2md(htmlContent)
          editorInstance.chain().focus().insertContentAt(1, markdown).run();
          setLocalStorage('novel-title', title)
          dispatch(setGlobalState({ novelTitle: title }))
        }, 500)
      }
      setOpen(false);
    } catch (error) {
      toast({
        duration: 2000,
        description: t('open_docx')
      })
      setOpen(false);
    }
  };

  // Open a new file
  const onOpenNewFile = (type: string) => {
    if (editorInstance) {
      if (type === 'Open local document') {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = ".md,.txt,.json,.pdf,.docx";
        input.onchange = async () => {
          await onSave()
          if (input.files?.length) {
            const file = input.files[0];
            const title = file.name.split('.')[0]
            if (file && (file.name.endsWith('.md') || file.name.endsWith('.txt') || file.name.endsWith('.json') || file.name.endsWith('.pdf') || file.name.endsWith('.docx'))) {
              if (file.name.endsWith('.docx')) {
                setOpen(true);
                await onDocxToHtml(file)
              } else if (file.name.endsWith('.pdf')) {
                setOpen(true);
                await onOpenPdf(file)
              } else {
                const reader = new FileReader();
                reader.onload = async (e) => {
                  if (file.name.endsWith('.json')) {
                    try {
                      const json = JSON.parse(e.target.result as string);
                      const newTitle = json.title || ''
                      if (json?.isEditor) {
                        onClearDocument();
                        setTimeout(() => {
                          setLocalStorage('novel-title', newTitle)
                          editorInstance.commands.setContent(json);
                          const htmlContent = removeColgroupTags(highlightCodeblocks(editorInstance.getHTML()));
                          const markdown = html2md(htmlContent)
                          window.localStorage.setItem("novel-content", JSON.stringify(json));
                          window.localStorage.setItem("markdown", markdown);
                          window.localStorage.setItem("html-content", htmlContent);
                          window.localStorage.setItem("txt-content", editorInstance.getText());
                          dispatch(setGlobalState({ saveStatus: false, novelContent: json, markdown, novelTitle: newTitle }))
                        }, 500)
                      } else {
                        toast({ description: t('is_document_error') })
                      }
                    } catch (error) {
                      toast({ description: t('is_document_error') })
                    }
                  } else {
                    onClearDocument();
                    const tempData = e.target.result as string
                    setTimeout(async () => {
                      setLocalStorage('novel-title', title)
                      const data = tempData.replace(
                        /(\|[^\n]*\|[^\n]*\n)+/g,
                        match => `\n${match}\n`
                      )
                      editorInstance.chain().focus().insertContentAt(1, data).run();
                      dispatch(setGlobalState({ novelTitle: title }))
                    }, 200)
                  }
                };
                reader.readAsText(file);
              }
              window.scrollTo({ top: 0, behavior: 'smooth' });
            } else {
              toast({ description: t('is_document_error') })
            }
          }
        };
        input.click();
        return;
      }
      onClearDocument();
    }
  }
  const onOpenPdf = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file)
    const newController = new AbortController();
    setController(newController);
    try {
      const response = ky('/api/pdfToMarkdown', {
        method: 'post',
        body: formData,
        timeout: false,
        signal: newController.signal,
      });
      const result: any = await response.json();
      if (result?.error) {
        setOpen(false)
        toast({
          duration: 2000,
          description: (ErrMessage(result?.error.err_code, global.language))
        })
        return;
      }
      if (!result?.data) {
        setOpen(false)
        toast({
          duration: 2000,
          description: t('import_pdf_err')
        })
        return;
      }
      onClearDocument();
      setTimeout(() => {
        const title = file.name.split('.')[0]
        setLocalStorage('novel-title', title)
        const data = convertHtmlTablesToMarkdown(result.data)
        editorInstance.chain().focus().insertContentAt(1, data).run();
        dispatch(setGlobalState({ novelTitle: title }))
        setOpen(false)
      }, 500)
    } catch (error) {
      setOpen(false)
      if (error?.name === 'AbortError') return;
      toast({
        duration: 2000,
        description: t('import_pdf_err')
      })
    }
  }

  const highlightCodeblocks = (content: string) => {
    const doc = new DOMParser().parseFromString(content, 'text/html');
    doc.querySelectorAll('pre code').forEach((el) => {
      // @ts-ignore
      hljs.highlightElement(el);
    });
    return new XMLSerializer().serializeToString(doc);
  };

  const onRequestWaiting = () => {
    return (
      <Dialog open={open} onOpenChange={(value: boolean) => {
        if (!value) { controller.abort(); }
        setOpen(value);
      }}>
        <DialogTrigger asChild />
        <DialogContent className="sm:max-w-[500px] z-[9999999]">
          <DialogHeader>
            <DialogTitle />
            <DialogDescription />
          </DialogHeader>
          <div className="flex justify-center items-center gap-3" data-aria-hidden="true" aria-hidden="true">
            {t('Reading_doc')}
            <Loader2 className="animate-spin" style={{ width: 20, height: 20 }} />
          </div>
          <DialogFooter>
            <Button
              type="submit"
              onClick={() => { controller.abort(); setOpen(false) }}>
              {t('Cancel')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <>
      {onRequestWaiting()}
      <div className="h-full text-sm">
        {
          Object.keys(actinFileMenu).map(key => (
            <div className="border-b" key={key}>
              {actinFileMenu[key].map(item => {
                if (item.value === 'Export') {
                  return (<ExportMenu language={global.language} key={item.value} />)
                }
                if (item.value === "Save as Image") {
                  return (<MarkdownToPoster key={item.value} />)
                }
                return (
                  <Button
                    size="sm"
                    variant="ghost"
                    key={item.value}
                    className="hover:text-[#8e47f0] w-full flex justify-between"
                    onClick={async () => {
                      switch (item.value) {
                        case 'Save':
                          const novelContent = window.localStorage.getItem('novel-content');
                          const title = window.localStorage.getItem('novel-title');
                          if (!novelContent) {
                            toast({ description: t('export_not_json') })
                            return;
                          }
                          await exportJSON(title, novelContent, t)
                          return;
                        case 'Create a copy':
                          await onCreateCopy()
                          return;
                        case 'New file':
                          await onSave()
                          onOpenNewFile(item.value)
                        case 'Open local document':
                          await onOpenNewFile(item.value)
                        default:
                          break;
                      }
                    }}
                  >
                    <div className="flex items-center">
                      {item?.icon}
                      <span className="ml-2">{t(item.lable)}</span>
                    </div>
                  </Button>
                )
              })}
            </div>
          ))
        }
        <div >
          <div className="text-xs text-slate-500 mt-2 px-4">{t('RecentlyEdited')}</div>
          <div className="pt-2">
            {
              historicalRecords.length ? historicalRecords.filter((_, index) => index < 10).map((item) => {
                const id = window.localStorage.getItem('novel-id')
                return (
                  <div
                    key={item.id}
                    className="flex justify-between items-center w-full py-1 cursor-pointer hover:text-[#8e47f0] hover:bg-[#f1f5f9] p-3 rounded-sm"
                    style={{ color: +id === item.id ? '#8e47f0' : '', background: +id === item.id ? '#f1f5f9' : '' }}
                  >
                    <div className="flex items-center w-full" onClick={async () => { await onSave(); onOpenRecords(item) }}>
                      <HiOutlineDocumentText className="mr-2 text-lg min-w-[18px]" />
                      {item?.title || t('Untitled')}
                    </div>
                    {onDelete(item)}
                  </div>
                )
              }) : <div className="text-xs text-slate-500 text-center w-full">{t('no_recent_editing _records')}</div>
            }
            {
              historicalRecords.length && historicalRecords.length > 10 ? (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" className="hover:text-[#8e47f0] py-1 px-2 w-full" size="sm">
                      <span className="ml-1 text-sm">{t('More records')}</span>
                      <IoIosArrowForward />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="p-1 z-[9999] max-h-60 overflow-y-auto" align='end' side='right'>
                    {historicalRecords.filter((_, index) => index >= 10).map((item) => {
                      return (
                        <div
                          key={item.id}
                          className="flex justify-between items-center w-full py-1 cursor-pointer hover:text-[#8e47f0] hover:bg-[#f1f5f9] p-3 rounded-sm"
                        >
                          <div className="flex items-center w-full" onClick={async () => { await onSave(); onOpenRecords(item) }}>
                            <HiOutlineDocumentText className="mr-2 min-w-[18px]" />
                            {item?.title || t('Untitled')}
                          </div>
                          {onDelete(item)}
                        </div>
                      )
                    })}
                  </PopoverContent>
                </Popover>
              ) : <></>
            }
          </div>
        </div>
      </div>
    </>
  )
}
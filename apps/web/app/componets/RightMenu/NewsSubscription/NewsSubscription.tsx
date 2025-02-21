import { selectGlobal, setGlobalState } from "@/app/store/globalSlice";
import { useAppDispatch, useAppSelector } from "@/app/store/hooks";
import { languageMenuList, } from "@/lib/language";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/tailwind/ui/button";
import { Checkbox } from "@/components/tailwind/ui/checkbox";
import { MdDeleteOutline } from "react-icons/md";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/tailwind/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/tailwind/ui/dialog";
import { Loader2 } from "lucide-react";
import LoadAnimation from "@/components/tailwind/LoadAnimation";
import { VscInspect } from "react-icons/vsc";
import { InformationSourceForm } from "./InformationSourceForm";
import { addData, deleteData, getAllData, updateData, type IInformationSourceList } from "./informationDB";
import { WebToMd } from "@/app/api/informationSearch/service";
import { MarkdownViewer } from "../../MarkdownViewer";
import { toast } from "@/components/tailwind/ui/use-toast";
import { ErrMessage } from "../../ErrMessage";
import { useTranslations } from "next-intl";
import { useConstant } from "../constant";

const api_key = process.env.NEXT_PUBLIC_API_KEY;

export const NewsSubscription = () => {
    const t = useTranslations();
    const dispatch = useAppDispatch();
    const global = useAppSelector(selectGlobal);
    const [selectList, setSelectList] = useState([]);
    const [list, setList] = useState<IInformationSourceList[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [searchLoad, setSearchLoad] = useState(false);
    const [selectData, setSelectData] = useState({ lang: 'Chinese', template: '' });
    const [abstract, setAbstract] = useState<Partial<IInformationSourceList>>({});
    const [tab, setTab] = useState<'web' | 'markdown'>('web');
    const abortControllerRef = useRef<AbortController>(null)
    const { templateList } = useConstant(t)


    const SelectModule = (type: 'lang' | 'template' | 'searchType', list: Array<{ value: string, label: string }>) => {
        return (
            <Select onValueChange={(value) => setSelectData((v) => ({ ...v, [type]: value }))} value={selectData[type]}>
                <SelectTrigger className={`${type === 'lang' ? 'w-[180px]' : 'w-[200px]'}`}>
                    <SelectValue placeholder={type === "template" && t('newsSubscription.selectTemplate')} />
                </SelectTrigger>
                <SelectContent className="z-[99999]">
                    <SelectGroup>
                        {list.map(item => (<SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>))}
                    </SelectGroup>
                </SelectContent>
            </Select>
        )
    }

    // 全选
    const onSelectAll = () => {
        const ids = list.map(item => item.id);
        setSelectList(ids)
    }

    // 单选
    const onSingleChoice = (checked: boolean, id: number) => {
        if (checked) {
            setSelectList((v) => ([...v, id]))
        } else {
            setSelectList((v) => v.filter(f => f !== id))
        }
    }

    // 删除未选中
    const onDeleteUnselected = async () => {
        const tempList = list.filter(f => !selectList.includes(f.id))
        const result = await deleteData(tempList.map(item => item.id));
        if (!selectList.includes(abstract?.id)) {
            setAbstract((v) => ({}))
        }
        setList(() => ([...result]))
    }

    // 清空
    const onEmptyList = async () => {
        setList([]);
        setSelectList([]);
        setAbstract((v) => ({}))
        await deleteData(list.map(item => item.id));
    }

    // 单个删除
    const onDelete = async (id: number) => {
        if (id === abstract?.id) {
            setAbstract((v) => ({}))
        }
        const result = await deleteData([id]);
        setList(() => ([...result]))
        setSelectList((v => v.filter(f => f !== id)))
    }

    const onSetData = async (data: IInformationSourceList[]) => {
        const result = await addData(data);
        setList(() => ([...result]))
        return true;
    }

    // 开始创作
    const onStartCreating = () => {
        const url = list.filter(f => selectList.includes(f.id)).map(item => item.url);
        const params = {
            informationUrl: url,
            informationTemplate: selectData.template,
            informationLang: selectData.lang,
            selectRightMenu: '',
            newsSubscriptionCreationStatus: true,
            newsSubscriptionGenerationStatus: true,
        }
        dispatch(setGlobalState({ ...params }))
    }

    const onWebToMd = async (url: string, id: number) => {
        const controller = new AbortController();
        abortControllerRef.current = controller;
        setIsLoading(true);
        try {
            const result = await WebToMd(url, api_key, controller.signal);
            console.log(result);
            if (result) {
                setAbstract((v) => ({ ...v, summaryContent: result }));
                const newData = await updateData(id, { summaryContent: result })
                setList(() => ([...newData]))
            }
        } catch (error) {
            if (error.name !== 'AbortError') {
                if (error.response) {
                    try {
                        const errorData = await error.response.json();
                        console.log('errorData', errorData);
                        toast({
                            duration: 2000,
                            description: (ErrMessage(errorData?.error?.err_code, global.language)),
                            style: { zIndex: 99999 }
                        });
                    } catch (parseError) {
                        toast({
                            duration: 2000,
                            description: t('newsSubscription.failedToGetMarkdown'),
                            style: { zIndex: 99999 }
                        });
                    }
                } else {
                    toast({
                        duration: 2000,
                        description: t('newsSubscription.failedToGetMarkdown'),
                        style: { zIndex: 99999 }
                    });
                }
            }
        }
        setIsLoading(false);
    }

    useEffect(() => {
        if (tab === 'markdown' && !abstract?.summaryContent) {
            onWebToMd(abstract.url, abstract.id)
        }
    }, [tab]);

    useEffect(() => {
        if (global.selectRightMenu === "NewsSubscription") {
            getAllData().then(res => {
                if (res.length) {
                    setList(() => ([...res]))
                }
            })
        }
    }, [global.selectRightMenu])

    return (
        <Dialog
            open={global.selectRightMenu === "NewsSubscription"}
            onOpenChange={(open) => { dispatch(setGlobalState({ selectRightMenu: open ? 'NewsSubscription' : '' })) }}
        >
            <DialogTrigger asChild>
                <div className="flex flex-col justify-center items-center gap-2 cursor-pointer group" >
                    <VscInspect className={`text-2xl group-hover:text-[#8e47f0]`} />
                    <div className={`text-xs text-center group-hover:text-[#8e47f0]`}>{t('newsSubscription.title')}</div>
                </div>
            </DialogTrigger>
            <DialogContent className="h-[85%] sm:max-w-[85%] flex flex-col z-[9999] border-2 overflow-hidden">
                <DialogHeader>
                    <DialogTitle />
                    <DialogDescription />
                </DialogHeader>
                <div className="border h-full rounded-md flex flex-col" style={{ height: 'calc(100% - 65px)' }}>
                    <div className="border-t grid grid-cols-8 h-full">
                        <InformationSourceForm onSetData={onSetData} />
                        <div className="border-x p-2 col-span-3 h-full custom-scrollbar">
                            {
                                list.length ?
                                    <div className="flex justify-between items-center text-sm text-[#8e47f0] mb-5 flex-1">
                                        <div className="flex gap-3">
                                            <span className="cursor-pointer" onClick={onSelectAll}>{t('newsSubscription.selectAll')}</span>
                                            <span className="cursor-pointer" onClick={() => { setSelectList([]) }}>{t('newsSubscription.reset')}</span>
                                        </div>
                                        {
                                            !isLoading &&
                                            <div className="flex gap-3">
                                                <span className="text-slate-500 cursor-pointer" onClick={onDeleteUnselected}>{t('newsSubscription.deleteUnselected')}</span>
                                                <span className="text-red-600 cursor-pointer" onClick={onEmptyList}>{t('newsSubscription.clearAll')}</span>
                                            </div>
                                        }
                                    </div> : <></>
                            }
                            <div className="flex flex-col gap-5 felx-1 custom-scrollbar overflow-x-hidden" style={{ height: 'calc(100% - 40px)' }}>
                                {
                                    list.length ? list.map(item => (
                                        <div className="flex justify-between items-center gap-3 w-full cursor-pointer" key={item.id}>
                                            <div className="flex items-center gap-3" style={{ width: "calc(100% - 32px)" }}>
                                                <Checkbox
                                                    id={`${item.id}`}
                                                    checked={selectList.includes(item.id)}
                                                    onCheckedChange={(checked: boolean) => { onSingleChoice(checked, item.id) }}
                                                />
                                                <div
                                                    className="text-sm truncate cursor-pointer group"
                                                    onClick={() => {
                                                        setTab('web');
                                                        setIsLoading(false);
                                                        setAbstract({ ...item });
                                                        abortControllerRef.current?.abort()
                                                    }}>
                                                    <div className={`truncate group-hover:text-[#8e47f0] ${abstract?.id === item.id && 'text-[#8e47f0]'}`}>{item?.title || item.url}</div>
                                                    <div className={`truncate flex gap-5 text-xs text-slate-500 group-hover:text-[#b28be9] ${abstract?.id === item.id && 'text-[#b28be9]'}`}>
                                                        {item?.author && <span>{t('newsSubscription.author')}: {item?.author}</span>}
                                                        <span>{item?.pubDate}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="overflow-hidden">
                                                {(isLoading && item.id === abstract?.id) ?
                                                    <Loader2 className="animate-spin w-5 h-5" /> :
                                                    <MdDeleteOutline className="text-red-600 text-xl" onClick={() => { onDelete(item.id) }} />
                                                }
                                            </div>
                                        </div>
                                    )) :
                                        <div className="flex justify-center items-center h-full flex-col gap-3">
                                            <img src="/empty.png" />
                                            <div className="text-slate-500">{t('newsSubscription.noData')}</div>
                                        </div>
                                }
                            </div>
                        </div>
                        <div className="p-2 relative col-span-3 h-full">
                            {
                                isLoading &&
                                <div className='absolute left-0 top-0 w-full h-full bg-[#ffffff8a] z-[9999] flex justify-center items-center'>
                                    <LoadAnimation />
                                </div>
                            }
                            {
                                abstract?.id ?
                                    <>
                                        <div className="flex justify-between items-center pb-1">
                                            <div className="flex items-center gap-4">
                                                <div
                                                    onClick={() => !isLoading && setTab('web')}
                                                    className={`text-slate-700 cursor-pointer text-sm border-b border-background ${tab === 'web' && 'font-bold !border-[#8e47f0] !text-[#8e47f0]'}`}>
                                                    {t('newsSubscription.web')}
                                                </div>
                                                <div
                                                    onClick={() => !isLoading && setTab('markdown')}
                                                    className={`text-slate-700 cursor-pointer text-sm border-b border-background ${tab === 'markdown' && 'font-bold !border-[#8e47f0] !text-[#8e47f0]'}`}>
                                                    {t('newsSubscription.markdown')}
                                                </div>
                                            </div>
                                            {
                                                tab === 'web' &&
                                                <div className="flex items-center gap-3">
                                                    <div onClick={() => window.open(abstract?.url)} className="text-[#8e47f0] cursor-pointer text-sm">
                                                        {t('newsSubscription.openInBrowser')}
                                                    </div>
                                                </div>
                                            }
                                        </div>
                                        <div className="custom-scrollbar h-[calc(100%-24px)]">
                                            {
                                                tab === 'markdown' ?
                                                    <MarkdownViewer content={abstract?.summaryContent} className="h-0" />
                                                    :
                                                    abstract?.description ?
                                                        <div dangerouslySetInnerHTML={{ __html: abstract.description }} className="h-0" />
                                                        : <iframe
                                                            src={abstract.url}
                                                            className="custom-scrollbar h-full w-full"
                                                            sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-presentation"
                                                            referrerPolicy="no-referrer"
                                                            loading="lazy"
                                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                        />
                                            }
                                        </div>
                                    </> :
                                    <div className="flex justify-center items-center h-full flex-col gap-3">
                                        <img src="/empty.png" />
                                        <div className="text-slate-500">{t('newsSubscription.clickToPreview')}</div>
                                    </div>
                            }
                        </div>
                    </div>
                </div>
                <DialogFooter className="w-full justify-end">
                    <div className="flex gap-3">
                        {SelectModule('lang', languageMenuList)}
                        {SelectModule('template', templateList)}
                        <Button
                            variant="outline"
                            disabled={searchLoad || isLoading || selectList.length < 1 || global.newsSubscriptionGenerationStatus}
                            className="text-[#8e47f0] border-[#8e47f0] hover:text-[#8e47f0]  hover:bg-[#8e47f014]"
                            onClick={onStartCreating}
                        >
                            {t('newsSubscription.startCreating')}
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog >
    )
}

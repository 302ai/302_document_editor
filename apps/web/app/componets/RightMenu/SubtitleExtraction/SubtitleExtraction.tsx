import { useState } from "react";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { extractSubtitles } from "./service";
import { ErrMessage } from "../../ErrMessage";
import { BsCreditCard2Front } from "react-icons/bs";
import { Input } from "@/components/tailwind/ui/input";
import { Button } from "@/components/tailwind/ui/button";
import { toast } from "@/components/tailwind/ui/use-toast";
import { Textarea } from "@/components/tailwind/ui/textarea";
import { templateList } from "./getSubtitleExtractionPrompt";
import { useAppDispatch, useAppSelector } from "@/app/store/hooks";
import { selectGlobal, setGlobalState } from "@/app/store/globalSlice";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/tailwind/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/tailwind/ui/dialog";

const api_key = process.env.NEXT_PUBLIC_API_KEY;

export const SubtitleExtraction = () => {
    const dispatch = useAppDispatch();
    const t = useTranslations();

    const global = useAppSelector(selectGlobal);

    const [link, setLink] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [textContent, setTextContent] = useState('');
    const [openTextArea, setOpenTextArea] = useState(false);
    const [selectData, setSelectData] = useState({ lang: 'Chinese', template: '' });

    const SelectModule = (type: 'lang' | 'template', list: Array<{ value: string, label: string }>) => {
        return (
            <Select onValueChange={(value) => setSelectData((v) => ({ ...v, [type]: value }))} value={selectData[type]}>
                <SelectTrigger className={`${type === 'lang' ? 'w-[180px]' : 'w-[200px]'}`}>
                    <SelectValue placeholder={type === "template" && t('selectTemplate')} />
                </SelectTrigger>
                <SelectContent className="z-[99999]">
                    <SelectGroup>
                        {list.map(item => (<SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>))}
                    </SelectGroup>
                </SelectContent>
            </Select>
        )
    }

    const onExtractSubtitles = async () => {
        setIsLoading(true);
        try {
            const result = await extractSubtitles({ link, api_key });
            if (result?.error) {
                if (result.error?.err_code) {
                    toast({
                        duration: 2000,
                        description: (ErrMessage(result?.error?.err_code, global.language)),
                        style: { zIndex: 99999 }
                    });
                } else {
                    toast({
                        duration: 2000,
                        description: t('subtitleExtractionFailed'),
                        style: { zIndex: 99999 }
                    });
                }
            }
            if (result?.text) {
                setTextContent(result.text);
                setOpenTextArea(true);
            }
        } catch (error) {
            toast({
                duration: 2000,
                description: t('subtitleExtractionFailed'),
                style: { zIndex: 99999 }
            });
        }
        setIsLoading(false);
    }

    const onStartCreating = async () => {
        if (!selectData.template) {
            toast({
                duration: 2000,
                description: t('plaseSelectTemplate'),
                style: { zIndex: 99999 }
            });
            return;
        }
        const params = {
            subtitleText: textContent,
            informationLang: 'Chinese',
            selectRightMenu: '',
            informationTemplate: selectData.template,
            subtitleExtractionCreationStatus: true,
            subtitleExtractionGenerationStatus: true,
        }
        dispatch(setGlobalState({ ...params }));
    }

    return (
        <Dialog
            open={global.selectRightMenu === "SubtitleExtraction"}
            onOpenChange={(open) => { dispatch(setGlobalState({ selectRightMenu: open ? 'SubtitleExtraction' : '' })) }}
        >
            <DialogTrigger asChild>
                <div className="flex flex-col justify-center items-center gap-2 cursor-pointer group">
                    <BsCreditCard2Front className={`text-2xl group-hover:text-[#8e47f0]`} />
                    <div className={`text-xs text-center group-hover:text-[#8e47f0]`}>{t('subtitleExtraction')}</div>
                </div>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] flex flex-col z-[9999] border-2 overflow-hidden">
                <DialogHeader>
                    <DialogTitle>{t('subtitleExtractionTitle')}</DialogTitle>
                    <DialogDescription>{t('subtitleExtractionDescription')}</DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-1 gap-5">
                    <div className="flex items-center justify-between gap-5">
                        <div className="min-w-fit">{t('videoLink')}</div>
                        <Input placeholder={t('enterLink')} value={link} onChange={(e) => setLink(e.target.value)} />
                        <Button disabled={isLoading || !link.trim().length} onClick={onExtractSubtitles}>
                            {t('extractSubtitles')}
                            {isLoading && <Loader2 className="animate-spin mx-3" style={{ width: 20, height: 20 }} />}
                        </Button>
                    </div>
                    {
                        openTextArea &&
                        <Textarea className="min-h-[280px]" disabled={isLoading} value={textContent} onChange={(e) => setTextContent(e.target.value)} />
                    }
                </div>
                <DialogFooter className="w-full justify-end">
                    {
                        openTextArea &&
                        <div className="flex gap-3">
                            {SelectModule('template', templateList(t))}
                            <Button
                                variant="outline"
                                onClick={onStartCreating}
                                disabled={isLoading || global.subtitleExtractionGenerationStatus || !textContent.trim().length}
                                className="text-[#8e47f0] border-[#8e47f0] hover:text-[#8e47f0]  hover:bg-[#8e47f014]"
                            >
                                {t('startCreating')}
                            </Button>
                        </div>
                    }
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
import { getRSSHub } from "./service"
import { Loader2 } from "lucide-react"
import { ErrMessage } from "../../ErrMessage"
import { useAppSelector } from "@/app/store/hooks"
import { useEffect, useMemo, useState } from "react"
import { selectGlobal } from "@/app/store/globalSlice"
import { Input } from "@/components/tailwind/ui/input"
import { Button } from "@/components/tailwind/ui/button"
import { toast } from "@/components/tailwind/ui/use-toast"
import { Textarea } from "@/components/tailwind/ui/textarea"
import type { IInformationSourceList } from "./informationDB"
import { useClassifyDataList, replacePlaceholders } from "./constant"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/tailwind/ui/select"
import { useTranslations } from "next-intl"

const api_key = process.env.NEXT_PUBLIC_API_KEY;
export const InformationSourceForm: React.FC<{ onSetData: (data: Array<IInformationSourceList>) => Promise<boolean> }> = (props) => {
  const t = useTranslations();
  const { classifyDataList } = useClassifyDataList(t)
  const { onSetData } = props;
  const [isload, setIsLoad] = useState(false)
  const global = useAppSelector(selectGlobal);
  const [form, setForm] = useState({
    keyword: '',
    customValue: '',
    informationSource: 'wikinews/latest',
  })
  const [errors, setErrors] = useState<Record<string, string>>({});

  const selector = (params: {
    list: Array<{ value: string; label: string }>,
    key: string,
    label?: string,
    placeholder?: string,
    must?: boolean,
  }) => {
    const { list, key, label, placeholder, must = false } = params
    return (
      <div>
        <div className="flex items-start">
          {must && <span className="text-red-500 mr-1">*</span>}
          {label && <span className="font-bold text-sm">{label}</span>}
        </div>
        <Select
          onValueChange={(value) => {
            setForm((v) => ({ ...v, [key]: value }));
            setErrors((prev) => ({ ...prev, [key]: '' }));
          }}
          defaultValue={form[key]}
        >
          <SelectTrigger className="relative group">
            <SelectValue placeholder={placeholder ? placeholder : '点击选择'} />
          </SelectTrigger>
          <SelectContent className="z-[99999]">
            <SelectGroup>
              {list.map(item => (
                <SelectItem key={item.value} value={item.value}>
                  {typeof item.label === 'string' ? item.label : item.label}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
    );
  }

  const MoreParams = useMemo(() => {
    const params = classifyDataList.find(f => f.value === form.informationSource);
    if (params?.form) {
      return (
        <div className="flex flex-col gap-3">
          <div className="font-bold">{t('moreParams')}</div>
          {params.form.map(item => {
            if (item.paramsType === 'select' && item?.list) {
              return (
                <div key={item.key}>
                  {selector({ ...item, list: item.list })}
                  {errors[item.key] && <div className="text-red-500 text-sm">{errors[item.key]}</div>}
                </div>
              );
            }
            if (item.paramsType === 'input') {
              return (
                <div key={item.key}>
                  <div>
                    <div className="flex items-start">
                      {item.must && <span className="text-red-500 mr-1">*</span>}
                      {item.label && <span className="font-bold text-sm">{item.label}</span>}
                    </div>
                    <Textarea
                      placeholder={item?.placeholder ? item.placeholder : ''}
                      className={`min-h-[120px] overflow-y-auto ${errors[item.key] ? 'border-red-500' : ''}`}
                      onChange={(e) => {
                        setForm((v) => ({ ...v, [item.key]: e.target.value }));
                        setErrors((prev) => ({ ...prev, [item.key]: '' }));
                      }}
                      value={form[item.key] || ''}
                    />
                  </div>
                  {errors[item.key] && <div className="text-red-500 text-sm">{errors[item.key]}</div>}
                </div>
              );
            }
            return null;
          })}
        </div>
      );
    }
    return null;
  }, [form.informationSource, errors, classifyDataList]);

  useEffect(() => {
    setForm((v) => ({
      keyword: '',
      customValue: '',
      informationSource: v.informationSource,
    }))
  }, [form.informationSource])

  const onObtainInformation = async () => {
    if (form?.customValue || form.informationSource) {
      const newErrors: Record<string, string> = {};
      const currentParams = classifyDataList.find(f => f.value === form.informationSource);

      if (form.informationSource === 'Custom' && !form.customValue) {
        newErrors.customValue = t('enterCustomSourceAddress');
      }

      if (currentParams?.form) {
        currentParams.form.forEach(item => {
          if (item.must && !form[item.key]) {
            newErrors[item.key] = item.placeholder || '';
          }
        });
      }

      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        return;
      }
      setIsLoad(true);
      let path = replacePlaceholders(form.informationSource, form);
      try {
        const result = await getRSSHub(path, api_key, form.customValue);
        console.log(result);
        if ('error' in result) {
          if (result.error?.err_code) {
            toast({
              duration: 2000,
              description: (ErrMessage(result?.error?.err_code, global.language)),
              style: { zIndex: 99999 }
            });
          } else {
            toast({
              duration: 2000,
              description: t('failedToFetchInfo'),
              style: { zIndex: 99999 }
            });
          }
        } else {
          await onSetData(result);
        }
      } catch (error) {
        toast({
          duration: 2000,
          description: t('failedToFetchInfo'),
          style: { zIndex: 99999 }
        });
      }
      setIsLoad(false);
    }
  };

  return (
    <div className="p-5 flex flex-col gap-5 col-span-2 h-full custom-scrollbar">
      <div className="font-bold">{t('selectInformationSource')}</div>
      {selector({ list: classifyDataList, key: 'informationSource', placeholder: t('selectSource') })}
      {MoreParams}
      {
        form.informationSource === 'Custom' &&
        <div className="flex gap-3 flex-col">
          <div className="font-bold text-sm flex items-start">
            <span className="text-red-500 mr-1">*</span>
            {t('customSubscriptionAddress')}
          </div>
          <Input
            value={form.customValue}
            placeholder={t('enterCustomSourceAddress')}
            onChange={(e) => {
              setForm((v) => ({ ...v, customValue: e.target.value }));
              setErrors((prev) => ({ ...prev, customValue: '' }));
            }}
          />
          {errors.customValue && <div className="text-red-500 text-sm">{errors.customValue}</div>}
        </div>
      }
      <Button onClick={onObtainInformation} disabled={isload}>
        {t('fetchInformation')}
        {
          isload &&
          <Loader2 className="animate-spin" style={{ width: 20, height: 20 }} />
        }
      </Button>
    </div>
  )
}

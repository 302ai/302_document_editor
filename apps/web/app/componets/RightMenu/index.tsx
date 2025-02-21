import { AiChat } from "./AiChat";
import { TbChartAreaLine } from "react-icons/tb";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { FullTextSummary } from "./FullTextSummary";
import { selectGlobal, setGlobalState } from "../../store/globalSlice";
import { IntelligentMapping } from "./IntelligentMapping";
import { RiCameraLensLine, RiRobot2Line } from "react-icons/ri";
import type { EditorInstance } from "novel";
import { InformationSearch } from "./InformationSearch";
import { useTranslations } from "next-intl";
import { NewsSubscription } from "./NewsSubscription/NewsSubscription";

export const RightMenu = (props: { editorInstance: EditorInstance | null }) => {

  const { editorInstance } = props;
  const dispatch = useAppDispatch();
  const global = useAppSelector(selectGlobal);
  const t = useTranslations();
  const onClickMenu = (type: string) => {
    dispatch(setGlobalState({
      selectRightMenu: type === global.selectRightMenu ? '' : type
    }))
  }

  return (
    <div className={`z-[9998] bg-background sticky top-[48px] flex justify-between`} style={{ height: 'calc(100vh - 48px)' }}>
      {global.selectRightMenu === 'FullTextSummary' && <FullTextSummary />}
      {global.selectRightMenu === 'AiChat' && <AiChat />}
      {['FlowChart', 'IntelligentMapping'].indexOf(global.selectRightMenu) > -1 && <IntelligentMapping editorInstance={editorInstance} />}

      <div className={`w-[70px] h-full flex flex-col items-center gap-7 px-2 py-4  border-l`}>
        <div className="flex flex-col justify-center items-center gap-2 cursor-pointer group" onClick={() => onClickMenu('FullTextSummary')}>
          <RiCameraLensLine className={`text-2xl group-hover:text-[#8e47f0] ${global.selectRightMenu === "FullTextSummary" && "text-[#8e47f0]"}`} />
          <div className={`text-xs text-center group-hover:text-[#8e47f0] ${global.selectRightMenu === "FullTextSummary" && "text-[#8e47f0]"}`}>
            {t('Full_text_summary')}
          </div>
        </div>
        <div className="flex flex-col justify-center items-center gap-2 cursor-pointer group" onClick={() => onClickMenu('AiChat')}>
          <RiRobot2Line className={`text-2xl group-hover:text-[#8e47f0] ${global.selectRightMenu === "AiChat" && "text-[#8e47f0]"}`} />
          <div className={`text-xs text-center group-hover:text-[#8e47f0] ${global.selectRightMenu === "AiChat" && "text-[#8e47f0]"}`}>
            {t('AI_QA')}
          </div>
        </div>
        <div className="flex flex-col justify-center items-center gap-2 cursor-pointer group" onClick={() => onClickMenu('IntelligentMapping')}>
          <TbChartAreaLine className={`text-2xl group-hover:text-[#8e47f0] ${global.selectRightMenu === "IntelligentMapping" && "text-[#8e47f0]"}`} />
          <div className={`text-xs text-center group-hover:text-[#8e47f0]  ${global.selectRightMenu === "IntelligentMapping" && "text-[#8e47f0]"}`}>
            {t('intelligent_mapping')}
          </div>
        </div>
        <InformationSearch />
        <NewsSubscription />
      </div>
    </div>
  )
}

import { Loader2 } from "lucide-react";
import { useCompletion } from "ai/react";
import { ErrMessage } from "../ErrMessage";
import { FaRegUser } from "react-icons/fa";
import ReactMarkdown from "react-markdown";
import { RiRobot2Line } from "react-icons/ri";
import { useAppDispatch, useAppSelector } from "@/app/store/hooks";
import { RxDoubleArrowRight } from "react-icons/rx";
import { useEffect, useRef, useState } from "react";
import { selectGlobal, setGlobalState } from "@/app/store/globalSlice";
import { Button } from "@/components/tailwind/ui/button";
import { toast } from "@/components/tailwind/ui/use-toast";
import { MdCleaningServices, MdContentCopy, MdSend } from "react-icons/md";
import { Textarea } from "@/components/tailwind/ui/textarea";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/tailwind/ui/tooltip";
import { useTranslations } from "next-intl";
import { FaCircleUser } from "react-icons/fa6";

export const AiChat = () => {
  const t = useTranslations();
  const dispatch = useAppDispatch();
  const global = useAppSelector(selectGlobal);

  const chatMsg = useRef(null);
  const chatError = useRef(false);
  const chatContainerRef = useRef(null);
  const [chartInpt, setChartInpt] = useState('');
  const [chatContent, setChatContent] = useState([]);

  const onChat = () => {
    if (isLoading || !chartInpt) return;
    const { chatSelectText, novelTitle } = global;
    const message = [...chatContent, { role: "user", content: chartInpt }]
    const content = localStorage.getItem('markdown')
    setChatContent(() => [...message])
    setChartInpt('');
    complete(novelTitle, {
      body: {
        content,
        record: message,
        selected: chatSelectText,
      }
    })
  }

  const onCopyText = (text: string) => {
    if (text) {
      navigator.clipboard.writeText(text).then(() => {
        toast({
          duration: 2000,
          description: (t('copy_success'))
        })
      }, (err) => {
        toast({
          duration: 2000,
          description: (t('copy_error'))
        })
      });
    }
  }

  const { completion, complete, setCompletion, isLoading } = useCompletion({
    id: "writingChat",
    api: "/api/chat",
    onFinish: async (prompt, completion) => {
      setCompletion('')
      localStorage.setItem('writingChat', JSON.stringify(chatMsg.current))
    },
    onResponse: async (response) => {
      if (!response.ok) {
        chatError.current = true
        try {
          const errorData = await response.json();
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
  });

  useEffect(() => {
    if (chatError.current) {
      const message = [...chatContent];
      if (message.length) {
        const temp = JSON.parse(JSON.stringify(chatContent));
        const inputVal = temp.pop();
        setChatContent(() => [...temp])
        setChartInpt(inputVal?.content || '');
        chatError.current = false;
      }
    }
  }, [chatError.current])

  useEffect(() => {
    if (completion) {
      const lastData = chatContent[chatContent.length - 1];
      const message = [...chatContent];
      if (message[message.length - 1].role === 'assistant') {
        message[message.length - 1] = { ...lastData, content: completion }
      } else {
        message.push({ role: "assistant", content: completion })
      }
      chatMsg.current = message;
      setChatContent(() => message)
    }
  }, [completion])

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatContent]);

  useEffect(() => {
    const chatRecord = localStorage.getItem('writingChat');
    try {
      if (chatRecord && chatRecord !== null) {
        const data = JSON.parse(chatRecord)
        setChatContent(() => data || [])
      }
    } catch (error) {
    }
  }, [])

  return (
    <div className="w-[400px] h-full border-l flex justify-between flex-col z-[9999999]">
      <div className='flex justify-between w-full'>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" onClick={() => {
                localStorage.setItem('writingChat', JSON.stringify([]));
                setChatContent(() => [])
                chatMsg.current = [];
              }}>
                <MdCleaningServices className="text-lg text-rose-600" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{t('AiChat.Click_to_clear_all_chat_records')}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <Button variant="ghost" onClick={() => dispatch(setGlobalState({ selectRightMenu: '' }))}>
          <RxDoubleArrowRight className="text-lg" />
        </Button>
      </div>
      <div className='overflow-y-auto custom-scrollbar mb-3 p-3 flex-1' ref={chatContainerRef}>
        {
          chatContent.map((item, index) => {
            return (
              <div className={`flex flex-col p-3 max-w-[85%] group  w-max ${item.role === 'user' && 'ml-auto'}`} key={item.uid} >
                <div className={`flex gap-3`} >
                  <img src="/logo-mini.png" className={`w-6 h-6 ${item.role === 'user' && 'hidden'}`} />
                  <div >
                    <div className='rounded-sm border p-3'>
                      <div>
                        <ReactMarkdown className="w-full ReactMarkdown break-words">{item.content}</ReactMarkdown>
                      </div>
                    </div>
                    <div className='flex justify-end gap-3 mt-2 opacity-0 group-hover:opacity-100 transition-all'>
                      <MdContentCopy className='text-sm text-[#8e47f0] cursor-pointer' onClick={() => onCopyText(item.content)} />
                    </div>
                  </div>
                  <FaCircleUser className={`text-2xl ${item.role !== 'user' && 'hidden'}`} />
                </div>
              </div>
            )
          })
        }
      </div>
      <div className={`flex items-center custom-scrollbar p-3`}>
        <Textarea disabled={isLoading} value={chartInpt} placeholder={t('AiChat.enter_your_question')} onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            setTimeout(() => {
              const dom = window.document.getElementById("chatBut");
              if (dom) dom.click();
            }, 10);
          }
        }} onChange={(e) => { setChartInpt(e.target.value) }} />
        <div id="chatBut" onClick={() => { onChat() }} >
          {isLoading ?
            <Loader2 className="animate-spin ml-2 text-[#8e47f0]" style={{ width: 20, height: 20 }} /> :
            <MdSend className="text-[28px] cursor-pointer ml-2 text-[#8e47f0]" />
          }
        </div>
      </div>
    </div>
  )
}
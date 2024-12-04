import React, { useMemo, useRef } from "react";
import markdownit from 'markdown-it';
import { useAppDispatch } from "../store/hooks";
import { setGlobalState } from "../store/globalSlice";
import { setLocalStorage } from "@/lib/utils";

interface MarkdownViewerProps {
    content: string;
    className?: string;
    editMindMap?: boolean;
    onEditMindMap?: (v: boolean) => void;
    onChange?: (content: string) => void;
}

export const MarkdownViewer: React.FC<MarkdownViewerProps> = ({
    content,
    editMindMap,
    onEditMindMap,
    className,
}) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const dispatch = useAppDispatch();

    const md = useMemo(() => {
        const instance = new markdownit({
            html: true,
            linkify: true,
            typographer: true,
            breaks: true
        });
        instance.disable('fence');
        return instance;
    }, []);

    const processedContent = useMemo(() => {
        return content
            ?.replace(/^```\w*\n/, '')
            .replace(/```$/, '')
            .trim();
    }, [content]);

    const handleDoubleClick = () => {
        onEditMindMap(true)
    };

    const handleBlur = () => {
        onEditMindMap(false)
    };

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newContent = e.target.value;
        dispatch(setGlobalState({ novelSummary: newContent }))
        setLocalStorage('novelSummary', newContent);
    };

    if (editMindMap) {
        return (
            <textarea
                ref={textareaRef}
                value={content}
                onChange={handleChange}
                onBlur={handleBlur}
                autoFocus
                style={{ resize: 'none', height: 'calc(100% - 10px)' }}
                className={`w-full p-5 font-mono text-sm rounded-md overflow-hidden custom-scrollbar outline-none focus:ring-blue-500 ${className}`}
            />
        );
    }

    return (
        <div
            onDoubleClick={handleDoubleClick}
            className={`prose prose-sm p-5 [&_*]:text-foreground max-w-max cursor-text ${className}`}
            dangerouslySetInnerHTML={{
                __html: md?.render(processedContent || '')
            }}
        />
    );
};

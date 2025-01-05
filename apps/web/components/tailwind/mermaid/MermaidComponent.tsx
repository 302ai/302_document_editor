
import React, { useEffect, useRef } from 'react';
import mermaid from 'mermaid';
import { NodeViewWrapper } from '@tiptap/react';

export const MermaidComponent = ({ node }) => {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        mermaid.initialize({
            startOnLoad: false,
            theme: 'default',
        });
        if (ref.current) {
            const mermaidSource = node.attrs.mermaidSource || node.textContent;
            // Remove 'mermaid' and 'tags', and trim the blank space
            const mermaidContent = mermaidSource.replace(/^[\s\S]*?```mermaid\s*\n?/, '').replace(/```[\s\S]*$/, '').trim()
            if (mermaidContent) {
                mermaid.parse(mermaidContent).then(res => {
                    mermaid?.render(`mermaid-${Date.now()}`, mermaidContent)?.then(({ svg }) => {
                        if (ref.current) {
                            ref.current.innerHTML = svg;
                        }
                    }).catch((error) => {
                    });
                })
            }
        }
    }, [node.attrs.mermaidSource, node.textContent, node.pos]);

    return (
        <NodeViewWrapper className="mermaid-wrapper">
            <div ref={ref} className="mermaid" />
            <pre style={{ display: 'none' }}>{node.attrs.mermaidSource || node.textContent}</pre>
        </NodeViewWrapper>
    );
};
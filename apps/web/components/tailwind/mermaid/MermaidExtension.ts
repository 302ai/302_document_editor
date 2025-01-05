import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { MermaidComponent } from './MermaidComponent';

export const MermaidExtension = Node.create({
    name: 'mermaid',
    group: 'block',
    content: 'text*',
    code: true,
    defining: true,
    addAttributes() {
        return {
            mermaidSource: {
                default: null,
                parseHTML: element => element.getAttribute('data-mermaid-source'),
                renderHTML: attributes => {
                    if (!attributes.mermaidSource) {
                        return {};
                    }
                    return { 'data-mermaid-source': attributes.mermaidSource };
                },
            },
        };
    },
    parseHTML() {
        return [
            {
                tag: 'pre[class="mermaid"]',
                getAttrs: (node: HTMLElement) => ({
                    mermaidSource: node.textContent,
                }),
            },
            {
                tag: 'pre',
                preserveWhitespace: 'full',
                getAttrs: (node: HTMLElement) => {
                    const content = node.textContent.trim();
                    if (content.startsWith('```mermaid') && content.endsWith('```')) {
                        return { mermaidSource: content };
                    }
                    return false;
                },
            },
        ];
    },
    renderHTML({ node, HTMLAttributes }) {
        return ['pre', mergeAttributes(HTMLAttributes, { class: 'mermaid' }), node.textContent];
    },
    addNodeView() {
        return ReactNodeViewRenderer(MermaidComponent);
    },
});
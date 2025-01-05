// MermaidExtension.ts
import { Node, mergeAttributes } from '@tiptap/core';

export interface MermaidOptions {
    HTMLAttributes: Record<string, any>,
}

declare module '@tiptap/core' {
    interface Commands<ReturnType> {
        mermaid: {
            setMermaid: (content: string) => ReturnType,
        }
    }
}

export const Mermaid = Node.create<MermaidOptions>({
    name: 'mermaid',

    addOptions() {
        return {
            HTMLAttributes: {},
        }
    },

    group: 'block',

    content: 'text*',

    parseHTML() {
        return [
            {
                tag: 'pre[class="mermaid"]',
                preserveWhitespace: 'full',
            },
        ]
    },

    renderHTML({ HTMLAttributes }) {
        return ['pre', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, { class: 'mermaid' }), ['code', 0]]
    },

    addCommands() {
        return {
            setMermaid: (content: string) => ({ commands }) => {
                return commands.setNode(this.name, { content })
            },
        }
    },
})

export default Mermaid;
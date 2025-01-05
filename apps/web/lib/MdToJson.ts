import MarkdownIt from 'markdown-it';
import { generateJSON } from "@tiptap/core";
import Text from '@tiptap/extension-text'
import Bold from '@tiptap/extension-bold'
import Table from '@tiptap/extension-table'
import Document from '@tiptap/extension-document'
import Paragraph from '@tiptap/extension-paragraph'
import TableCell from '@tiptap/extension-table-cell'
import TableRow from '@tiptap/extension-table-row'
import Code from '@tiptap/extension-code'
import TableHeader from '@tiptap/extension-table-header'
import CodeBlock from "@tiptap/extension-code-block";
import Blockquote from "@tiptap/extension-blockquote";
import HorizontalRule from '@tiptap/extension-horizontal-rule'
import Image from '@tiptap/extension-image'
import Dropcursor from '@tiptap/extension-dropcursor'
import ListItem from '@tiptap/extension-list-item'
import Heading from '@tiptap/extension-heading'
import BulletList from '@tiptap/extension-bullet-list'
import OrderedList from '@tiptap/extension-ordered-list'
import Mermaid from "@/components/tailwind/mermaid/extensionMermaid";

export function MdToJson(markdown: string) {
    const md = new MarkdownIt({ html: true, breaks: true });
    const processedMarkdown = markdown.replace(/^\s*```/gm, '```');
    md.renderer.rules.fence = (tokens, idx, options, env, self) => {
        const token = tokens[idx];
        const code = token.content.trim();
        if (token.info.trim() === 'mermaid') {
            const text = "```mermaid\n" +
                `${token.content}\n` +
                "```"
            return `<pre class="mermaid">${text}</pre>`;
        }
        return `<pre><code class="language-${token.info.trim()}">${md.utils.escapeHtml(code)}</code></pre>`;
    };
    const html = md.render(processedMarkdown);

    const json = generateJSON(html, [
        Document, Mermaid, Text, Bold, Paragraph, Table, TableCell, TableRow,
        TableHeader, Code, CodeBlock, Blockquote, HorizontalRule, Image.configure({ inline: true }), Dropcursor,
        ListItem, Heading, BulletList, OrderedList
    ])
    return json;
}
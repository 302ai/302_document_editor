import mermaid from "mermaid";

export const convertMermaidToSvg = async (html: string): Promise<string> => {
    // Create a temporary DOM parser
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // Find all mermaid pre tags
    const mermaidElements = doc.querySelectorAll('pre.mermaid');

    // Convert each mermaid element
    for (const element of mermaidElements) {
        try {
            const mermaidContent = element.textContent?.replace(/^[\s\S]*?```mermaid\s*\n?/, '').replace(/```[\s\S]*$/, '').trim() || '';
            mermaid.initialize({ startOnLoad: false, theme: 'default' });
            const { svg } = await mermaid.render(`mermaid-${Date.now()}`, mermaidContent);
            const div = doc.createElement('div');
            div.innerHTML = svg;

            element.replaceWith(div);
        } catch (error) {
            console.error('Error converting Mermaid to SVG:', error);
        }
    }

    return doc.documentElement.outerHTML;
}

export const convertMermaidToImage = async (html: string): Promise<string> => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    const mermaidElements = doc.querySelectorAll('pre.mermaid');

    for (const element of mermaidElements) {
        try {
            const mermaidContent = element.textContent?.replace(/^[\s\S]*?```mermaid\s*\n?/, '').replace(/```[\s\S]*$/, '').trim() || '';
            mermaid.initialize({ startOnLoad: false, theme: 'default' });
            const { svg } = await mermaid.render(`mermaid-${Date.now()}`, mermaidContent);

            // Convert SVG to image
            const imageUrl = await svgToImage(svg);

            // 创建图片元素
            const img = doc.createElement('img');
            img.src = imageUrl;
            img.alt = 'Mermaid Diagram';
            img.className = 'mermaid-image';

            // Replace the original pre label
            element.replaceWith(img);
        } catch (error) {
            console.error('Error converting Mermaid to image:', error);
        }
    }

    return doc.documentElement.outerHTML;
}

async function svgToImage(svg: string, scale: number = 2): Promise<string> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            // 增加 canvas 尺寸
            canvas.width = img.width * scale;
            canvas.height = img.height * scale;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                reject(new Error('Failed to get canvas context'));
                return;
            }
            // 设置 canvas 的背景为白色（可选）
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // 使用缩放绘制图像
            ctx.scale(scale, scale);
            ctx.drawImage(img, 0, 0);

            // 使用更高的质量设置
            resolve(canvas.toDataURL('image/png', 1.0));
        };
        img.onerror = reject;

        // 确保 SVG 有明确的宽度和高度
        const parser = new DOMParser();
        const svgDoc = parser.parseFromString(svg, 'image/svg+xml');
        const svgElement = svgDoc.documentElement;
        if (!svgElement.hasAttribute('width')) {
            svgElement.setAttribute('width', '1000');
        }
        if (!svgElement.hasAttribute('height')) {
            svgElement.setAttribute('height', '1000');
        }

        const serializer = new XMLSerializer();
        const svgString = serializer.serializeToString(svgDoc);

        const svgDataUrl = `data:image/svg+xml,${encodeURIComponent(svgString)}`;
        img.src = svgDataUrl;
    });
}


export function formatMermaidToMarkdown(mermaidString) {
    // Remove the quotation marks at the beginning and end (if any)
    let cleaned = mermaidString.replace(/^"|"$/g, '');

    cleaned = cleaned.replace(/\\n/g, '\n');

    // Ensure that the Mermaid code block has the correct format
    if (!cleaned.startsWith('```mermaid')) {
        cleaned = '```mermaid\n' + cleaned;
    }
    if (!cleaned.endsWith('```')) {
        cleaned = cleaned + '\n```';
    }

    // Ensure there are blank lines before and after the Mermaid code block
    return '\n' + cleaned + '\n';
}
import { NextRequest, NextResponse } from 'next/server';
import HTMLtoDOCX from 'html-to-docx';
import { JSDOM } from 'jsdom';

// 处理图片：将图片转换为base64
async function processImages(html: string): Promise<string> {
    const dom = new JSDOM(html);
    const document = dom.window.document;
    const images = document.getElementsByTagName('img');

    for (const img of Array.from(images) as any) {
        try {
            if (img.src.startsWith('data:')) continue;

            const response = await fetch(img.src);
            const arrayBuffer = await response.arrayBuffer();
            const base64Image = Buffer.from(arrayBuffer).toString('base64');
            const mimeType = response.headers.get('content-type') || 'image/jpeg';
            img.src = `data:${mimeType};base64,${base64Image}`;
        } catch (error) {
            console.error('Image processing error:', error);
        }
    }

    return document.body.innerHTML;
}

// POST 方法处理函数
export async function POST(req: NextRequest) {
    try {
        const { htmlContent, title } = await req.json();

        if (!htmlContent) {
            return NextResponse.json(
                { error: 'No content provided' },
                { status: 400 }
            );
        }

        // 处理HTML内容
        const processedHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { 
              font-family: Arial, sans-serif;
              line-height: 1.6;
              margin: 2cm;
            }
            table { 
              border-collapse: collapse; 
              width: 100%;
              margin: 1em 0;
            }
            td, th { 
              border: 1px solid black; 
              padding: 8px;
              text-align: left;
            }
            img { 
              max-width: 100%; 
              height: auto;
              display: block;
              margin: 1em auto;
            }
            h1 {
              text-align: center;
              margin-bottom: 2em;
            }
          </style>
        </head>
        <body>
          <h1>${title || 'Untitled'}</h1>
          ${await processImages(htmlContent)}
        </body>
      </html>
    `;

        // 配置选项
        const options = {
            margin: {
                top: 1440,
                right: 1440,
                bottom: 1440,
                left: 1440,
            },
            font: 'Arial',
            title: title || 'Untitled',
            orientation: 'portrait',
            styles: {
                paragraphStyles: {
                    normal: {
                        spacing: {
                            line: 276,
                        },
                    },
                },
            },
        };

        // 转换为DOCX
        const fileBuffer = await HTMLtoDOCX(processedHtml, null, options);

        // 创建响应
        const response = new NextResponse(fileBuffer);

        // 设置响应头
        response.headers.set(
            'Content-Type',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        );
        response.headers.set(
            'Content-Disposition',
            `attachment; filename="${encodeURIComponent(title || 'document')}.docx"`
        );

        return response;

    } catch (error) {
        console.error('Export error:', error);
        return NextResponse.json(
            { error: 'Export failed' },
            { status: 500 }
        );
    }
}
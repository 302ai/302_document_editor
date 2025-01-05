import { NextResponse } from "next/server";
import { generateIllustration } from "./generateIllustration";
import { onSearchImage } from "./service";
import { cueWord } from "../cueWord";
import { OpenAI } from "openai";
export const runtime = "edge";

export async function POST(req: Request) {
    const params = await req.json();
    const api_key = process.env.NEXT_PUBLIC_API_KEY;
    const model = process.env.NEXT_PUBLIC_MODEL_NAME;
    const fetchUrl = `${process.env.NEXT_PUBLIC_API_URL}/v1`
    const { content, type, searchType } = params;
    if (type === 'searchImage') {
        try {
            const images = await onSearchImage({ searchType, api_key, query: content });
            return NextResponse.json({ images });
        } catch (error) {
            if (error.response) {
                // 尝试从响应中解析错误信息
                try {
                    const errorData = await error.response.json();
                    return NextResponse.json(errorData);
                } catch (parseError) {
                    return NextResponse.json({ error: parseError });
                }
            } else {
                return NextResponse.json({ error: error.message });
            }
        }
    }
    if (type === 'flow chart') {
        const openai = new OpenAI({ apiKey: api_key, baseURL: fetchUrl });
        let messages = cueWord[type]({ content, ...params } as any);
        const response = await openai.chat.completions.create({
            model,
            stream: false,
            messages,
            temperature: 0.7,
            top_p: 1,
            frequency_penalty: 0,
            presence_penalty: 0,
            n: 1,
        });
        if (response?.choices[0]?.message?.content) {
            const output = response.choices[0].message.content;
            return NextResponse.json({ output })
        }
        return NextResponse.json('')
    }
    const data = await generateIllustration(params);
    return NextResponse.json(data);
}


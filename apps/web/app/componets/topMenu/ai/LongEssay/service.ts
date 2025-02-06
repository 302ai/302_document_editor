import ky from "ky";
import type { IOutline } from "./constant";

interface IOutlineParams {
    body: {
        title: string;
        model: string;
        custom_prompt: string;
        language: 'zh' | 'en' | 'ja';
        include_illustration: boolean;
    }
    apiKey: string;
    signal: AbortSignal;
}
export const generateOutline = async (params: IOutlineParams) => {
    const { body, apiKey, signal } = params;
    try {
        const result = await ky(`${process.env.NEXT_PUBLIC_API_URL}/302/writing/api/v1/outline/generate`, {
            signal,
            method: 'post',
            timeout: false,
            body: JSON.stringify({ ...body }),
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`,
            },
        }).then(res => res.json())
        return result;
    } catch (error) {
        if (error.response) {
            try {
                const errorData = await error.response.json();
                return errorData;
            } catch (parseError) {
                return { error: parseError };
            }
        } else {
            return { error: error }
        }
    }
}

export const generateLengthyArticle = async (
    params: {
        body: {
            title: string;
            model: string;
            img_mode: string;
            sections: IOutline[],
            custom_prompt: string;
            language: 'zh' | 'en' | 'ja';
        },
        apiKey: string;
        signal: AbortSignal;
    },
    onData: (data: string) => void,
    onError: (error: any) => void,
    onComplete: () => void
) => {
    const { apiKey, body, signal } = params;
    try {
        const response: Response = await ky(`${process.env.NEXT_PUBLIC_API_URL}/302/writing/api/v1/longtext/generate`, {
            signal,
            method: "POST",
            timeout: false,
            body: JSON.stringify(body),
            headers: {
                Accept: "text/event-stream, application/json",
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`,
                "User-Agent": "Apifox/1.0.0 (https://apifox.com)",
            },
        });
        // Process EventStream
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        while (true) {
            const { done, value } = await reader!.read();
            if (done) break;
            const chunk = decoder.decode(value);
            const events = chunk.split('\n\n');
            for (const event of events) {
                if (event.startsWith('data: ')) {
                    const data = event.slice(6).trim();
                    if (data === '[DONE]') {
                        onComplete();
                    } else {
                        try {
                            const jsonData = JSON.parse(data);
                            let content = jsonData.choices[0].delta.content || '';
                            // Convert '\ n \ n' to actual line breaks
                            content = content.replace(/\\n/g, '\n');
                            onData(content);
                        } catch (e) {
                            // If it's not JSON, process the string directly
                            let content = data;
                            // Convert '\ n \ n' to actual line breaks
                            content = content.replace(/\\n/g, '\n');
                            onData(content);
                        }
                    }
                }
            }
        }
    } catch (error: any) {
        if (error.response) {
            try {
                const errorData = await error.response.json();
                onError(errorData);
            } catch (parseError) {
                onError({ error: parseError });
            }
        } else {
            onError({ error: error });
        }
    }
};




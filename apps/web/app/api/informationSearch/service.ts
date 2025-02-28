import ky from "ky";
import OpenAI from "openai";
import { getPrompt } from "./getPrompt";
import { OpenAIStream, StreamingTextResponse } from "ai";
import { generateIllustration } from "../generateIllustration/generateIllustration";
import type { IBochaaiResult, IParams, ISearch1ApiResult, ITavilyResult } from "./interface";
import { GenerateMainTextParagraphs } from "@/app/componets/RightMenu/SubtitleExtraction/service";

export const runtime = "edge";

const MAXIMUM = 10;
export const searchList = async (params: IParams) => {
  const { searchType = 'Tavily' } = params;
  let list = [];
  if (searchType === 'Tavily') {
    list = await onTavilySearch({ ...params })
  }
  if (searchType === 'Bocha') {
    list = await onBochaSearch({ ...params })
  }
  if (['Google', 'Bing'].includes(searchType)) {
    list = await onSearch1Api({ ...params })
  }
  const recommendedList: string[] | { error: any } = await searchRecommendedWords({ ...params });
  return { recommendedList, list }
}


// Recommended search keywords
export const searchRecommendedWords = async (params: IParams) => {
  const { api_key, model, query, language } = params;
  const fetchUrl = `${process.env.NEXT_PUBLIC_API_URL}/v1`
  const openai = new OpenAI({
    apiKey: api_key,
    baseURL: fetchUrl,
  });
  const template = 'Recommended Words';
  const prompt = getPrompt(template, language, query)
  try {
    const response = await openai.chat.completions.create({
      model,
      stream: false,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0,
      n: 1,
    });
    if (response?.choices[0]?.message?.content) {
      const content = JSON.parse(response?.choices[0]?.message?.content)
      return content?.items || [];
    }
  } catch (error) {
    return error
  }
}

// Content Summary
export const contentSummary = async (param: Omit<IParams, 'query' | 'language'> & { url: string }, isStream = true) => {
  const { api_key, model, url, } = param;
  const fetchUrl = `${process.env.NEXT_PUBLIC_API_URL}/v1`
  const openai = new OpenAI({ apiKey: api_key, baseURL: fetchUrl });
  const prompt = getPrompt('Content Summary')
  try {
    const text = await WebToMd(url, api_key)
    const response = await openai.chat.completions.create({
      model,
      stream: isStream,
      messages: [
        { "role": "system", "content": prompt },
        { "role": "user", "content": text },
      ],
      temperature: 0.7,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0,
      n: 1,
    })
    if (isStream) {
      // @ts-ignore
      const stream = OpenAIStream(response);
      return new StreamingTextResponse(stream);
    } else {
      return response;
    }
  } catch (error) {
    if (error.response) {
      try {
        const errorData = await error.response.json();
        console.log('errorData', errorData);
        if (!errorData?.error) {
          return { error: errorData }
        }
        return errorData
      } catch (parseError) {
        return { error: parseError }
      }
    } else {
      return error
    }
  }
}

// Link to MD
export const WebToMd = async (url: string, api_key: string, signal?: AbortSignal) => {
  const result = await ky(`${process.env.NEXT_PUBLIC_API_URL}/jina/reader/${url}`, {
    method: 'get',
    timeout: false,
    redirect: 'follow',
    headers: { Authorization: `Bearer ${api_key}`, },
    signal
  }).then(res => res.text());
  return result;
}

// Article generation
export const articleGeneration = async (param: Omit<IParams, 'query'> & { template: string, urls?: string[], captions?: string }) => {
  const { api_key, model, language, urls, template, captions } = param;
  let content = '';
  // Extract link content
  try {
    if (urls?.length) {
      for (let i = 0; i < urls.length; i++) {
        const result = await contentSummary({ ...param, url: urls[i] }, false);
        if (result?.error) {
          continue;
        }
        content += `\n\n${result?.choices[0]?.message?.content}`
      }
    }
    if (captions && template.indexOf('SubtitleExtraction') > -1) {
      content = await GenerateMainTextParagraphs({ template, apiKey: api_key, model, textContent: captions })
    }
    const fetchUrl = `${process.env.NEXT_PUBLIC_API_URL}/v1`
    const openai = new OpenAI({ apiKey: api_key, baseURL: fetchUrl });
    const prompt = getPrompt(template || 'Default Template', language);
    const response = await openai.chat.completions.create({
      model,
      stream: true,
      messages: [
        { "role": "system", "content": prompt },
        { "role": "user", "content": content },
      ],
      temperature: 0.7,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0,
      n: 1,
    })

    let buffer = ''; // Used to store unfinished content
    let isCollectingImageDesc = false; // Is the tag collecting image descriptions
    const decoder = new TextDecoder();
    const customStream = new TransformStream({
      async transform(chunk, controller) {
        let content = '';
        // Convert various possible formats into strings
        if (chunk instanceof Uint8Array) {
          content = decoder.decode(chunk);
        } else if (Array.isArray(chunk)) {
          content = decoder.decode(new Uint8Array(chunk));
        } else if (typeof chunk === 'object' && Object.values(chunk).every(val => typeof val === 'number')) {
          content = decoder.decode(new Uint8Array(Object.values(chunk)));
        } else if (typeof chunk === 'string') {
          content = chunk;
        }

        buffer += content;
        // Process complete image syntax
        if (isCollectingImageDesc) {
          // Check if the end of the image syntax is found
          const endMatch = buffer.match(/\]\((https?:\/\/[^\)]*|)\)/);
          // if (endIndex !== -1) {
          if (endMatch && buffer.indexOf(endMatch[0]) > -1) {
            const endIndex = buffer.indexOf(endMatch[0]);
            // Extract complete image description
            const startIndex = buffer.lastIndexOf('![');
            const fullImageSyntax = buffer.substring(startIndex, endIndex + 3);
            const description = buffer.substring(startIndex + 2, endIndex);

            try {
              // Generate images
              const result: any = await generateIllustration({ model, api_key, content: description, type: 'Ideogram 2.0', size: 'auto' })
              if (result?.data.length && result?.data[0]?.url) {
                const newImageSyntax = `![${description}](${result.data[0].url})`;
                buffer = buffer.substring(0, startIndex) + newImageSyntax + buffer.substring(endIndex + endMatch[0].length);
              }
            } catch (error) {
              console.error('Generate image failed:', error);
              buffer = buffer.replace(fullImageSyntax, description);
            }

            isCollectingImageDesc = false;

            // Output processed content
            controller.enqueue(buffer);
            buffer = ''; // Clear buffer
          }
          // If the ending section is not found, continue collecting
          return;
        }
        // Check for new image syntax to begin
        const startIndex = buffer.indexOf('![');
        if (startIndex !== -1) {
          // Check if there is complete image syntax in the current buffer
          const endMatch = buffer.match(/\]\((https?:\/\/[^\)]*|)\)/);
          if (endMatch && buffer.indexOf(endMatch[0]) > startIndex) {
            const endIndex = buffer.indexOf(endMatch[0]);
            const fullImageSyntax = buffer.substring(startIndex, endIndex + endMatch[0].length);
            if (!endMatch[1]) {
              const description = buffer.substring(startIndex + 2, endIndex);
              try {
                // Generate images
                const result: any = await generateIllustration({ model, api_key, content: description, type: 'Ideogram 2.0', size: 'auto' })
                if (result?.data.length && result?.data[0]?.url) {
                  // Replace image syntax
                  const newImageSyntax = `![${description}](${result.data[0].url})`;
                  buffer = buffer.substring(0, startIndex) + newImageSyntax + buffer.substring(endIndex + endMatch[0].length);
                }
              } catch (error) {
                console.error('Generate image failed:', error);
                buffer = buffer.replace(fullImageSyntax, description);
              }
            }

            // Output processed content
            controller.enqueue(buffer);
            buffer = ''; // Clear buffer
          } else {
            // Incomplete image syntax, starting collection mode
            isCollectingImageDesc = true;
            return;
          }
        } else {
          // No image syntax, output directly
          controller.enqueue(buffer);
          buffer = '';
        }
      },
      flush(controller) {
        // Process the remaining buffer
        if (buffer) {
          controller.enqueue(buffer);
        }
      }
    });
    const transformedStream = OpenAIStream(response).pipeThrough(customStream);
    return new StreamingTextResponse(transformedStream);
  } catch (error) {
    if (error.response) {
      try {
        const errorData = await error.response.json();
        return errorData
      } catch (parseError) {
        return { error: parseError }
      }
    } else {
      return error
    }
  }
}


// Bocha Search
export const onBochaSearch = async (param: IParams) => {
  const listResult: IBochaaiResult = await ky(`${process.env.NEXT_PUBLIC_API_URL}/bochaai/v1/web-search`, {
    method: 'post',
    headers: { Authorization: `Bearer ${param.api_key}`, },
    body: JSON.stringify({ ...param, count: MAXIMUM, summary: true }),
    timeout: false
  }).then(res => res.json());
  let list = [];
  if (listResult?.data?.webPages?.value) {
    const temp = listResult?.data?.webPages?.value;
    list = temp.map(item => ({
      url: item.url,
      title: item.name,
      content: item.snippet,
      summaryContent: item.summary,
    }))
  }
  return list;
}

// Tavily Search
export const onTavilySearch = async (params: IParams) => {
  const { api_key, query } = params;
  const listResult: ITavilyResult = await ky(`${process.env.NEXT_PUBLIC_API_URL}/tavily/search`, {
    method: 'get',
    headers: { Authorization: `Bearer ${api_key}`, },
    searchParams: { api_key, query, max_results: MAXIMUM },
    timeout: false
  }).then(res => res.json());
  let list = [];
  if (listResult?.results) {
    list = listResult?.results;
  }
  return list;
}


// Search1Api
export const onSearch1Api = async (params: IParams) => {
  const listResult: ISearch1ApiResult = await ky(`${process.env.NEXT_PUBLIC_API_URL}/search1api/search`, {
    method: 'post',
    headers: { Authorization: `Bearer ${params.api_key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...params, max_results: MAXIMUM, search_service: params.searchType.toLowerCase() }),
    timeout: false
  }).then(res => res.json());
  let list = [];
  if (listResult?.results) {
    const temp = listResult?.results;
    list = temp.map(item => ({
      url: item.link,
      title: item.title,
      content: item.snippet,
    }))
  }
  return list;
}
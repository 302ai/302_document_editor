"use server"

import ky from "ky"
import OpenAI from "openai"
import { getSubtitleExtractionPrompt } from "./getSubtitleExtractionPrompt"

interface IExtractSubtitles {
  detail: {
    subtitlesArray: {
      end: number,
      index: number,
      speaker_id: number,
      startTime: number,
      text: string
    }[]
  }
}

function formatTime(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  return hours > 0
    ? `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
    : `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export const extractSubtitles = async (params: { link: string, api_key: string }) => {
  const { link, api_key } = params;
  try {
    const result = await ky.get(`${process.env.NEXT_PUBLIC_AUDIO_FETCH_URL}/302/transcript?url=${link}`, {
      headers: { Authorization: `Bearer ${api_key}`, },
    }).then(res => res.json()) as IExtractSubtitles;
    if (result?.detail?.subtitlesArray?.length) {
      let text = '';
      result.detail.subtitlesArray.forEach(item => {
        const startTime = formatTime(item.startTime)
        if (item?.text) {
          text += `${startTime} ${item.text}\n\n`;
        }
      })
      return { text }
    }
    return { error: 'Subtitle extraction failed' }
  } catch (error: any) {
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

export const GenerateMainTextParagraphs = async (params: { textContent: string, model: string, apiKey: string, template: string }) => {
  const { textContent, model, apiKey, template } = params;
  const fetchUrl = process.env.NEXT_PUBLIC_API_URL
  const openai = new OpenAI({ apiKey, baseURL: fetchUrl });
  let content = '';
  const result = await GenerateSummary(params);
  if (result) {
    const outline = JSON.parse(result);
    for (let i = 0; i < outline?.parts.length; i++) {
      const introduction = outline.parts[i];
      const prompt = getSubtitleExtractionPrompt({ template, title: outline?.title, mainText: textContent, introduction })
      const response = await openai.chat.completions.create({
        model,
        stream: false,
        messages: [
          { "role": "user", "content": prompt },
        ]
      });
      if (response?.choices[0]?.message?.content) {
        const output = response.choices[0].message.content;
        content += output;
      }
    }
  }
  return content;
}

const GenerateSummary = async (params: { textContent: string, model: string, apiKey: string }) => {
  const { textContent, model, apiKey } = params;
  const fetchUrl = process.env.NEXT_PUBLIC_API_URL
  const openai = new OpenAI({ apiKey, baseURL: fetchUrl });

  const prompt = `-Please summarize the provided content while maintaining the original language.
-Focus on capturing the key points and main ideas.
-Keep the summary concise but comprehensive.
-Directly output the summary without adding any other content.`

  const response = await openai.chat.completions.create({
    model,
    stream: false,
    messages: [
      { "role": "system", "content": prompt },
      { "role": "user", "content": textContent },
    ]
  });
  if (response?.choices[0]?.message?.content) {
    const output = response.choices[0].message.content;
    const result = await GenerateOutline({ ...params, summary: output })
    return result;
  }
  return '';
}

const GenerateOutline = async (params: { summary: string, model: string, apiKey: string }) => {
  const { summary, model, apiKey } = params;
  const fetchUrl = process.env.NEXT_PUBLIC_API_URL
  const openai = new OpenAI({ apiKey, baseURL: fetchUrl });

  const prompt = `Design a title and a content outline that generates paragraph format content based on the provided text, split them into several parts,
which should contain the content you need to introduce.
Including but not limited to the main content of the content.
Pay attention to clear language expression and logical structure.

Result schema:"""
interface Result {{
title: string;  //  title
parts: string[];  // each parts of your plan
}}
"""

You must return the result in JSON format, do not add any other content, do not wrapped in code block with` + "'```json' and '```'."

  const response = await openai.chat.completions.create({
    model,
    stream: false,
    messages: [
      { "role": "system", "content": prompt },
      { "role": "user", "content": summary },
    ]
  });
  if (response?.choices[0]?.message?.content) {
    const output = response.choices[0].message.content;
    return output;
  }
  return '';
}
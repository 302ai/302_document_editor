export type ActionType = 'GenerateOutline' | 'GenerateLengthyArticle';
export interface IOutline { type: 'text' | 'image'; content: string, aspect_ratio?: string }
export const aspectRatioList = ['1:1', '9:16', '16:9', '3:4', '4:3']

export const LANG_ABBREVIATION: { [key: string]: 'zh' | 'en' | 'ja' } = { "english": 'en', "chinese": 'zh', "japanese": 'ja' }


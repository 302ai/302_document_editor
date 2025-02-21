"use server"

import ky from "ky"
import { parseString } from 'xml2js'
import { promisify } from 'util'
import type { IInformationSourceList } from "./informationDB"

const parseXml = promisify(parseString)

interface RssItem {
  link: string[];
  title: string[];
  description: string[];
  author?: string[];
  pubDate: string[];
}

interface ParsedXml {
  rss: {
    channel: [{
      item: RssItem[];
    }];
  };
}


export const getRSSHub = async (path: string, apikey: string, customValue?: string): Promise<IInformationSourceList[] | { error: any }> => {
  try {
    const url = customValue || `${process.env.NEXT_PUBLIC_API_URL}/rsshub/${path}?apikey=${apikey}`
    const result = await ky.get(url, {
      redirect: 'follow',
      timeout: false
    }).then(res => res.text());

    const parsedXml = await parseXml(result) as ParsedXml;

    if (!parsedXml.rss?.channel?.[0]?.item) {
      console.error('Invalid RSS structure received from API');
      throw new Error('Invalid RSS structure');
    }

    const items = parsedXml.rss.channel[0].item;

    const parsedItems = items
      .filter((item: RssItem) => item.link?.[0])
      .map((item: RssItem) => {
        const link = item.link[0];
        const title = item.title?.[0] ?? '';
        const description = item.description?.[0] ?? '';
        const author = item.author?.[0] ?? '';
        const pubDate = item.pubDate?.[0] ?? '';

        let formattedDate = ''
        if (pubDate) {
          const date = new Date(pubDate);
          formattedDate = date.toISOString().replace(/T/, ' ').replace(/\..+/, '');
        }

        return {
          url: link,
          title,
          description,
          author,
          pubDate: formattedDate || '',
        };
      });

    return parsedItems;
  } catch (error) {
    if (error.response) {
      try {
        const errorData = await error.response.json();
        return errorData;
      } catch (parseError) {
        return { error: parseError }
      }
    } else {
      return { error: error.message }
    }
  }
}

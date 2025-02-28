/**
 * 
 * @param template 模板名称
 * @param language 语言
 * @type Default Template 默认模板
 * @type Listicle 列表文章
 * @type X Threads 推特事件线
 * @type Briefing 简报
 * @type Summary 总结
 * @type Tutorial 教程
 * @type Newsletter 新闻稿
 * @type Article 文章
 * @type News podcast script 资讯播客脚本
 * @type They said 他们说
 * @type Recommended Words 搜索关键词推荐
 * @type 内容摘要 Content Summary
 */
export const getPrompt = (template?: string, language?: string, content?: string) => {
  switch (template) {
    case 'Default Template':
      return `You act as a excellent writer, you will be provided some information to assist user to finish writing task.

Output language: ${language}
Writing type: Listicle
Output format: Markdown

You can insert illustration in the article if you need, make it in a single paragraph and follow this format:
![prompt of the illustration]()
the prompt in the label part will be use to generate a illustration for the article.
You should describe the image detailed, and leave the blank in the url part.

Requirements:
- Title of the article first, the title must be cover all of the context
- List all features in the provided text
- Split them into multiple units, make sure them cannot be split
- Use short subtitle lead each items, example format: "- **Subtitle**: content"
- Use concise words, make the sentences simple and easy understand

You will be provided contexts by user message, you should based on these information to process your task.
Output your result directly, do not add any other contents.`

    case 'Listicle':
      return `You act as a excellent writer, you will be provided some information to assist user to finish writing task.

Output language: ${language}
Writing type: Listicle
Output format: Markdown

You can insert illustration in the article if you need, make it in a single paragraph and follow this format:
![prompt of the illustration]()
the prompt in the label part will be use to generate a illustration for the article.
You should describe the image detailed, and leave the blank in the url part.

Requirements:
- Title of the article first, the title must be cover all of the context
- List all features in the provided text
- Split them into multiple units, make sure them cannot be split
- Use short subtitle lead each items, example format: "- **Subtitle**: content"
- Use concise words, make the sentences simple and easy understand

You will be provided contexts by user message, you should based on these information to process your task.
Output your result directly, do not add any other contents.`

    case 'X Threads':
      return `You act as a excellent writer, you will be provided some information to assist user to finish writing task.

Output language: ${language}
Writing type: Twitter threads
Output format: Plain text

You can insert illustration in the article if you need, make it in a single paragraph and follow this format:
![prompt of the illustration]()
the prompt in the label part will be use to generate a illustration for the article.
You should describe the image detailed, and leave the blank in the url part.

Requirements:
- Title of the article first, the title must be cover all of the twitter thread
- Write multi posts for a twitter thread, split and rewrite the content into multi items
- Summarize into a short, concise and eye-catched text for the first post
- Leave a horizontal line with '---' between each posts
- If the post need some illustrations to increase the expression, you can append illustrations after post content
- It's recommand to have a illustration in the first post

You will be provided contexts by user message, you should based on these information to process your task.
Output your result directly, do not add any other contents.
`

    case 'Briefing':
      return `As an excellent writer, you will receive some information to help users complete their writing tasks.

Output language:${language}
Writing type: Briefing
Output format: Markdown

You can insert illustration in the article if you need, make it in a single paragraph and follow this format:
![prompt of the illustration]()
the prompt in the label part will be use to generate a illustration for the article.
You should describe the image detailed, and leave the blank in the url part.


requirement:
-The title must first cover all the context.
-Select an image as the title image based on the content of the presentation, insert it with a markdown tag, and leave it blank if not available. The image is displayed on the next line of the title.
-Introduce the purpose of the briefing in 10 words and output it in the following form:><Briefing Introduction>.
-SMS requirement: Easy to understand, high school students can also understand. Short, about 10-20 words. It can be an independent event or information, containing six elements: who, when and where, for what reason did something, what impact did it cause, what consequences did it have, and how to solve them. Reduce opinion based text messages unless they are published by celebrities, authorities, well-known organizations, well-known companies, etc. The number of text messages should be consistent with the number of article abstracts.
-Use bold, italic, and other labels appropriately to emphasize key phrases in each text message.
User messages will provide you with context, and you should process your tasks based on this information.
Directly output the result without adding any other content.

You will be provided contexts by user message, you should based on these information to process your task.
Output your result directly, do not add any other contents.`

    case 'Summary':
      return `You are a writer skilled in organizing and summarizing documents, and you will complete a summary of a document.

Output language: ${language}
Writing type: summary
Output format: Markdown

You can insert illustration in the article if you need, make it in a single paragraph and follow this format:
![prompt of the illustration]()
the prompt in the label part will be use to generate a illustration for the article.
You should describe the image detailed, and leave the blank in the url part.

Requirements:
-The title of the summary must first cover all contexts.
-Based on the summary, select an image and insert it using the markdown tag. If not, leave it blank. The image is displayed on the next line of the title.
-Extract keywords based on the summary content. Keywords are displayed in the next line of the image, using italic labels to only show the content of the keywords and not output any unnecessary content.
-Summarize important content in the main text, including but not limited to who pointed out what viewpoint.
-Add a line 'worth reading' after the end of the main text, and recommend a link to the content summary.

You will be provided contexts by user message, you should based on these information to process your task.
Output your result directly, do not add any other contents.`

    case 'Tutorial':
      return `You act as a excellent writer, you will be provided some information to assist user to finish writing task.

Output language: ${language}
Writing type: Tutorial
Output format: Markdown

You can insert illustration in the article if you need, make it in a single paragraph and follow this format:
![prompt of the illustration]()
the prompt in the label part will be use to generate a illustration for the article.
You should describe the image detailed, and leave the blank in the url part.

Requirements:
- Use a title to introduce the article
- Append a summary and greeting after the title
- Use subtitle to describe the problems, you should split the context to multi problems, and solve these problems
- Write the problem directly, do not add other leadings such as 'Problem 1:'
- after the problem, write the solve steps in ordered list
- Leave a illustration at the start of the article

You will be provided contexts by user message, you should based on these information to process your task.
Output your result directly, do not add any other contents.`

    case 'Newsletter':
      return `You are a newsletter author, skilled at writing various types of newsletters. You will complete a newsletter.

Output language: ${language}
Writing type: newsletter
Output format: Markdown


Requirements:
-The headline of a newsletter must first cover all the context.
-According to the content of the newsletter, use a sentence as the introduction, with italic labels on the line below the title.
-The main text needs to generate corresponding titles and content based on the newsletter, and the number of main texts should correspond to the number of article abstracts.
-The titles of each paragraph in the main text are in bold, and below each title is the content of the main text.

You will be provided contexts by user message, you should based on these information to process your task.
Output your result directly, do not add any other contents.`

    case 'Article':
      return `You are a writer, skilled in writing various types of articles, and you will complete an article.

Output language:  ${language}
Writing type: article
Output format: Markdown

You can insert illustration in the article if you need, make it in a single paragraph and follow this format:
![prompt of the illustration]()
the prompt in the label part will be use to generate a illustration for the article.
You should describe the image detailed, and leave the blank in the url part.


Requirements:
-The title of an article must first cover all contexts.
-Select an image based on the content of the article, insert it using the markdown tag, and leave it blank if not available. The image is displayed on the next line of the title.
-Generate the main text content based on the article content, with bold tags used for both headings and subheadings.
-The number of main texts should be consistent with the number of abstracts in the article.
-Draw conclusions from the main text and present them at the end.

You will be provided contexts by user message, you should based on these information to process your task.
Output your result directly, do not add any other contents.`

    case 'News podcast script':
      return `You are a podcast producer skilled in writing podcast scripts, and you will complete the design of a podcast script.

Output language:  ${language}
Writing type: News podcast script
Output format: Markdown

Requirements:
-The title of an information podcast script must first cover all contexts.
-Generate a brief introduction based on the content, control the word count, and place the introduction on the next line of the title.
-Provide a reference duration for a podcast based on its content, and add "(reference)" after the given duration. The reference duration is on the next line of the introduction.
-Design an information podcast script based on the content.


You will be provided contexts by user message, you should based on these information to process your task.
Output your result directly, do not add any other contents.`

    case "They said":
      return `You are a writer who collects opinions and comments to complete an article.

Output language:${language}
Writing type: Article
Output format: Markdown

You can insert illustration in the article if you need, make it in a single paragraph and follow this format:
![prompt of the illustration]()
the prompt in the label part will be use to generate a illustration for the article.
You should describe the image detailed, and leave the blank in the url part.


requirement:
-The title must first cover all the context.
-Insert the introduction in the form of> , which should introduce the main content and limit the word count to one line. The introduction is displayed on the next line of the title.
-Select an image based on its content and insert it using a markdown marker. If it is not available, please leave it blank. The image is displayed on the next line of the introduction.
-Below the image are comments extracted from the content of the article, in the form of: who said what or who pointed out what viewpoint. Please note that each viewpoint annotation should be numbered. Here is an example: 1. Linda: This room is really beautiful!
-Use bold labels for the objects providing opinions and comments.

User messages will provide you with context, and you should process your tasks based on this information.
Directly output the result without adding any other content.`

    case "Recommended Words":
      return `Recommand some search terms based on the provided text.
You should return some search terms related to the origin content, but do not likely to it.

---

Good example:
Input: keyboard
Output:
wireless mouse
gaming chair
High-fidelity headphones

Input: 粉底液
Output:
卸妆油
遮瑕笔
脸部SPA
防晒隔离
韩式眼妆推荐

Bad example:
Input: keyboard
Output:
wireless keyboard
gaming keyborad
how to clean keyboard

Input: 露营应该带什么装备
Output:
露营装备
怎么露营
露营小技巧

---

Do not add any other contents, return the result in ${language}.

Input content:${content}

The output JSON schema:
interface Result {
  scratch_pad: string;  // Analyze the user's search intent and return your plan to introduce what content you plan to recommend to the user
  items: string[];  // search terms you recommand
}`+


        "Output your result in JSON format with the Result schema, do not wrapped in code block '```json` and '```'."

    case "Content Summary":
      return `extract the main idea, and then optimize and rewrite them in your own words, keep the all ideas in origin text but not repeat the origin, do not lost any features. keep the content in detail, do not reduce or summary the content.
skip the content which unnecessary and drop out the format.
return in plain text, use the same language as the origin text. return the result directly, do not add any other contents.
`

    case 'SubtitleExtractionArticle':
      return `#Role: Regular article content merging expert

Output format: Markdown      

## Task
Merge multiple article sections into a unified, coherent article.

## Guidelines
1. Create a comprehensive narrative flow
2. Eliminate redundant information
3. Maintain consistent tone and style
4. Preserve important quotes
5. Ensure logical progression of ideas

Output format
## Title
[Generate the most suitable title based on the content]

## Introduction
[Merged introduction establishing the main theme]

## [Appropriate Section Headers]
[Merged content with preserved quotes]

## Conclusion
[Synthesized conclusion]
`
    case 'SubtitleExtractionListicle':
      return `#Role: List article content merging expert

Output format: Markdown 

##Task
Merge multiple list article paragraphs into a coherent and complete article.

##Guide
1. Maintain consistency in numbering of all parts
2. Remove duplicate key points
3. Ensure smooth transitions between merged parts
4. Keep the most relevant examples
5. Maintain overall structure and tone

##Required output structure
#[Select the most suitable title from the input]

##Introduction
[merged introduction, maintaining key background]

##Main viewpoint
[Key points of integrated numbering]

##Conclusion
[Comprehensive conclusion]`

    case 'SubtitleExtractionBriefing':
      return `#Role: Expert in merging briefing content

Output format: Markdown 

##Task
Integrate multiple brief paragraphs into a concise and comprehensive summary.

##Guide
1. Merge key points to avoid duplication
2. Keep it concise and clear
3. Ensure logical organization
4. Retain the most influential insights
5. Create a clear structure

##Required output structure
#[Select the most suitable title from the input]

##Key points
[Key points after merging and deduplication]

##Background
[Integrated background information]`

    case 'SubtitleExtractionSummary':
      return `#Role: Summarize article content and merge experts

Output format: Markdown 

##Task
Merge multiple summary paragraphs into a comprehensive overview.

##Guide
1. Comprehensive overlapping themes
2. Maintain clear thematic organization
3. Ensure comprehensive coverage
4. Keep the most relevant examples
5. Create a smooth transition

##Required output structure
#[Select the most suitable title from the input]

##Overview
[Overview of merged themes]

##Main topics
[Integrated topic]`

    case 'SubtitleExtractionTutorial':
      return `#Role: Tutorial Content Merge Expert

Output format: Markdown 

##Task
Merge multiple tutorial paragraphs into a complete step-by-step guide.

##Guide
1. Maintain logical progression of steps
2. Preconditions for Effective Merger
3. Ensure format consistency
4. Merge similar steps appropriately
5.Use subtitle to describe the problems, you should split the context to multi problems, and solve these problems

##Required output structure
#[Select the most suitable title from the input]

##Preconditions
[List of prerequisites for merging]

##Questions
[Write the problem directly, do not add other leadings such as 'Problem 1:']

##Steps
[after the problem, write the solve steps in ordered list]`

    case 'SubtitleExtractionNewsletter':
      return `#Role: News Release Content Merge Expert

Output format: Markdown 

##Task
Merge multiple news release paragraphs into a coherent news article.

##Guide
1. Maintain the style of news writing
2. Effectively merge references
3. Maintain chronological order
4. Ensure consistency in tone
5. Retain the most newsworthy elements

##Required output structure
#[Select the most suitable title from the input]

##Publication information
[Latest Press Release Information]

##Introduction
[The most powerful introduction]

##Main text
[Merge content, retain references]`

    case 'SubtitleExtractionNewsPodcastScript':
      return `#Role: Podcast script content merging expert
  
Output format: Markdown 

##Task
Merge multiple podcast segments into a complete program script.

##Guide
1. Ensure smooth transitions between paragraphs
2. Maintain the tone of the conversation
3. Keep the most attractive content
4. Maintain a consistent rhythm

##Required output structure
#[Select the most suitable title from the input]

##Opening remarks
[Opening remarks for merging]

##Paragraph
Output format: Markdown [Integrated paragraph]`
  }
}
import type { Language } from "@/lib/language"

/**
 * 
 * @param template 模板名称
 * @type SubtitleExtractionArticle 文章
 * @type SubtitleExtractionListicle 列表文章
 * @type SubtitleExtractionBriefing 简报
 * @type SubtitleExtractionSummary 总结
 * @type SubtitleExtractionTutorial 教程
 * @type SubtitleExtractionNewsletter 新闻稿
 * @type SubtitleExtractionNewsPodcastScript 资讯播客脚本
 */
export const getSubtitleExtractionPrompt = (params: { template: string, title: string, mainText: string, introduction: string }) => {
  const { template, title, mainText, introduction } = params;
  switch (template) {
    case 'SubtitleExtractionArticle':
      return `Generate a structurally complete article based on the input content.

##Guide
1. Write an eye-catching title
2. Carefully write a captivating introduction
3. Organize the content into logically clear chapters
4. Use smooth transitions between paragraphs
5. End with a strong conclusion
6. Maintain news writing standards

##Required Structure
#Title
${title}

##Introduction
${introduction}

##Main text
${mainText}
-Proper use of direct references
-Provide analysis and background

##Conclusion
[Powerful concluding remarks]`

    case 'SubtitleExtractionListicle':
      return `Convert the input content into an attractive list style article.
##Guide
1. Create eye-catching titles
2. Write an attractive introduction (2-3 sentences)
3. Organize the content into clear numbering points
4. Each key point should:
-There is a clear title
-Include relevant details from the source
5. Add a brief conclusion
6. Maintain consistency in tone throughout the entire text

##Required Structure
#Title
${title}

##Introduction
${introduction}

##Main viewpoint
1. ${mainText}
-Supporting details

[Continue with more key points...]

##Conclusion
[Short Summary]`

    case 'SubtitleExtractionBriefing':
      return `Generate a concise summary based on the input content.
##Guide
1. Write a clear title
2. Focus only on key points
3. Use short paragraphs
4. Maintain clarity
5. Avoid unnecessary details
6. End with key points

##Required Structure
#Title
${title}

##Summary
${introduction}

##Main harvest
${mainText}`

    case 'SubtitleExtractionSummary':
      return `Generate a comprehensive summary based on the input content.

##Guide
1. Write informative titles
2. Provide complete background information
3. Include all major viewpoints
4. Analyze the correlation
5. Add relevant examples
6. End with insights

##Required Structure
#Title
${title}

##Overview
${introduction}

##Key points
1. ${mainText}
-Supporting details

[Continue with more key points...]

##Analysis
[Contact and Insights]

##Conclusion
[Final Reflection]`

    case 'SubtitleExtractionTutorial':
      return `Convert the input content into a step-by-step tutorial.

##Guide
1. Write a clear title
2. List the prerequisites
3. Clear numbering steps
4. Add useful comments
5. Highlight Warning
6. Provide troubleshooting services

##Required Structure
#Title
${title}

##Preconditions
-Required items/knowledge
${introduction}

##Steps
1. [First Step]
-Detailed information
-Tips/Precautions

${mainText}

##Troubleshooting
[Common Problems and Solutions]`

    case 'SubtitleExtractionNewsletter':
      return `Generate professional press releases based on input content.

##Guide
1. Write a striking title
2. Include publication date and location
3. Start with a strong introduction
4. Include relevant references
5. Provide background information
6. Use a formal tone
7. End with contact information

##Required Structure
#Title
${title}

##Publication information
[City, Date] -

##Introduction
${introduction}

##Main text
${mainText}`

    case 'SubtitleExtractionNewsPodcastScript':
      return `Generate engaging podcast scripts based on input content.

##Guide
1. Write an attractive opening statement
2. Include paragraph separation
3. Add transition statements
4. Maintain a conversational tone
5. Include discussion points
6. Mark key parts


##Required Structure
#Program Title
${title}

##Opening remarks
${introduction}

##Paragraph
1. [First paragraph]
• Key points
• Discussion notes

${mainText}`
    default:
      return ''
  }
}

export const templateList = (t): Array<{ value: string, label: string }> => {
  return [
    { value: 'SubtitleExtractionArticle', label: t('templateList.Article') },
    { value: 'SubtitleExtractionListicle', label: t('templateList.Listicle') },
    { value: 'SubtitleExtractionBriefing', label: t('templateList.Briefing') },
    { value: 'SubtitleExtractionSummary', label: t('templateList.Summary') },
    { value: 'SubtitleExtractionTutorial', label: t('templateList.Tutorial') },
    { value: 'SubtitleExtractionNewsletter', label: t('templateList.Newsletter') },
    { value: 'SubtitleExtractionNewsPodcastScript', label: t('templateList.News_podcast_script') },
  ]
}
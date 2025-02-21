export const useConstant = (t) => {
    const templateList: Array<{ value: string, label: string }> = [
        { label: t('templateList.Listicle'), value: 'Listicle' },
        { label: t('templateList.XThreads'), value: 'X Threads' },
        { label: t('templateList.Briefing'), value: 'Briefing' },
        { label: t('templateList.Summary'), value: 'Summary' },
        { label: t('templateList.Tutorial'), value: 'Tutorial' },
        { label: t('templateList.Newsletter'), value: 'Newsletter' },
        { label: t('templateList.Article'), value: 'Article' },
        { label: t('templateList.News_podcast_script'), value: 'News podcast script' },
        { label: t('templateList.They_said'), value: 'They said' },
    ]

    const searchTypeList = [
        { value: 'Tavily', label: t('Tavily') },
        { value: 'Bocha', label: t('Bocha') },
        { value: 'Google', label: t('Google') },
        { value: 'Bing', label: t('Bing') },
    ]

    return { templateList, searchTypeList }
}
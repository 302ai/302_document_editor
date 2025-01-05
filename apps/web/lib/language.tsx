
export interface Language { chinese: string; english: string, japanese?: string };
export const LANG = { "en-US": 'en', "zh-CN": 'zh', "ja-JP": 'ja' }
export const LANG_SHORT = { "en": 'english', "zh": 'chinese', "ja": 'japanese' }

export const languageMenuList: Array<{ value: string, label: string, language?: string }> = [
    { label: '中文', value: 'Chinese', language: 'cmn' },
    { label: 'English', value: 'English', language: 'eng' },
    { label: '日本語', value: 'Japanese', language: 'jpn' },
    { label: 'Deutsch', value: 'German', language: 'deu' },
    { label: 'Français', value: 'French', language: 'fra' },
    { label: '한국어', value: 'Korean', language: 'kor' },
]

export const QUICK_INSERT_MENU = (t) => {
    return {
        'AI': { name: t('AI'), shortcutKeys: '/a', },
        'Generate illustrations': { name: t('Generate_illustrations'), shortcutKeys: '/il' },
        'FlowChart': { name: t('FlowChart'), shortcutKeys: '/f' },
        'Text': { name: t('Text'), shortcutKeys: '/c', },
        'Heading 1': { name: t('Heading_1'), shortcutKeys: '/t', },
        'Heading 2': { name: t('Heading_2'), shortcutKeys: '/tt', },
        'Heading 3': { name: t('Heading_3'), shortcutKeys: '/ttt', },
        'Numbered List': { name: t('Numbered_List'), shortcutKeys: '/o', },
        'Bullet List': { name: t('Bullet_List'), shortcutKeys: '/b', },
        'Image': { name: t('Image'), shortcutKeys: '/i', },
        'Link': { name: t('Link'), shortcutKeys: '/l', },
        'Quote': { name: t('Quote'), shortcutKeys: '/r', },
        'Code': { name: t('Code_block'), shortcutKeys: '/e', },
        'Divider': { name: t('Divider'), shortcutKeys: '/d', },
        'Table': { name: t('table'), shortcutKeys: '/ta', },
    }
}
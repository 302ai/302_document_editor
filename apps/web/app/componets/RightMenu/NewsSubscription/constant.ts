// 新媒体
const NewMedia = (t) => [
  {
    value: '36kr/hot-list/:category',
    label: t('36kr_hot_list'), // Use t() for internationalization
    classify: 'NewMedia',
    form: [
      {
        key: 'category',
        must: false,
        paramsType: 'select',
        placeholder: t('select_category'), // Use t() for internationalization
        label: t('category'), // Use t() for internationalization
        list: [
          { value: '24', label: t('24_hour_hot_list') }, // Use t() for internationalization
          { value: 'renqi', label: t('news_popularity_list') }, // Use t() for internationalization
          { value: 'zonghe', label: t('news_comprehensive_list') }, // Use t() for internationalization
          { value: 'shoucang', label: t('news_collection_list') }, // Use t() for internationalization
        ]
      }
    ]
  },
  {
    value: 'europechinese/latest',
    label: t('pengpai_news'), // Use t() for internationalization
    classify: 'NewMedia',
  },
  {
    value: 'wikinews/latest',
    label: t('wikinews'), // Use t() for internationalization
    classify: 'NewMedia',
  },
];

// 游戏
const Game = (t) => [
  {
    value: 'xiaoheihe/discount/:platform',
    label: t('xiaoheihe_game_discount'), // Use t() for internationalization
    classify: 'Game',
    form: [
      {
        key: 'platform',
        must: true,
        paramsType: 'select',
        placeholder: t('select_platform'), // Use t() for internationalization
        label: t('platform'), // Use t() for internationalization
        list: [
          { value: 'pc', label: t('pc') }, // Use t() for internationalization
          { value: 'switch', label: t('switch') }, // Use t() for internationalization
          { value: 'psn', label: t('psn') }, // Use t() for internationalization
          { value: 'xbox', label: t('xbox') }, // Use t() for internationalization
        ]
      }
    ]
  },
  {
    value: 'xiaoheihe/news',
    label: t('xiaoheihe_game_news'), // Use t() for internationalization
    classify: 'Game',
  },
];

// 天气 
const Weather = (t) => [
  {
    value: 'nmc/weatheralarm',
    label: t('central_meteorological_station_weather_warning'), // Use t() for internationalization
    classify: 'Weather',
  },
];

// 博客
const Programming = (t) => [
  {
    value: 'huggingface/daily-papers',
    label: t('huggingface_daily_papers'), // Use t() for internationalization
    classify: 'programming',
  },
  {
    value: 'huggingface/blog-zh',
    label: t('huggingface_chinese_blog'), // Use t() for internationalization
    classify: 'programming',
  },
  {
    value: 'codeforces/contests',
    label: t('codeforces_home'), // Use t() for internationalization
    classify: 'programming',
  },
  {
    value: 'google/developers/:locale',
    label: t('google_developer_blog'), // Use t() for internationalization
    classify: 'programming',
    form: [
      {
        key: 'locale',
        must: true,
        label: t('language'), // Use t() for internationalization
        paramsType: 'select',
        placeholder: t('input_language'), // Use t() for internationalization
        list: [
          { value: 'en', label: t('english') }, // Use t() for internationalization
          { value: 'es', label: t('spanish_latam') }, // Use t() for internationalization
          { value: 'id', label: t('bahasa_indonesia') }, // Use t() for internationalization
          { value: 'ja', label: t('japanese') }, // Use t() for internationalization
          { value: 'ko', label: t('korean') }, // Use t() for internationalization
          { value: 'pt-br', label: t('portuguese_brazil') }, // Use t() for internationalization
          { value: 'zh-hans', label: t('simplified_chinese') }, // Use t() for internationalization
        ]
      }
    ]
  },
];

// 传统媒体
const TraditionalMedia = (t) => [
  {
    value: 'stdaily/digitalpaper',
    label: t('china_technology_daily_home'), // Use t() for internationalization
    classify: 'TraditionalMedia',
  },
  {
    value: 'bbc',
    label: t('bbc_home'), // Use t() for internationalization
    classify: 'TraditionalMedia',
  },
  {
    value: 'huanqiu/news/:category',
    label: t('huanqiu_news_information'), // Use t() for internationalization
    classify: 'TraditionalMedia',
    form: [
      {
        key: 'category',
        must: true,
        paramsType: 'select',
        label: t('news_information'), // Use t() for internationalization
        placeholder: t('select_news_information'), // Use t() for internationalization
        list: [
          { value: 'china', label: t('domestic_news') }, // Use t() for internationalization
          { value: 'world', label: t('international_news') }, // Use t() for internationalization
          { value: 'mil', label: t('military') }, // Use t() for internationalization
          { value: 'opinion', label: t('comment') }, // Use t() for internationalization
        ]
      }
    ]
  },
];

// 社交媒体
const SocialMedia = (t) => [
  {
    value: 'jianshu/home',
    label: t('jianshu_home'), // Use t() for internationalization
    classify: 'SocialMedia',
  },
  {
    value: 'douban/book/rank',
    label: t('douban_hot_book_rank'), // Use t() for internationalization
    classify: 'SocialMedia',
  },
];

export const useClassifyDataList = (t) => {
  const classifyDataList: Array<{
    value: string,
    label: string,
    classify: string,
    form?: Array<{
      key: string,
      must: boolean,
      label: string,
      paramsType: 'input' | 'select',
      placeholder: string,
      list?: Array<{ value: string, label: string }>
    }>
  }> = [
      ...NewMedia(t),
      ...Game(t),
      ...Weather(t),
      ...Programming(t),
      ...TraditionalMedia(t),
      ...SocialMedia(t),
      {
        value: 'Custom',
        label: t('custom'), // Use t() for internationalization
        classify: 'Custom',
      }
    ];

  const classifyList: Array<{ value: string; label: string }> = [
    { value: 'All', label: t('all') }, // Use t() for internationalization
    { value: 'New Media', label: t('new_media') }, // Use t() for internationalization
    { value: 'Social media', label: t('social_media') }, // Use t() for internationalization
    { value: 'programming', label: t('programming') }, // Use t() for internationalization
    { value: 'Traditional media', label: t('traditional_media') }, // Use t() for internationalization
    { value: 'Blog', label: t('blog') }, // Use t() for internationalization
    { value: 'Scientific journals', label: t('scientific_journals') }, // Use t() for internationalization
    { value: 'Custom', label: t('custom') } // Use t() for internationalization
  ];

  return { classifyDataList, classifyList }
}

export function replacePlaceholders(template: string, params: Record<string, string>): string {
  return template.replace(/:(\w+)/g, (_, key) => params[key] || `:${key}`);
}
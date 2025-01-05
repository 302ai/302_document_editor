import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { RootState } from './index'
import type { JSONContent } from 'novel'

interface GlobalStateProps {
  language: 'chinese' | 'english' | 'japanese'
  wideLayout: number, // Layout mode 1. Wide layout 0. Normal
  novelContent: null | JSONContent, // The content of the current editing box
  saveStatus: boolean; // Input status
  searchText: string; // Search Text
  findAndReplaceVisible: boolean; // Open the search window
  renew: boolean; // Update document
  dualScreen: boolean; // Open dual screen
  translateDualScreen: boolean; // Open the translation dual screen
  translateDualLanguage: ''; // Choose the language for translation
  rewriteDualScreen: boolean; // Open Full Text Rewrite Dual Screen
  markdown: string;// Markdown data
  novelTitle: string; // File Title
  novelSummary: string; // Full text summary
  novelTable: string; // Full text summary table
  resetSummary: boolean; // Reset Full Text Summary
  freeRewritingText: string; // Global free rewriting of content
  freeRewritingStatus: boolean; // Global free rewriting
  editorStatus: boolean; // New file
  titleRecord: {
    oldTitle: string,
    status: boolean,
  }
  replaceStatus: boolean;
  chatSelectText: string; // Editor content selected in the chat room
  illustrationStatus: boolean; // Open Generate Illustration
  settings: { hideBrand: boolean }, // Configure hidden brand information
  selectRightMenu: '' | 'AiChat' | 'IntelligentMapping' | 'FullTextSummary' | 'InformationSearch' | 'FlowChart'; // Select the menu bar on the right
  informationCreationStatus: boolean, // Enter the state of information creation
  informationGenerationStatus: boolean, // Information creation generation status
  informationUrl: string[]; // URL selection for information creation
  informationTemplate: string; // Template for Information Creation Selection
  informationLang: string; // Language selection for information creation
  longArticleGenerationStatus: boolean; // Long article generation
  intelligentInsert: number, // Position of illustration insertion
}

export const globalStateSlice = createSlice({
  name: 'global',
  initialState: {
    settings: { hideBrand: true },
    language: 'chinese',
    wideLayout: 0,
    novelContent: null,
    saveStatus: false,
    searchText: '',
    findAndReplaceVisible: false,
    renew: true,
    translateDualScreen: false,
    rewriteDualScreen: false,
    markdown: '',
    novelTitle: '',
    novelSummary: '',
    novelTable: '',
    translateDualLanguage: '',
    replaceStatus: true,
    freeRewritingText: '',
    freeRewritingStatus: false,
    editorStatus: true,
    titleRecord: {
      oldTitle: '',
      status: false,
    },
    chatSelectText: '',
    illustrationStatus: false,
    selectRightMenu: '',
    resetSummary: true,
    informationCreationStatus: false,
    informationUrl: [],
    informationTemplate: '',
    informationLang: '',
    longArticleGenerationStatus: false,
    informationGenerationStatus: false,
    intelligentInsert: 0
  } as GlobalStateProps,
  reducers: {
    setGlobalState: (
      state: GlobalStateProps,
      action: PayloadAction<{
        [key in keyof GlobalStateProps]?: GlobalStateProps[key]
      }>
    ) => {
      for (const [key, value] of Object.entries(action.payload)) {
        if (value !== undefined) {
          state[key] = value;
        }
      }
    }
  }
})

export const { setGlobalState } = globalStateSlice.actions
export const selectGlobal = (state: RootState) => state.global
export default globalStateSlice.reducer


export interface Headline {
  text: string;
  isPinned: boolean;
}

export interface Description {
  text: string;
}

export interface AdGroup {
  id: string;
  name: string;
  keywords: string[];
  headlines: Headline[];
  descriptions: Description[];
}

export interface Settings {
  numAdGroups: number;
  minKeywordsPerGroup: number;
  maxKeywordsPerGroup: number;
}

export type AppStep = 'input' | 'loading' | 'results' | 'error';

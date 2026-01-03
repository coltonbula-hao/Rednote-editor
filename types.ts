
export interface ContentState {
  blogPost: string;
  xhsTitles: string;
  xhsContent: string;
  infographicPrompts: string;
  rawResponse: string;
  generatedImages: string[]; // Base64 strings of generated images
}

export enum XhsStyle {
  STORYTELLING = 'STORYTELLING',
  LISTICLE = 'LISTICLE',
  REVIEW = 'REVIEW'
}

export interface HistoryItem {
  id: string;
  timestamp: number;
  input: {
    text: string;
    fileName: string | null;
  };
  content: Omit<ContentState, 'generatedImages'>; // Exclude images to save storage space
}

export interface UserPreferences {
  defaultTab: Tab;
  autoExtractYoutube: boolean;
  saveHistory: boolean;
  selectedXhsStyle: XhsStyle;
}

export enum FileType {
  PDF = 'application/pdf',
  TXT = 'text/plain',
  NONE = ''
}

export interface UploadedFile {
  name: string;
  type: string;
  data: string; // Base64
}

export enum Tab {
  BLOG = 'BLOG',
  XHS = 'XHS',
  INFO = 'INFO',
  RAW = 'RAW'
}

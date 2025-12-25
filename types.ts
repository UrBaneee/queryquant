
export interface DailyStat {
  date: string; // ISO Date string YYYY-MM-DD
  internalCount: number; // Questions asked within this app
  externalCount: number; // Manual logs (ChatGPT, etc)
}

export interface Attachment {
  type: 'image';
  mimeType: string;
  data: string; // Base64 string
  name: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
  attachments?: Attachment[];
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
}

export interface AggregatedStat {
  date: string;
  total: number;
  internal: number;
  external: number;
  dayName: string;
}

export enum ViewState {
  DASHBOARD = 'DASHBOARD',
  CHAT = 'CHAT',
  HISTORY = 'HISTORY'
}

export type ModelProvider = 'gemini' | 'openai' | 'anthropic' | 'deepseek' | 'custom';

export interface AppSettings {
  // API Keys
  geminiKey: string; // User provided Gemini Key
  openaiKey: string;
  anthropicKey: string;
  deepseekKey: string;
  
  selectedProvider: ModelProvider;
  
  // Custom Model Configurations
  openaiModel: string;
  anthropicModel: string;
  deepseekModel: string;

  // Custom / Universal Provider (Grok, Ollama, etc.)
  customBaseUrl: string;
  customKey: string;
  customModelId: string;
}

import { MarketplaceId, MarketplaceRule } from '../../types';

export interface AITelemetryEntry {
  id: string;
  provider: string;
  model: string;
  responseTimeMs: number;
  success: boolean;
  timestamp: string;
  errorReason?: string;
  cacheHit?: boolean;
}

export interface SharedMetadataContext {
  assetType: 'Icon' | 'Vector' | 'Illustration' | 'Photo' | '3D Render' | 'Pattern' | 'Mockup' | 'Background' | 'Sheet/Collection' | 'Unknown';
  primarySubject: string;
  secondarySubjects: string[];
  visualStyle: string;
  industry: string;
  commercialCategory: string;
  purpose: string;
  targetAudience: string[];
  marketplaceIntent: string;
  colorPalette: string[];
  composition: string;
  dominantObjects: string[];
  visualComplexity: 'Minimal' | 'Moderate' | 'Complex';
  backgroundType: 'Isolated' | 'Transparent' | 'Scenic' | 'Studio' | 'Abstract' | 'Unknown';
  fileFormat: string; // e.g., 'PNG', 'EPS', 'JPG'
  isTransparent: boolean;
  isCollection: boolean;
  seasonHoliday?: string;
  moodEmotion?: string;
  businessUseCase?: string;
  lightingType?: string;
  commercialIntentScore?: number;
}

export interface VisionAnalysisResult {
  primarySubject: string;
  styleAndMedium: string;
  lightingAndMood?: string;
  dominantColors?: string[];
  commercialUseCases?: string[];
  targetBuyers?: string[];
  isTransparent?: boolean;
  titleCandidatesEvaluated?: number;
  sharedContext?: SharedMetadataContext;
}

export interface GenerateMetadataOptions {
  fileId?: string;
  fileName: string;
  fileType?: string;
  base64Data?: string;
  previewUrl?: string;
  mimeType?: string;
  settings?: any;
  customApiKey?: string;
  provider?: string;
  selectedModel?: string;
  marketplaceRule: MarketplaceRule;
  benchmarkMode?: boolean; // New benchmark mode
}

export interface GeneratePromptOptions {
  topic?: string;
  style?: string;
  mood?: string;
  customApiKey?: string;
}

export interface KeywordQualityScore {
  keyword: string;
  commercialValue: number;
  searchIntent: number;
  semanticAccuracy: number;
  marketplaceCompatibility: number;
  contextMatch: number;
  duplicateRisk: number;
  totalScore: number;
}

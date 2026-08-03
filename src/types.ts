/**
 * StockAI - Clean Architecture Types
 */

export type FileType = 'image' | 'video' | 'svg' | 'eps';

export interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  fileType: FileType;
  previewUrl: string;
  base64Data?: string;
  status: 'pending' | 'analyzing' | 'generating' | 'completed' | 'error';
  progressMessage?: string;
  metadata?: MetadataResult;
  error?: string;
  trace?: any[];
}

export type MarketplaceId = 'general' | 'adobe-stock' | 'shutterstock' | 'freepik' | 'vecteezy' | 'pond5' | 'getty' | 'dreamstime';

export interface MarketplaceRule {
  id: MarketplaceId;
  name: string;
  shortName: string;
  iconName: string;
  titleMinLength: number;
  titleMaxLength: number;
  keywordMinCount: number;
  keywordMaxCount: number;
  descriptionRequired: boolean;
  categoriesRequired: boolean;
  categories: string[];
  csvColumns: string[];
  specialNotes?: string;
}

export interface KeywordBucket {
  tag: string;
  category: 'subject' | 'action' | 'attribute' | 'style' | 'color' | 'industry' | 'commercial' | 'technical';
  weight: number; // 1-100
}

export interface SEOBreakdown {
  seoScore: number;
  commercialScore: number;
  complianceScore: number;
  confidenceScore: number;
  explanations: {
    seo: string[];
    commercial: string[];
    compliance: string[];
    suggestions: string[];
  };
}

export interface CommercialOpportunity {
  opportunityScore: number;
  competitionLevel: 'Low' | 'Medium' | 'High';
  estimatedDemand: 'High' | 'Very High' | 'Moderate';
  evergreenPotential: boolean;
  seasonality: string;
  recommendedMarketplace: string;
  suggestedCommercialUses: string[];
}

export interface CategoryPrediction {
  primaryCategory: string;
  secondaryCategory: string;
  commercialSector: string;
  confidenceScore: number;
}

export interface ExplainableAI {
  primarySubject: string;
  detectedObjects: string[];
  commercialIntent: string;
  targetBuyers: string[];
  searchIntent: string;
  marketplaceReasoning: string;
  confidence: number;
}

export interface MetadataResult {
  id: string;
  fileId: string;
  title: string;
  description: string;
  keywords: string[];
  keywordBuckets: KeywordBucket[];
  primaryCategory: string;
  secondaryCategory: string;
  editorial: boolean;
  modelReleaseRequired: boolean;
  propertyReleaseRequired: boolean;
  scores: SEOBreakdown;
  generatedAt: string;
  marketplaceTarget: MarketplaceId;
  provider?: string;
  model?: string;
  latency?: number;
  aiStatus?: string;
  visionAnalysis?: {
    primarySubject: string;
    styleAndMedium: string;
    lightingAndMood: string;
    dominantColors: string[];
    commercialUseCases: string[];
    targetBuyers: string[];
  };
  commercialOpportunity?: CommercialOpportunity;
  categoryPrediction?: CategoryPrediction;
  explainableAI?: ExplainableAI;
}

export interface MetadataSettings {
  targetPlatform: MarketplaceId;
  titleLength: number; // default 70
  descriptionLength: number; // default 150 fixed
  keywordsCount: number; // default 30
  prefix: string;
  enablePrefix: boolean;
  suffix: string;
  enableSuffix: boolean;
  negativeTitleWords: string;
  enableNegativeTitleWords: boolean;
  negativeKeywords: string;
  enableNegativeKeywords: boolean;
  autoTransparentPngTag: boolean;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  currency: string;
  durationDays: number;
  description: string;
  features: string[];
}

export type LicenseStatus = 'pending' | 'active' | 'expired' | 'suspended' | 'cancelled' | 'disabled';

export interface LicenseRecord {
  id: string;
  userId: string;
  userEmail: string;
  planId: string;
  planName: string;
  activationDate: string;
  expirationDate: string;
  status: LicenseStatus;
  allowedDevices: number;
  deviceFingerprint: string;
  createdBy: string;
  lastUpdated: string;
}

export type PaymentStatus = 'pending' | 'confirmed' | 'rejected' | 'refunded' | 'cancelled';

export interface PaymentRecord {
  id: string;
  userId: string;
  userEmail: string;
  planId: string;
  amount: number;
  currency: string;
  paymentChannel: 'whatsapp_manual' | 'stripe' | 'bank_transfer';
  status: PaymentStatus;
  referenceCode: string;
  createdAt: string;
  confirmedAt?: string;
}

export interface PlanHistoryEntry {
  id: string;
  userId: string;
  userEmail: string;
  action: 'purchased' | 'activated' | 'renewed' | 'expired' | 'extended' | 'upgraded' | 'downgraded' | 'cancelled' | 'paused' | 'resumed';
  planName: string;
  durationDays: number;
  amount: number;
  performedBy: string;
  timestamp: string;
  paymentRef?: string;
}

export interface ConfigurablePlan {
  id: string;
  name: string;
  price: number;
  currency: string;
  durationDays: number;
  features: string[];
  visibility: 'public' | 'hidden' | 'custom';
  status: 'active' | 'archived';
  isDefault?: boolean;
  sortOrder: number;
}

export interface UserSubscription {
  planId: string;
  planName: string;
  price: number;
  durationDays: number;
  activatedAt: string;
  expiresAt: string;
  isActive: boolean;
  isExpired: boolean;
  deviceId: string;
}

export interface UserCredits {
  planName: string;
  creditsRemaining: number;
  creditsMax: number;
  isPaid: boolean;
}

export interface AIProviderConfig {
  id: string;
  name: string;
  currentModel: string;
  availableModels: string[];
  hasApiKey: boolean;
  status: 'active' | 'configured' | 'no_key';
}

export interface PromptGenResult {
  id: string;
  sourceType: 'image' | 'text';
  promptMidjourney: string;
  promptDalle: string;
  promptFlux: string;
  styleKeywords: string[];
  commercialConcepts: string[];
}

export interface AdminUserRecord {
  id: string;
  fullName: string;
  email: string;
  role: 'guest' | 'contributor' | 'admin';
  status: string;
  planName: string;
  planStatus: 'active' | 'expired' | 'pending_activation' | 'suspended' | 'blocked';
  expiresAt: string;
  activatedAt: string;
  activeDeviceId: string;
  lastActive: string;
  lastLoginAt?: string;
  createdAt: string;
  totalGenerations: number;
  totalPrompts: number;
  totalCsvExports: number;
}

export type UserRole = 'guest' | 'contributor' | 'admin';
export type AccountStatus = 'pending_activation' | 'active' | 'expired' | 'suspended' | 'blocked' | 'disabled';

export interface AuthUser {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  status: AccountStatus;
  subscription: UserSubscription;
  activeDeviceId: string;
  createdAt: string;
  lastLoginAt: string;
}

export interface DeviceSession {
  id: string;
  deviceName: string;
  os: string;
  browser: string;
  fingerprint: string;
  ip: string;
  lastActive: string;
  isCurrent: boolean;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  adminEmail: string;
  action: string;
  targetUser: string;
  details: string;
}

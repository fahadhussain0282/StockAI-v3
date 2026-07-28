export interface BenchmarkAsset {
  id: string;
  assetType: string;
  marketplace: string;
  fileName: string;
  mockVisionData: {
    primarySubject: string;
    styleAndMedium: string;
    commercialUseCases: string[];
    targetBuyers: string[];
    dominantColors: string[];
    isTransparent?: boolean;
  };
  expectations: {
    minimumSeoScore: number;
    requiredKeywords: string[];
    forbiddenKeywords: string[];
    titleMustContain: string[];
    expectedCategory: string;
  };
}

export interface ValidationResult {
  assetId: string;
  passed: boolean;
  seoScore: number;
  commercialIntentScore: number;
  keywordQualityScore: number;
  titleQualityScore: number;
  marketplaceCompatibility: number;
  errors: string[];
  warnings: string[];
}

export interface PerformanceMetrics {
  mode: 'QUALITY' | 'LOAD';
  assetCount: number;
  totalTimeMs: number;
  averageTimePerAssetMs: number;
  peakMemoryMB: number;
  cacheHitRate: number;
}

export interface BenchmarkReport {
  timestamp: string;
  assetsTested: number;
  passedCount: number;
  failedCount: number;
  averageSeoScore: number;
  averageCommercialIntent: number;
  averageKeywordQuality: number;
  averageTitleQuality: number;
  adobeCompatibility: number;
  shutterstockCompatibility: number;
  freepikCompatibility: number;
  vecteezyCompatibility: number;
  pond5Compatibility: number;
  performance: PerformanceMetrics;
  determinismScore: number;
  regressionStatus: 'PASS' | 'FAIL';
  overallGrade: string;
  failures: { assetId: string; reasons: string[] }[];
}

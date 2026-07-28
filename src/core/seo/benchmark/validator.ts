import { BenchmarkAsset, ValidationResult } from './types';

export class ValidationEngine {
  public static validate(asset: BenchmarkAsset, output: any): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    let seoScore = output.scores?.seoScore || 0;
    let commercialIntentScore = output.scores?.commercialScore || 0;
    let keywordQualityScore = 90; // Default approximation for mock
    let titleQualityScore = 90;
    let marketplaceCompatibility = output.scores?.complianceScore || 0;

    // 1. Title Validation
    const title = output.title || '';
    if (title.length < 45) errors.push(`Title too short: ${title.length} chars.`);
    if (title.split(' ').length < 6) errors.push(`Title has too few words.`);
    asset.expectations.titleMustContain.forEach(term => {
      if (!title.toLowerCase().includes(term.toLowerCase())) {
        errors.push(`Title missing required term: "${term}"`);
      }
    });

    // 2. Keyword Validation
    const keywords = output.keywords || [];
    if (keywords.length === 0) errors.push(`No keywords generated.`);
    const uniqueKeywords = new Set(keywords);
    if (uniqueKeywords.size < keywords.length) errors.push(`Duplicate keywords detected.`);
    
    asset.expectations.requiredKeywords.forEach(term => {
      if (!keywords.includes(term.toLowerCase())) {
        errors.push(`Missing required keyword: "${term}"`);
      }
    });

    asset.expectations.forbiddenKeywords.forEach(term => {
      if (keywords.includes(term.toLowerCase())) {
        errors.push(`Contains forbidden keyword: "${term}"`);
      }
    });

    // 3. Category Validation
    if (output.primaryCategory !== asset.expectations.expectedCategory) {
      warnings.push(`Category mismatch: Expected ${asset.expectations.expectedCategory}, got ${output.primaryCategory}`);
    }

    // 4. SEO Threshold Validation
    if (output.scores?.confidenceScore < asset.expectations.minimumSeoScore) {
      errors.push(`SEO Score ${output.scores?.confidenceScore} below threshold ${asset.expectations.minimumSeoScore}`);
    }

    // 5. Transparent PNG Validation
    if (asset.assetType === 'Transparent') {
      const transparentCount = (title.match(/transparent/gi) || []).length;
      if (transparentCount > 1) {
        errors.push(`Transparent spam detected in title (count: ${transparentCount}).`);
      }
    }

    const passed = errors.length === 0;

    return {
      assetId: asset.id,
      passed,
      seoScore,
      commercialIntentScore,
      keywordQualityScore,
      titleQualityScore,
      marketplaceCompatibility,
      errors,
      warnings
    };
  }
}

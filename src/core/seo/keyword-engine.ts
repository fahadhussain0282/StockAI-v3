import { GENERIC_MICROSTOCK_TERMS } from './constants';
import { sanitizeGeneratedText } from './validators';
import { SharedMetadataContext, KeywordQualityScore } from './types';
import { MarketplaceRule, KeywordBucket } from '../../types';
import { KeywordPriority, assignKeywordPriority, COMMERCIAL_INTENT_TERMS } from './knowledge';

export class KeywordEngine {
  public static sanitizeKeywordsList(keywords: string[]): string[] {
    if (!Array.isArray(keywords)) return [];
    const cleaned: string[] = [];
    const seen = new Set<string>();

    for (const rawKw of keywords) {
      if (typeof rawKw !== 'string') continue;

      const kw = sanitizeGeneratedText(rawKw).toLowerCase().trim();

      if (!kw || kw.length < 2) continue;
      if (/^\d+$/.test(kw)) continue; // Pure digits
      if (/\b(img|dsc|dcim|vid|raw|file|temp|upload)\d+\b/i.test(kw)) continue;
      if (/\b\d{6,}\b/.test(kw)) continue; // Timestamp/random ID numbers
      if (/\.(jpg|jpeg|png|eps|svg|tiff)\b/i.test(kw)) continue;

      if (!seen.has(kw)) {
        seen.add(kw);
        cleaned.push(kw);
      }
    }

    return cleaned;
  }

  public static evaluateKeywordQuality(keyword: string, context: SharedMetadataContext, marketplaceRule: MarketplaceRule): KeywordQualityScore {
    const kwLower = keyword.toLowerCase();
    let commercialValue = 50;
    let searchIntent = 50;
    let semanticAccuracy = 50;
    let marketplaceCompatibility = 100;
    let contextMatch = 50;
    let duplicateRisk = 0;

    // Commercial Value & Search Intent
    if (COMMERCIAL_INTENT_TERMS.includes(kwLower)) {
      commercialValue += 30;
      searchIntent += 20;
    }
    if (context.primarySubject.toLowerCase().includes(kwLower) || context.secondarySubjects.some(s => s.toLowerCase().includes(kwLower))) {
      searchIntent += 40;
      semanticAccuracy += 40;
      contextMatch += 40;
    }
    if (context.industry.toLowerCase().includes(kwLower) || context.commercialCategory.toLowerCase().includes(kwLower)) {
      commercialValue += 20;
      contextMatch += 20;
    }
    if (GENERIC_MICROSTOCK_TERMS.includes(kwLower)) {
      commercialValue -= 10;
      duplicateRisk += 20;
    }

    // Marketplace Compatibility
    if (marketplaceRule.id === 'adobe-stock' && (kwLower === 'vector' || kwLower === 'illustration') && context.assetType === 'Photo') {
      marketplaceCompatibility -= 50; // Adobe Stock penalizes vector tags on photos
    }

    const totalScore = Math.round(
      (commercialValue * 0.25) +
      (searchIntent * 0.25) +
      (semanticAccuracy * 0.2) +
      (marketplaceCompatibility * 0.15) +
      (contextMatch * 0.15) -
      (duplicateRisk * 0.5)
    );

    return {
      keyword,
      commercialValue: Math.min(100, Math.max(0, commercialValue)),
      searchIntent: Math.min(100, Math.max(0, searchIntent)),
      semanticAccuracy: Math.min(100, Math.max(0, semanticAccuracy)),
      marketplaceCompatibility: Math.min(100, Math.max(0, marketplaceCompatibility)),
      contextMatch: Math.min(100, Math.max(0, contextMatch)),
      duplicateRisk: Math.min(100, Math.max(0, duplicateRisk)),
      totalScore: Math.min(100, Math.max(0, totalScore))
    };
  }

  public static generateKeywordBuckets(cleanedKeywords: string[], context: SharedMetadataContext): KeywordBucket[] {
    const buckets: KeywordBucket[] = [];
    
    for (let i = 0; i < cleanedKeywords.length; i++) {
      const kw = cleanedKeywords[i];
      const kwLower = kw.toLowerCase();
      let category = 'attribute';

      if (context.primarySubject.toLowerCase().includes(kwLower) || context.secondarySubjects.some(s => s.toLowerCase().includes(kwLower))) {
        category = 'subject';
      } else if (COMMERCIAL_INTENT_TERMS.includes(kwLower) || context.industry.toLowerCase().includes(kwLower) || context.commercialCategory.toLowerCase().includes(kwLower)) {
        category = 'commercial';
      } else if (context.visualStyle.toLowerCase().includes(kwLower)) {
        category = 'style';
      } else if (context.colorPalette.some(c => c.toLowerCase().includes(kwLower))) {
        category = 'color';
      } else if (context.composition.toLowerCase().includes(kwLower)) {
        category = 'composition';
      }

      buckets.push({
        tag: kw,
        category: category as any,
        weight: Math.max(10, 100 - i * 2)
      });
    }

    return buckets;
  }

  public static ensureExactKeywordCount(
    keywords: string[],
    targetCount: number,
    context: SharedMetadataContext,
    marketplaceRule: MarketplaceRule
  ): string[] {
    let cleaned = this.sanitizeKeywordsList(keywords);

    // Evaluate Quality & Filter Weak Keywords
    const evaluated = cleaned.map(kw => this.evaluateKeywordQuality(kw, context, marketplaceRule));
    cleaned = evaluated.filter(e => e.totalScore >= 50).map(e => e.keyword);

    // Fill pool if lacking
    const pool = [
      ...context.primarySubject.split(/\s+/),
      ...context.secondarySubjects.flatMap(s => s.split(/\s+/)),
      ...context.industry.split(/\s+/),
      ...context.commercialCategory.split(/\s+/),
      ...context.visualStyle.split(/\s+/),
      ...context.colorPalette,
      ...context.composition.split(/\s+/),
      ...context.targetAudience.flatMap(a => a.split(/\s+/)),
      ...COMMERCIAL_INTENT_TERMS
    ].map(k => k.toLowerCase().trim()).filter(k => k.length >= 3);

    const seen = new Set(cleaned.map(k => k.toLowerCase()));
    
    for (const term of pool) {
      if (cleaned.length >= targetCount) break;
      const sanitizedTerm = sanitizeGeneratedText(term).toLowerCase();
      if (sanitizedTerm && !seen.has(sanitizedTerm) && !/^\d+$/.test(sanitizedTerm)) {
        const quality = this.evaluateKeywordQuality(sanitizedTerm, context, marketplaceRule);
        if (quality.totalScore >= 50) {
          seen.add(sanitizedTerm);
          cleaned.push(sanitizedTerm);
        }
      }
    }

    // Force fill to exact count if STILL lacking
    if (cleaned.length < targetCount) {
      for (const term of COMMERCIAL_INTENT_TERMS) {
        if (cleaned.length >= targetCount) break;
        if (!seen.has(term)) {
          seen.add(term);
          cleaned.push(term);
        }
      }
    }
    
    // Final emergency fallback if still under targetCount (very rare)
    if (cleaned.length < targetCount) {
       const extraGenerics = ['stock', 'image', 'photo', 'vector', 'illustration', 'design', 'background', 'isolated', 'beautiful', 'creative', 'concept', 'art', 'graphic', 'modern', 'style', 'color', 'bright', 'clean', 'nature', 'business', 'people', 'abstract', 'texture', 'pattern', 'light', 'dark', 'white', 'black', 'red', 'blue', 'green', 'yellow', 'digital', 'media', 'web', 'internet', 'technology', 'success', 'happy', 'life', 'new', 'old', 'vintage', 'retro', 'future', 'space', 'earth', 'world', 'global', 'travel'];
       for (const term of extraGenerics) {
         if (cleaned.length >= targetCount) break;
         if (!seen.has(term)) {
           seen.add(term);
           cleaned.push(term);
         }
       }
    }

    // Bucket them to know their category for sorting
    const buckets = this.generateKeywordBuckets(cleaned, context);
    
    // 10-Tier Priority Sort
    buckets.sort((a, b) => {
      const priorityA = assignKeywordPriority(a.category);
      const priorityB = assignKeywordPriority(b.category);
      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }
      return b.weight - a.weight;
    });

    cleaned = buckets.map(b => b.tag);

    if (cleaned.length > targetCount) {
      cleaned = cleaned.slice(0, targetCount);
    }

    return cleaned;
  }
}

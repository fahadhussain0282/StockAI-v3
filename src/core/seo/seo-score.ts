import { SEOBreakdown, MarketplaceRule, KeywordBucket } from '../../types';
import { GENERIC_TITLE_PHRASES } from './constants';
import { SharedMetadataContext } from './types';
import { KeywordEngine } from './keyword-engine';

export class SEOScoreEngine {
  public static calculateSEOAndQualityScores(
    title: string,
    keywords: string[],
    keywordBuckets: KeywordBucket[],
    marketplaceRule: MarketplaceRule,
    context: SharedMetadataContext,
    options: any = {}
  ): SEOBreakdown {
    const seoExplanations: string[] = [];
    const commercialExplanations: string[] = [];
    const complianceExplanations: string[] = [];
    const suggestions: string[] = [];

    let isCriticalFailure = false;
    let seoScore = 100;
    
    const titleWords = title.toLowerCase().split(/\s+/).filter(Boolean);
    const titleLength = title.length;
    const isGenericTitle = GENERIC_TITLE_PHRASES.some(phrase => title.toLowerCase().trim() === phrase || title.toLowerCase().trim() === `a ${phrase}`);

    // Title Check (Deterministic)
    if (isGenericTitle || titleWords.length < 4 || titleLength < marketplaceRule.titleMinLength) {
      isCriticalFailure = true;
      seoScore -= 40;
      seoExplanations.push(`FAIL: Title length or generic state is critical. Must be 8-12 words.`);
    } else if (titleWords.length >= 8 && titleWords.length <= 14) {
      seoExplanations.push(`PASS: Title contains optimal word density (${titleWords.length} words).`);
    } else {
      seoScore -= 15;
      seoExplanations.push(`Title has ${titleWords.length} words. Optimal is 8-12.`);
    }

    if (titleLength > marketplaceRule.titleMaxLength) {
      isCriticalFailure = true;
      seoScore -= 35;
      seoExplanations.push(`FAIL: Title exceeds ${marketplaceRule.titleMaxLength} chars.`);
    }

    // Keyword Check (Deterministic)
    const keywordCount = keywords.length;
    if (keywordCount < marketplaceRule.keywordMinCount || keywordCount > marketplaceRule.keywordMaxCount) {
      isCriticalFailure = true;
      seoScore -= 40;
      seoExplanations.push(`FAIL: Keywords count (${keywordCount}) outside bounds.`);
    }

    const uniqueKeywords = new Set(keywords.map(k => k.toLowerCase().trim()));
    if (uniqueKeywords.size < keywords.length) {
      seoScore -= (keywords.length - uniqueKeywords.size) * 5;
    }

    // Commercial Quality Scoring
    let commercialScore = 100;
    
    // Evaluate average keyword quality
    const evaluatedKeywords = uniqueKeywords.size > 0 
      ? Array.from(uniqueKeywords).map(k => KeywordEngine.evaluateKeywordQuality(k, context, marketplaceRule))
      : [];
      
    const averageKeywordQuality = evaluatedKeywords.length > 0 
      ? evaluatedKeywords.reduce((sum, k) => sum + k.totalScore, 0) / evaluatedKeywords.length
      : 0;

    if (averageKeywordQuality < 70) {
      commercialScore -= 20;
      commercialExplanations.push(`Average keyword quality (${Math.round(averageKeywordQuality)}) is below optimal threshold.`);
    } else {
      commercialExplanations.push(`High average keyword quality (${Math.round(averageKeywordQuality)}/100).`);
    }

    // Structure matching
    if (title.toLowerCase().includes(context.primarySubject.toLowerCase())) {
      commercialScore += 5;
    } else {
      commercialScore -= 10;
      commercialExplanations.push('Title does not clearly contain the primary subject.');
    }

    // Asset specific penalty
    if (context.isTransparent && !title.toLowerCase().includes('transparent')) {
      commercialScore -= 15;
      commercialExplanations.push('Transparent asset missing "transparent" in title.');
    }

    let complianceScore = 100;
    if (isCriticalFailure) complianceScore -= 50;

    let finalSeoScore = Math.min(100, Math.max(0, seoScore));
    let finalCommercialScore = Math.min(100, Math.max(0, commercialScore));
    let finalComplianceScore = Math.min(100, Math.max(0, complianceScore));

    let confidenceScore = Math.round((finalSeoScore * 0.4) + (finalCommercialScore * 0.4) + (finalComplianceScore * 0.2));

    if (isCriticalFailure) {
      confidenceScore = Math.min(58, confidenceScore);
    }
    
    if (confidenceScore >= 88 && !isCriticalFailure) {
      suggestions.push('Metadata is production-ready and optimized for direct upload.');
    } else if (confidenceScore < 85) {
      suggestions.push('Metadata requires internal refinement to meet commercial thresholds.');
    }

    return {
      seoScore: finalSeoScore,
      commercialScore: finalCommercialScore,
      complianceScore: finalComplianceScore,
      confidenceScore,
      explanations: {
        seo: seoExplanations,
        commercial: commercialExplanations,
        compliance: complianceExplanations,
        suggestions
      }
    };
  }
}

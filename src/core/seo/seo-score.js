import { GENERIC_TITLE_PHRASES } from './constants';
import { KeywordEngine } from './keyword-engine';
var SEOScoreEngine = /** @class */ (function () {
    function SEOScoreEngine() {
    }
    SEOScoreEngine.calculateSEOAndQualityScores = function (title, keywords, keywordBuckets, marketplaceRule, context, options) {
        if (options === void 0) { options = {}; }
        var seoExplanations = [];
        var commercialExplanations = [];
        var complianceExplanations = [];
        var suggestions = [];
        var isCriticalFailure = false;
        var seoScore = 100;
        var titleWords = title.toLowerCase().split(/\s+/).filter(Boolean);
        var titleLength = title.length;
        var isGenericTitle = GENERIC_TITLE_PHRASES.some(function (phrase) { return title.toLowerCase().trim() === phrase || title.toLowerCase().trim() === "a ".concat(phrase); });
        // Title Check (Deterministic)
        if (isGenericTitle || titleWords.length < 4 || titleLength < marketplaceRule.titleMinLength) {
            isCriticalFailure = true;
            seoScore -= 40;
            seoExplanations.push("FAIL: Title length or generic state is critical. Must be 8-12 words.");
        }
        else if (titleWords.length >= 8 && titleWords.length <= 14) {
            seoExplanations.push("PASS: Title contains optimal word density (".concat(titleWords.length, " words)."));
        }
        else {
            seoScore -= 15;
            seoExplanations.push("Title has ".concat(titleWords.length, " words. Optimal is 8-12."));
        }
        if (titleLength > marketplaceRule.titleMaxLength) {
            isCriticalFailure = true;
            seoScore -= 35;
            seoExplanations.push("FAIL: Title exceeds ".concat(marketplaceRule.titleMaxLength, " chars."));
        }
        // Keyword Check (Deterministic)
        var keywordCount = keywords.length;
        if (keywordCount < marketplaceRule.keywordMinCount || keywordCount > marketplaceRule.keywordMaxCount) {
            isCriticalFailure = true;
            seoScore -= 40;
            seoExplanations.push("FAIL: Keywords count (".concat(keywordCount, ") outside bounds."));
        }
        var uniqueKeywords = new Set(keywords.map(function (k) { return k.toLowerCase().trim(); }));
        if (uniqueKeywords.size < keywords.length) {
            seoScore -= (keywords.length - uniqueKeywords.size) * 5;
        }
        // Commercial Quality Scoring
        var commercialScore = 100;
        // Evaluate average keyword quality
        var evaluatedKeywords = uniqueKeywords.size > 0
            ? Array.from(uniqueKeywords).map(function (k) { return KeywordEngine.evaluateKeywordQuality(k, context, marketplaceRule); })
            : [];
        var averageKeywordQuality = evaluatedKeywords.length > 0
            ? evaluatedKeywords.reduce(function (sum, k) { return sum + k.totalScore; }, 0) / evaluatedKeywords.length
            : 0;
        if (averageKeywordQuality < 70) {
            commercialScore -= 20;
            commercialExplanations.push("Average keyword quality (".concat(Math.round(averageKeywordQuality), ") is below optimal threshold."));
        }
        else {
            commercialExplanations.push("High average keyword quality (".concat(Math.round(averageKeywordQuality), "/100)."));
        }
        // Structure matching
        if (title.toLowerCase().includes(context.primarySubject.toLowerCase())) {
            commercialScore += 5;
        }
        else {
            commercialScore -= 10;
            commercialExplanations.push('Title does not clearly contain the primary subject.');
        }
        // Asset specific penalty
        if (context.isTransparent && !title.toLowerCase().includes('transparent')) {
            commercialScore -= 15;
            commercialExplanations.push('Transparent asset missing "transparent" in title.');
        }
        var complianceScore = 100;
        if (isCriticalFailure)
            complianceScore -= 50;
        var finalSeoScore = Math.min(100, Math.max(0, seoScore));
        var finalCommercialScore = Math.min(100, Math.max(0, commercialScore));
        var finalComplianceScore = Math.min(100, Math.max(0, complianceScore));
        var confidenceScore = Math.round((finalSeoScore * 0.4) + (finalCommercialScore * 0.4) + (finalComplianceScore * 0.2));
        if (isCriticalFailure) {
            confidenceScore = Math.min(58, confidenceScore);
        }
        if (confidenceScore >= 88 && !isCriticalFailure) {
            suggestions.push('Metadata is production-ready and optimized for direct upload.');
        }
        else if (confidenceScore < 85) {
            suggestions.push('Metadata requires internal refinement to meet commercial thresholds.');
        }
        return {
            seoScore: finalSeoScore,
            commercialScore: finalCommercialScore,
            complianceScore: finalComplianceScore,
            confidenceScore: confidenceScore,
            explanations: {
                seo: seoExplanations,
                commercial: commercialExplanations,
                compliance: complianceExplanations,
                suggestions: suggestions
            }
        };
    };
    return SEOScoreEngine;
}());
export { SEOScoreEngine };

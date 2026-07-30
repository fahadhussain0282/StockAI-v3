var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
import { GENERIC_MICROSTOCK_TERMS } from './constants';
import { sanitizeGeneratedText } from './validators';
import { assignKeywordPriority, COMMERCIAL_INTENT_TERMS } from './knowledge';
var KeywordEngine = /** @class */ (function () {
    function KeywordEngine() {
    }
    KeywordEngine.sanitizeKeywordsList = function (keywords) {
        if (!Array.isArray(keywords))
            return [];
        var cleaned = [];
        var seen = new Set();
        for (var _i = 0, keywords_1 = keywords; _i < keywords_1.length; _i++) {
            var rawKw = keywords_1[_i];
            if (typeof rawKw !== 'string')
                continue;
            var kw = sanitizeGeneratedText(rawKw).toLowerCase().trim();
            if (!kw || kw.length < 2)
                continue;
            if (/^\d+$/.test(kw))
                continue; // Pure digits
            if (/\b(img|dsc|dcim|vid|raw|file|temp|upload)\d+\b/i.test(kw))
                continue;
            if (/\b\d{6,}\b/.test(kw))
                continue; // Timestamp/random ID numbers
            if (/\.(jpg|jpeg|png|eps|svg|tiff)\b/i.test(kw))
                continue;
            if (!seen.has(kw)) {
                seen.add(kw);
                cleaned.push(kw);
            }
        }
        return cleaned;
    };
    KeywordEngine.evaluateKeywordQuality = function (keyword, context, marketplaceRule) {
        var kwLower = keyword.toLowerCase();
        var commercialValue = 50;
        var searchIntent = 50;
        var semanticAccuracy = 50;
        var marketplaceCompatibility = 100;
        var contextMatch = 50;
        var duplicateRisk = 0;
        // Commercial Value & Search Intent
        if (COMMERCIAL_INTENT_TERMS.includes(kwLower)) {
            commercialValue += 30;
            searchIntent += 20;
        }
        if (context.primarySubject.toLowerCase().includes(kwLower) || context.secondarySubjects.some(function (s) { return s.toLowerCase().includes(kwLower); })) {
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
        var totalScore = Math.round((commercialValue * 0.25) +
            (searchIntent * 0.25) +
            (semanticAccuracy * 0.2) +
            (marketplaceCompatibility * 0.15) +
            (contextMatch * 0.15) -
            (duplicateRisk * 0.5));
        return {
            keyword: keyword,
            commercialValue: Math.min(100, Math.max(0, commercialValue)),
            searchIntent: Math.min(100, Math.max(0, searchIntent)),
            semanticAccuracy: Math.min(100, Math.max(0, semanticAccuracy)),
            marketplaceCompatibility: Math.min(100, Math.max(0, marketplaceCompatibility)),
            contextMatch: Math.min(100, Math.max(0, contextMatch)),
            duplicateRisk: Math.min(100, Math.max(0, duplicateRisk)),
            totalScore: Math.min(100, Math.max(0, totalScore))
        };
    };
    KeywordEngine.generateKeywordBuckets = function (cleanedKeywords, context) {
        var buckets = [];
        var _loop_1 = function (i) {
            var kw = cleanedKeywords[i];
            var kwLower = kw.toLowerCase();
            var category = 'attribute';
            if (context.primarySubject.toLowerCase().includes(kwLower) || context.secondarySubjects.some(function (s) { return s.toLowerCase().includes(kwLower); })) {
                category = 'subject';
            }
            else if (COMMERCIAL_INTENT_TERMS.includes(kwLower) || context.industry.toLowerCase().includes(kwLower) || context.commercialCategory.toLowerCase().includes(kwLower)) {
                category = 'commercial';
            }
            else if (context.visualStyle.toLowerCase().includes(kwLower)) {
                category = 'style';
            }
            else if (context.colorPalette.some(function (c) { return c.toLowerCase().includes(kwLower); })) {
                category = 'color';
            }
            else if (context.composition.toLowerCase().includes(kwLower)) {
                category = 'composition';
            }
            buckets.push({
                tag: kw,
                category: category,
                weight: Math.max(10, 100 - i * 2)
            });
        };
        for (var i = 0; i < cleanedKeywords.length; i++) {
            _loop_1(i);
        }
        return buckets;
    };
    KeywordEngine.ensureExactKeywordCount = function (keywords, targetCount, context, marketplaceRule) {
        var _this = this;
        var cleaned = this.sanitizeKeywordsList(keywords);
        // Evaluate Quality & Filter Weak Keywords
        var evaluated = cleaned.map(function (kw) { return _this.evaluateKeywordQuality(kw, context, marketplaceRule); });
        cleaned = evaluated.filter(function (e) { return e.totalScore >= 50; }).map(function (e) { return e.keyword; });
        // Fill pool if lacking
        var pool = __spreadArray(__spreadArray(__spreadArray(__spreadArray(__spreadArray(__spreadArray(__spreadArray(__spreadArray(__spreadArray([], context.primarySubject.split(/\s+/), true), context.secondarySubjects.flatMap(function (s) { return s.split(/\s+/); }), true), context.industry.split(/\s+/), true), context.commercialCategory.split(/\s+/), true), context.visualStyle.split(/\s+/), true), context.colorPalette, true), context.composition.split(/\s+/), true), context.targetAudience.flatMap(function (a) { return a.split(/\s+/); }), true), COMMERCIAL_INTENT_TERMS, true).map(function (k) { return k.toLowerCase().trim(); }).filter(function (k) { return k.length >= 3; });
        var seen = new Set(cleaned.map(function (k) { return k.toLowerCase(); }));
        for (var _i = 0, pool_1 = pool; _i < pool_1.length; _i++) {
            var term = pool_1[_i];
            if (cleaned.length >= targetCount)
                break;
            var sanitizedTerm = sanitizeGeneratedText(term).toLowerCase();
            if (sanitizedTerm && !seen.has(sanitizedTerm) && !/^\d+$/.test(sanitizedTerm)) {
                var quality = this.evaluateKeywordQuality(sanitizedTerm, context, marketplaceRule);
                if (quality.totalScore >= 50) {
                    seen.add(sanitizedTerm);
                    cleaned.push(sanitizedTerm);
                }
            }
        }
        // Bucket them to know their category for sorting
        var buckets = this.generateKeywordBuckets(cleaned, context);
        // 10-Tier Priority Sort
        buckets.sort(function (a, b) {
            var priorityA = assignKeywordPriority(a.category);
            var priorityB = assignKeywordPriority(b.category);
            if (priorityA !== priorityB) {
                return priorityA - priorityB;
            }
            return b.weight - a.weight;
        });
        cleaned = buckets.map(function (b) { return b.tag; });
        if (cleaned.length > targetCount) {
            cleaned = cleaned.slice(0, targetCount);
        }
        return cleaned;
    };
    return KeywordEngine;
}());
export { KeywordEngine };

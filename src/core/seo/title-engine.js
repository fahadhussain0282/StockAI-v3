import { GENERIC_TITLE_PHRASES } from './constants';
import { sanitizeGeneratedText } from './validators';
var TitleEngine = /** @class */ (function () {
    function TitleEngine() {
    }
    TitleEngine.sanitizeTitle = function (rawTitle, defaultFallback) {
        if (defaultFallback === void 0) { defaultFallback = 'Commercial Visual Design Asset'; }
        if (!rawTitle)
            return defaultFallback;
        var title = sanitizeGeneratedText(rawTitle);
        // Remove known marketing suffixes, hardcoded templates & stock filler phrases
        title = title
            .replace(/\s*[-_–—|:]\s*(High Quality Commercial Stock Asset|High Quality Commercial Asset|High Quality Commercial Image|Commercial Stock Asset|Commercial Stock Concept|Stock Photo|Stock Asset|High Quality|Stock Visual Asset)\b/gi, '')
            .replace(/\b(High Quality Commercial Stock Asset|High Quality Commercial Asset|High Quality Commercial Image|Commercial Stock Asset|Commercial Stock Concept)\b/gi, '')
            .replace(/\s*[-_–—|:]\s*$/g, '') // Remove trailing hyphens/dashes/pipes/colons
            .replace(/^\s*[-_–—|:]\s*/g, '') // Remove leading hyphens/dashes/pipes/colons
            .replace(/\s{2,}/g, ' ') // Collapse multiple spaces
            .replace(/[-_–—]{2,}/g, '-') // Replace multiple hyphens with single
            .trim();
        // Strip trailing & leading punctuation separators (-, :, ;, ,, .)
        title = title.replace(/[-_–—|:,;.]\s*$/g, '').trim();
        title = title.replace(/^\s*[-_–—|:,;.]/g, '').trim();
        if (!title || title.length < 3) {
            return defaultFallback;
        }
        return title;
    };
    TitleEngine.constructHumanWrittenTitle = function (context) {
        // Structural Formula: [Primary Subject] + [Main Attribute] + [Style] + [Purpose] + [Background]
        var subject = context.primarySubject;
        var attribute = context.secondarySubjects.length > 0 ? "with ".concat(context.secondarySubjects.slice(0, 2).join(' and ')) : '';
        var style = context.visualStyle && context.visualStyle !== 'Unknown' ? "in ".concat(context.visualStyle, " style") : '';
        var purpose = context.purpose && context.purpose !== 'Unknown' ? "for ".concat(context.purpose) : '';
        var background = context.backgroundType !== 'Unknown' && context.backgroundType !== 'Isolated' && !context.isTransparent ? "on ".concat(context.backgroundType, " background") : '';
        var parts = [subject, attribute, style, purpose, background].filter(Boolean);
        var generatedTitle = parts.join(' ');
        // Fallback if it becomes too robotic or long
        var words = generatedTitle.split(/\s+/);
        if (words.length > 14) {
            return words.slice(0, 12).join(' ');
        }
        return this.sanitizeTitle(generatedTitle);
    };
    TitleEngine.refineTitleToCommercialStandard = function (rawTitle, context, cleanFileName) {
        var title = this.sanitizeTitle(rawTitle, cleanFileName || 'Commercial Visual Stock Asset');
        var words = title.split(/\s+/).filter(Boolean);
        var titleLower = title.toLowerCase().trim();
        var isGeneric = GENERIC_TITLE_PHRASES.some(function (pat) { return titleLower === pat || titleLower === "a ".concat(pat) || titleLower === "an ".concat(pat); });
        // If title is already strong (>= 8 words, >= 45 chars, not generic), return it
        if (!isGeneric && words.length >= 6 && title.length >= 45) {
            return title;
        }
        // Attempt dynamic human-written construction
        var candidate = this.constructHumanWrittenTitle(context);
        var candidateWords = candidate.split(/\s+/).filter(Boolean);
        if (candidateWords.length < 6 || candidate.length < 45) {
            candidate = "Commercial ".concat(context.primarySubject, " ").concat(context.visualStyle, " design element for ").concat(context.industry, " projects");
            candidateWords = candidate.split(/\s+/).filter(Boolean);
        }
        if (candidateWords.length > 14) {
            candidate = candidateWords.slice(0, 12).join(' ');
        }
        return this.sanitizeTitle(candidate, 'Professional Commercial Stock Asset for Digital Marketing');
    };
    return TitleEngine;
}());
export { TitleEngine };

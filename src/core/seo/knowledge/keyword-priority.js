// 10-Tier Keyword Priority Order
export var KeywordPriority;
(function (KeywordPriority) {
    KeywordPriority[KeywordPriority["SUBJECT"] = 1] = "SUBJECT";
    KeywordPriority[KeywordPriority["SYNONYM"] = 2] = "SYNONYM";
    KeywordPriority[KeywordPriority["CATEGORY"] = 3] = "CATEGORY";
    KeywordPriority[KeywordPriority["FUNCTION"] = 4] = "FUNCTION";
    KeywordPriority[KeywordPriority["INDUSTRY"] = 5] = "INDUSTRY";
    KeywordPriority[KeywordPriority["COMMERCIAL_INTENT"] = 6] = "COMMERCIAL_INTENT";
    KeywordPriority[KeywordPriority["STYLE"] = 7] = "STYLE";
    KeywordPriority[KeywordPriority["COMPOSITION"] = 8] = "COMPOSITION";
    KeywordPriority[KeywordPriority["COLOR"] = 9] = "COLOR";
    KeywordPriority[KeywordPriority["USE_CASE"] = 10] = "USE_CASE";
})(KeywordPriority || (KeywordPriority = {}));
export function assignKeywordPriority(category) {
    switch (category.toLowerCase()) {
        case 'subject': return KeywordPriority.SUBJECT;
        case 'synonym': return KeywordPriority.SYNONYM;
        case 'category': return KeywordPriority.CATEGORY;
        case 'function': return KeywordPriority.FUNCTION;
        case 'industry': return KeywordPriority.INDUSTRY;
        case 'commercial':
        case 'commercial_intent': return KeywordPriority.COMMERCIAL_INTENT;
        case 'style': return KeywordPriority.STYLE;
        case 'composition': return KeywordPriority.COMPOSITION;
        case 'color': return KeywordPriority.COLOR;
        case 'use_case':
        case 'usecase': return KeywordPriority.USE_CASE;
        default: return 99; // Unknown
    }
}

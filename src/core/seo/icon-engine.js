var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
var IconEngine = /** @class */ (function () {
    function IconEngine() {
    }
    IconEngine.optimizeKeywords = function (keywords, context) {
        if (context.assetType !== 'Icon')
            return keywords;
        var priorityTerms = ['icon', 'symbol', 'ui', 'interface', 'web design', 'app sign'];
        var filtered = keywords.filter(function (k) { return !priorityTerms.includes(k.toLowerCase()); });
        return __spreadArray(__spreadArray([], priorityTerms, true), filtered, true).slice(0, keywords.length);
    };
    IconEngine.optimizeTitle = function (title, context) {
        if (context.assetType !== 'Icon')
            return title;
        var lowerTitle = title.toLowerCase();
        if (!lowerTitle.includes('icon') && !lowerTitle.includes('symbol')) {
            return "".concat(title, " Icon Symbol for UI Design");
        }
        return title;
    };
    return IconEngine;
}());
export { IconEngine };

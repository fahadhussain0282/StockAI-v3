var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
var TransparentEngine = /** @class */ (function () {
    function TransparentEngine() {
    }
    TransparentEngine.optimizeKeywords = function (keywords, context) {
        if (!context.isTransparent)
            return keywords;
        var priorityTerms = ['transparent background', 'isolated', 'cut out', 'png'];
        var filtered = keywords.filter(function (k) { return !priorityTerms.includes(k.toLowerCase()); });
        return __spreadArray(__spreadArray([], priorityTerms, true), filtered, true).slice(0, keywords.length);
    };
    TransparentEngine.optimizeTitle = function (title, context) {
        if (!context.isTransparent)
            return title;
        var lowerTitle = title.toLowerCase();
        if (!lowerTitle.includes('transparent')) {
            return "".concat(title, " on transparent background");
        }
        return title;
    };
    return TransparentEngine;
}());
export { TransparentEngine };

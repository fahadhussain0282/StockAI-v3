var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
var VectorEngine = /** @class */ (function () {
    function VectorEngine() {
    }
    VectorEngine.optimizeKeywords = function (keywords, context) {
        if (context.assetType !== 'Vector' && context.assetType !== 'Illustration')
            return keywords;
        var priorityTerms = ['vector', 'illustration', 'editable', 'scalable', 'flat design'];
        var filtered = keywords.filter(function (k) { return !priorityTerms.includes(k.toLowerCase()); });
        return __spreadArray(__spreadArray([], priorityTerms, true), filtered, true).slice(0, keywords.length);
    };
    VectorEngine.optimizeTitle = function (title, context) {
        if (context.assetType !== 'Vector' && context.assetType !== 'Illustration')
            return title;
        var lowerTitle = title.toLowerCase();
        if (!lowerTitle.includes('vector') && !lowerTitle.includes('illustration')) {
            return "".concat(title, " Vector Illustration");
        }
        return title;
    };
    return VectorEngine;
}());
export { VectorEngine };

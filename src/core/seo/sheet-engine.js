var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
var SheetEngine = /** @class */ (function () {
    function SheetEngine() {
    }
    SheetEngine.optimizeKeywords = function (keywords, context) {
        if (!context.isCollection && context.assetType !== 'Sheet/Collection')
            return keywords;
        var priorityTerms = ['collection', 'set', 'pack', 'bundle', 'kit', 'assortment'];
        var filtered = keywords.filter(function (k) { return !priorityTerms.includes(k.toLowerCase()); });
        return __spreadArray(__spreadArray([], priorityTerms, true), filtered, true).slice(0, keywords.length);
    };
    SheetEngine.optimizeTitle = function (title, context) {
        if (!context.isCollection && context.assetType !== 'Sheet/Collection')
            return title;
        var lowerTitle = title.toLowerCase();
        if (!lowerTitle.includes('collection') && !lowerTitle.includes('set') && !lowerTitle.includes('pack')) {
            return "".concat(title, " Element Collection Set");
        }
        return title;
    };
    return SheetEngine;
}());
export { SheetEngine };

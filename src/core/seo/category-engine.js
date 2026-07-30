var CategoryEngine = /** @class */ (function () {
    function CategoryEngine() {
    }
    CategoryEngine.predictCategoryIntelligence = function (primary, secondary, context, marketplaceRules) {
        // Deep Vision Analysis Based Heuristics
        var sector = context.commercialCategory || 'Business & Commercial';
        var confidence = 85;
        // Utilize the V2 Deep Vision fields
        var intent = (context.marketplaceIntent || '').toLowerCase();
        var useCase = (context.businessUseCase || '').toLowerCase();
        var industry = (context.industry || '').toLowerCase();
        if (industry.includes('tech') || industry.includes('software') || useCase.includes('data')) {
            sector = 'Technology & Science';
            confidence += 5;
        }
        else if (industry.includes('health') || useCase.includes('medical') || useCase.includes('clinic')) {
            sector = 'Healthcare & Medicine';
            confidence += 5;
        }
        else if (industry.includes('finance') || useCase.includes('investment') || intent.includes('financial')) {
            sector = 'Business & Finance';
            confidence += 5;
        }
        else if (industry.includes('education') || useCase.includes('learning')) {
            sector = 'Education & Learning';
            confidence += 5;
        }
        // Attempt to map to exact marketplace category names if provided
        var finalPrimary = primary;
        var finalSecondary = secondary;
        if (marketplaceRules && marketplaceRules.categories && marketplaceRules.categories.length > 0) {
            // Just a simple validation that the AI picked a valid category from the allowed list
            var allowedLower = marketplaceRules.categories.map(function (c) { return c.toLowerCase(); });
            if (!allowedLower.includes(primary.toLowerCase())) {
                finalPrimary = marketplaceRules.categories[0];
                confidence -= 10;
            }
        }
        return {
            primaryCategory: finalPrimary || 'General',
            secondaryCategory: finalSecondary || 'Backgrounds/Textures',
            commercialSector: sector,
            confidenceScore: Math.min(99, confidence + (context.commercialIntentScore || 0) * 0.1)
        };
    };
    return CategoryEngine;
}());
export { CategoryEngine };

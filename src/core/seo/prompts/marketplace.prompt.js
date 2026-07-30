export var getMarketplacePrompt = function (name, titleStrategy, keywordLimit, descStyle) {
    return "5. MARKETPLACE INTELLIGENCE:\n- Target Marketplace: ".concat(name, "\n- Title Strategy: ").concat(titleStrategy, "\n- Description Style: ").concat(descStyle, "\n- Maximum Keyword Limit: ").concat(keywordLimit, "\nOptimize the metadata exactly for ").concat(name, "'s buyer search algorithms.");
};

export var getKeywordPrompt = function (count) {
    if (count === void 0) { count = 30; }
    return "3. KEYWORD GENERATION: Generate EXACTLY ".concat(count, " semantic keywords maximizing commercial discoverability.\n- CRITICAL: Sort keywords STRICTLY by this 10-tier priority: \n  1. Subject, 2. Synonyms, 3. Category, 4. Function, 5. Industry, 6. Commercial Intent, 7. Style, 8. Composition, 9. Color, 10. Use Cases.\n- Ensure the first 10 keywords are the strongest commercial terms.\n- Every keyword MUST add commercial value. No filler, no duplicates.");
};

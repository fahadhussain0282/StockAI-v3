export const getKeywordPrompt = (count: number = 30): string => {
  return `3. KEYWORD GENERATION: Generate EXACTLY ${count} semantic keywords maximizing commercial discoverability.
- CRITICAL: Sort keywords STRICTLY by this 10-tier priority: 
  1. Subject, 2. Synonyms, 3. Category, 4. Function, 5. Industry, 6. Commercial Intent, 7. Style, 8. Composition, 9. Color, 10. Use Cases.
- Ensure the first 10 keywords are the strongest commercial terms.
- Every keyword MUST add commercial value. No filler, no duplicates.`;
};

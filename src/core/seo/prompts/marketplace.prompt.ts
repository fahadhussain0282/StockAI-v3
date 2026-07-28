export const getMarketplacePrompt = (
  name: string,
  titleStrategy: string,
  keywordLimit: number,
  descStyle: string
): string => {
  return `5. MARKETPLACE INTELLIGENCE:
- Target Marketplace: ${name}
- Title Strategy: ${titleStrategy}
- Description Style: ${descStyle}
- Maximum Keyword Limit: ${keywordLimit}
Optimize the metadata exactly for ${name}'s buyer search algorithms.`;
};

import { SharedMetadataContext } from './types';

export class IllustrationEngine {
  public static optimizeKeywords(keywords: string[], context: SharedMetadataContext): string[] {
    if (context.assetType !== 'Illustration') return keywords;
    const priorityTerms = ['illustration', 'artwork', 'graphic', 'drawing', 'creative concept'];
    const filtered = keywords.filter(k => !priorityTerms.includes(k.toLowerCase()));
    return [...priorityTerms, ...filtered].slice(0, keywords.length);
  }

  public static optimizeTitle(title: string, context: SharedMetadataContext): string {
    if (context.assetType !== 'Illustration') return title;
    const lowerTitle = title.toLowerCase();
    if (!lowerTitle.includes('illustration') && !lowerTitle.includes('drawing')) {
      return `${title} Creative Graphic Illustration`;
    }
    return title;
  }
}

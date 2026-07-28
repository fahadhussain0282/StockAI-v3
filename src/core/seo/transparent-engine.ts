import { SharedMetadataContext } from './types';

export class TransparentEngine {
  public static optimizeKeywords(keywords: string[], context: SharedMetadataContext): string[] {
    if (!context.isTransparent) return keywords;
    const priorityTerms = ['transparent background', 'isolated', 'cut out', 'png'];
    const filtered = keywords.filter(k => !priorityTerms.includes(k.toLowerCase()));
    return [...priorityTerms, ...filtered].slice(0, keywords.length);
  }

  public static optimizeTitle(title: string, context: SharedMetadataContext): string {
    if (!context.isTransparent) return title;
    const lowerTitle = title.toLowerCase();
    if (!lowerTitle.includes('transparent')) {
      return `${title} on transparent background`;
    }
    return title;
  }
}

import { SharedMetadataContext } from './types';

export class IconEngine {
  public static optimizeKeywords(keywords: string[], context: SharedMetadataContext): string[] {
    if (context.assetType !== 'Icon') return keywords;
    const priorityTerms = ['icon', 'symbol', 'ui', 'interface', 'web design', 'app sign'];
    const filtered = keywords.filter(k => !priorityTerms.includes(k.toLowerCase()));
    return [...priorityTerms, ...filtered].slice(0, keywords.length);
  }

  public static optimizeTitle(title: string, context: SharedMetadataContext): string {
    if (context.assetType !== 'Icon') return title;
    const lowerTitle = title.toLowerCase();
    if (!lowerTitle.includes('icon') && !lowerTitle.includes('symbol')) {
      return `${title} Icon Symbol for UI Design`;
    }
    return title;
  }
}

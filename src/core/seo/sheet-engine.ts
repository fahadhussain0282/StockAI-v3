import { SharedMetadataContext } from './types';

export class SheetEngine {
  public static optimizeKeywords(keywords: string[], context: SharedMetadataContext): string[] {
    if (!context.isCollection && context.assetType !== 'Sheet/Collection') return keywords;
    const priorityTerms = ['collection', 'set', 'pack', 'bundle', 'kit', 'assortment'];
    const filtered = keywords.filter(k => !priorityTerms.includes(k.toLowerCase()));
    return [...priorityTerms, ...filtered].slice(0, keywords.length);
  }

  public static optimizeTitle(title: string, context: SharedMetadataContext): string {
    if (!context.isCollection && context.assetType !== 'Sheet/Collection') return title;
    const lowerTitle = title.toLowerCase();
    if (!lowerTitle.includes('collection') && !lowerTitle.includes('set') && !lowerTitle.includes('pack')) {
      return `${title} Element Collection Set`;
    }
    return title;
  }
}

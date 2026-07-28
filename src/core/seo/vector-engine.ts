import { SharedMetadataContext } from './types';

export class VectorEngine {
  public static optimizeKeywords(keywords: string[], context: SharedMetadataContext): string[] {
    if (context.assetType !== 'Vector' && context.assetType !== 'Illustration') return keywords;
    const priorityTerms = ['vector', 'illustration', 'editable', 'scalable', 'flat design'];
    const filtered = keywords.filter(k => !priorityTerms.includes(k.toLowerCase()));
    return [...priorityTerms, ...filtered].slice(0, keywords.length);
  }

  public static optimizeTitle(title: string, context: SharedMetadataContext): string {
    if (context.assetType !== 'Vector' && context.assetType !== 'Illustration') return title;
    const lowerTitle = title.toLowerCase();
    if (!lowerTitle.includes('vector') && !lowerTitle.includes('illustration')) {
      return `${title} Vector Illustration`;
    }
    return title;
  }
}

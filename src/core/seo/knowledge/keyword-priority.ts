// 10-Tier Keyword Priority Order
export enum KeywordPriority {
  SUBJECT = 1,
  SYNONYM = 2,
  CATEGORY = 3,
  FUNCTION = 4,
  INDUSTRY = 5,
  COMMERCIAL_INTENT = 6,
  STYLE = 7,
  COMPOSITION = 8,
  COLOR = 9,
  USE_CASE = 10
}

export function assignKeywordPriority(category: string): number {
  switch (category.toLowerCase()) {
    case 'subject': return KeywordPriority.SUBJECT;
    case 'synonym': return KeywordPriority.SYNONYM;
    case 'category': return KeywordPriority.CATEGORY;
    case 'function': return KeywordPriority.FUNCTION;
    case 'industry': return KeywordPriority.INDUSTRY;
    case 'commercial':
    case 'commercial_intent': return KeywordPriority.COMMERCIAL_INTENT;
    case 'style': return KeywordPriority.STYLE;
    case 'composition': return KeywordPriority.COMPOSITION;
    case 'color': return KeywordPriority.COLOR;
    case 'use_case':
    case 'usecase': return KeywordPriority.USE_CASE;
    default: return 99; // Unknown
  }
}

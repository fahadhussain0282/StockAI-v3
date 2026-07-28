import { SEOBreakdown, MarketplaceRule, KeywordBucket } from '../../types';

export function calculateSEOAndQualityScores(
  title: string,
  keywords: string[],
  keywordBuckets: KeywordBucket[],
  marketplaceRule: MarketplaceRule,
  options: {
    enablePrefix?: boolean;
    prefix?: string;
    enableSuffix?: boolean;
    suffix?: string;
  } = {}
): SEOBreakdown {
  const seoExplanations: string[] = [];
  const commercialExplanations: string[] = [];
  const complianceExplanations: string[] = [];
  const suggestions: string[] = [];

  let isCriticalFailure = false;

  // --- 1. SEO SCORE CALCULATIONS (0 - 100) ---
  let seoScore = 100;

  // Title Word Count & Length Checks (StockAI Standard: 8–12 words, 45+ chars)
  const titleWords = title.toLowerCase().split(/\s+/).filter(Boolean);
  const titleLength = title.length;

  // Generic Title Check
  const genericPhrases = [
    'abstract digital graphic',
    'abstract graphic',
    'flower',
    'business icon',
    'technology background',
    'vector graphic',
    'stock photo',
    'background graphic',
    'illustration',
    'design asset',
    '3d render',
    'concept image'
  ];
  const isGenericTitle = genericPhrases.some(phrase => title.toLowerCase().trim() === phrase || title.toLowerCase().trim() === `a ${phrase}`);

  if (isGenericTitle) {
    isCriticalFailure = true;
    seoScore -= 45;
    seoExplanations.push(`FAIL: Title "${title}" is a generic phrase. High-ranking commercial titles must be specific (8-12 words, 45+ chars).`);
    suggestions.push('Replace short generic title with a descriptive 8-12 word commercial title.');
  }

  // Word count validation
  if (titleWords.length < 4) {
    isCriticalFailure = true;
    seoScore -= 40;
    seoExplanations.push(`FAIL: Title has fewer than 4 words (${titleWords.length} word${titleWords.length === 1 ? '' : 's'}). Minimum 8–12 words required.`);
    suggestions.push('Expand title to at least 8-12 descriptive search terms.');
  } else if (titleWords.length < 8) {
    seoScore -= 20;
    seoExplanations.push(`Title has ${titleWords.length} words. StockAI recommends 8–12 words for maximum search indexing.`);
    suggestions.push('Include additional visual style, composition, and target application terms.');
  } else if (titleWords.length >= 8 && titleWords.length <= 14) {
    seoExplanations.push(`Title contains optimal word density (${titleWords.length} descriptive search terms).`);
  } else {
    seoScore -= 10;
    seoExplanations.push(`Title is long (${titleWords.length} words). Ensure primary terms appear in the first 8 words.`);
  }

  // Character length validation
  if (titleLength < marketplaceRule.titleMinLength) {
    isCriticalFailure = true;
    seoScore -= 30;
    seoExplanations.push(`FAIL: Title length (${titleLength} chars) is below ${marketplaceRule.name} minimum (${marketplaceRule.titleMinLength} chars).`);
  } else if (titleLength < 45) {
    seoScore -= 20;
    seoExplanations.push(`Title is short (${titleLength} chars). Minimum recommended for StockAI indexing is 45 chars.`);
    suggestions.push('Add commercial use cases or subject details to reach at least 45 characters.');
  } else if (titleLength > marketplaceRule.titleMaxLength) {
    isCriticalFailure = true;
    seoScore -= 35;
    seoExplanations.push(`FAIL: Title exceeds ${marketplaceRule.titleMaxLength} character limit for ${marketplaceRule.name}.`);
  } else if (titleLength >= 45 && titleLength <= 100) {
    seoExplanations.push(`Title length (${titleLength} chars) is optically optimized for StockAI Search Intelligence indexers.`);
  } else {
    seoExplanations.push(`Title length is acceptable (${titleLength} chars).`);
  }

  // Keyword Count Check
  const keywordCount = keywords.length;
  if (keywordCount < marketplaceRule.keywordMinCount) {
    isCriticalFailure = true;
    seoScore -= 35;
    seoExplanations.push(`FAIL: Only ${keywordCount} keywords added. ${marketplaceRule.name} requires at least ${marketplaceRule.keywordMinCount}.`);
    suggestions.push(`Add more keywords to reach at least ${marketplaceRule.keywordMinCount} tags.`);
  } else if (keywordCount < 25) {
    seoScore -= 15;
    seoExplanations.push(`Only ${keywordCount} keywords included. Recommend 30–50 keywords for maximum marketplace discoverability.`);
  } else if (keywordCount >= 25 && keywordCount <= 75) {
    seoExplanations.push(`Optimal keyword count (${keywordCount} keywords). Complete index coverage achieved.`);
  } else {
    seoExplanations.push(`${keywordCount} keywords included.`);
  }

  // Check for duplicate keywords
  const uniqueKeywords = new Set(keywords.map(k => k.toLowerCase().trim()));
  if (uniqueKeywords.size < keywords.length) {
    const diff = keywords.length - uniqueKeywords.size;
    seoScore -= diff * 5;
    seoExplanations.push(`Found ${diff} duplicate keyword(s) which wastes keyword slot allocation.`);
    suggestions.push('Remove duplicate keywords to maximize unique search terms.');
  }

  // --- 2. COMMERCIAL SCORE CALCULATIONS (0 - 100) ---
  let commercialScore = 85;

  if (isGenericTitle) {
    commercialScore -= 35;
    commercialExplanations.push('Generic titles lack buyer conversion triggers and lower search click-through rate.');
  }

  // Commercial intent keywords presence
  const commercialBuckets = keywordBuckets.filter(b => b.category === 'commercial' || b.category === 'industry');
  if (commercialBuckets.length > 0) {
    commercialScore += 10;
    commercialExplanations.push(`Includes ${commercialBuckets.length} high-conversion buyer intent & industry keywords.`);
  } else {
    commercialScore -= 10;
    commercialExplanations.push('Add industry or commercial usage tags (e.g., corporate, marketing, background) to attract enterprise buyers.');
    suggestions.push('Include commercial usage keywords like "business", "concept", "advertising".');
  }

  // Subject taxonomy balance
  const subjectBuckets = keywordBuckets.filter(b => b.category === 'subject');
  if (subjectBuckets.length >= 3) {
    commercialScore += 5;
    commercialExplanations.push('Strong primary subject taxonomy established.');
  }

  // ALL CAPS Check
  if (title === title.toUpperCase() && title.length > 10) {
    commercialScore -= 25;
    commercialExplanations.push('Title is in ALL CAPS. Marketplaces prefer standard Sentence or Title Case.');
    suggestions.push('Change Title from ALL CAPS to Title Case.');
  }

  // --- 3. COMPLIANCE SCORE CALCULATIONS (0 - 100) ---
  let complianceScore = 100;

  if (titleLength > marketplaceRule.titleMaxLength) {
    complianceScore -= 45;
    complianceExplanations.push(`FAIL: Exceeds ${marketplaceRule.name} maximum title character length (${marketplaceRule.titleMaxLength}).`);
  } else if (titleLength < marketplaceRule.titleMinLength) {
    complianceScore -= 30;
    complianceExplanations.push(`FAIL: Title length (${titleLength}) below ${marketplaceRule.name} minimum (${marketplaceRule.titleMinLength}).`);
  } else {
    complianceExplanations.push(`PASS: Meets ${marketplaceRule.name} title character guidelines.`);
  }

  if (keywordCount > marketplaceRule.keywordMaxCount) {
    complianceScore -= 40;
    complianceExplanations.push(`FAIL: Keywords count (${keywordCount}) exceeds ${marketplaceRule.name} limit (${marketplaceRule.keywordMaxCount}).`);
  } else if (keywordCount < marketplaceRule.keywordMinCount) {
    complianceScore -= 35;
    complianceExplanations.push(`FAIL: Keywords count (${keywordCount}) below ${marketplaceRule.name} minimum (${marketplaceRule.keywordMinCount}).`);
  } else {
    complianceExplanations.push(`PASS: Keywords count (${keywordCount}) is within ${marketplaceRule.name} bounds.`);
  }

  // Forbidden spam words check
  const spamWords = ['best', 'top', 'cheap', 'buy', 'download', 'popular', '4k', 'hd', 'vector', 'photo'];
  const foundSpamInTitle = titleWords.filter(w => spamWords.includes(w) && marketplaceRule.id !== 'vecteezy');
  if (foundSpamInTitle.length > 0) {
    complianceScore -= 15 * foundSpamInTitle.length;
    complianceExplanations.push(`Warning: Potential promotional/quality buzzwords in title: "${foundSpamInTitle.join(', ')}".`);
    suggestions.push(`Remove buzzwords like "${foundSpamInTitle.join(', ')}" from the title to avoid agency rejection.`);
  }

  // --- 4. CONFIDENCE SCORE (0 - 100) ---
  let finalSeoScore = Math.min(100, Math.max(0, seoScore));
  let finalCommercialScore = Math.min(100, Math.max(0, commercialScore));
  let finalComplianceScore = Math.min(100, Math.max(0, complianceScore));

  let confidenceScore = Math.round((finalSeoScore * 0.4) + (finalCommercialScore * 0.3) + (finalComplianceScore * 0.3));

  // HARD LOGICAL CONSISTENCY CAP: If there is a critical failure (e.g. title < 4 words or generic title or missing min keywords),
  // confidenceScore CANNOT exceed 58/100, guaranteeing audit notes match health score!
  if (isCriticalFailure) {
    confidenceScore = Math.min(58, confidenceScore);
    finalSeoScore = Math.min(55, finalSeoScore);
  } else if (titleWords.length < 8 || titleLength < 45) {
    confidenceScore = Math.min(75, confidenceScore);
    finalSeoScore = Math.min(72, finalSeoScore);
  }

  confidenceScore = Math.min(100, Math.max(0, confidenceScore));

  if (confidenceScore >= 88 && !isCriticalFailure) {
    suggestions.push('Metadata is production-ready and optimized for direct upload.');
  } else if (confidenceScore < 75) {
    suggestions.push('Review warnings above to ensure high commercial search ranking.');
  }

  return {
    seoScore: finalSeoScore,
    commercialScore: finalCommercialScore,
    complianceScore: finalComplianceScore,
    confidenceScore,
    explanations: {
      seo: seoExplanations,
      commercial: commercialExplanations,
      compliance: complianceExplanations,
      suggestions
    }
  };
}

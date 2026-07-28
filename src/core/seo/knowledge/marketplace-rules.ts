export interface MarketplaceOptimizationRule {
  id: string;
  name: string;
  titleStrategy: string;
  keywordLimit: number;
  descStyle: string;
  categoryPreference: string;
  categories: string[];
  preferredKeywords: string[];
  forbiddenKeywords: string[];
  titleMinLength: number;
  titleMaxLength: number;
  keywordMinCount: number;
  keywordMaxCount: number;
}

export const MARKETPLACE_KNOWLEDGE: Record<string, MarketplaceOptimizationRule> = {
  'adobe-stock': {
    id: 'adobe-stock',
    name: 'Adobe Stock',
    titleStrategy: 'Commercial SEO focused, 8-12 words, zero filler phrases. Start with primary subject.',
    keywordLimit: 49,
    descStyle: 'Natural descriptive 1-2 sentences highlighting visual subject and commercial uses',
    categoryPreference: 'Adobe Stock Taxonomy Standard',
    categories: ['Business', 'Technology', 'Science'],
    preferredKeywords: ['commercial', 'business', 'background', 'design', 'modern'],
    forbiddenKeywords: ['vector', 'illustration', 'clipart', 'download', 'cheap'],
    titleMinLength: 45,
    titleMaxLength: 200,
    keywordMinCount: 7,
    keywordMaxCount: 49
  },
  'shutterstock': {
    id: 'shutterstock',
    name: 'Shutterstock',
    titleStrategy: 'Strict subject-first description, no brand names or trademark terms. Highly literal.',
    keywordLimit: 50,
    descStyle: 'Detailed subject overview with lighting and mood',
    categoryPreference: 'Shutterstock Dual-Category Standard',
    categories: ['Objects', 'Backgrounds/Textures', 'Healthcare/Medical'],
    preferredKeywords: ['isolated', 'white background', 'high quality', 'concept'],
    forbiddenKeywords: ['logo', 'brand', 'instagram', 'apple', 'google'],
    titleMinLength: 45,
    titleMaxLength: 200,
    keywordMinCount: 7,
    keywordMaxCount: 50
  },
  'freepik': {
    id: 'freepik',
    name: 'Freepik',
    titleStrategy: 'Design-oriented vector and template keywords. Actionable design components.',
    keywordLimit: 30,
    descStyle: 'Graphic asset composition and file format suitability',
    categoryPreference: 'Freepik Asset Taxonomy',
    categories: ['Vectors', 'Photos', 'Templates'],
    preferredKeywords: ['template', 'layout', 'graphic', 'presentation', 'mockup'],
    forbiddenKeywords: ['photo', 'real'],
    titleMinLength: 45,
    titleMaxLength: 100,
    keywordMinCount: 5,
    keywordMaxCount: 50
  },
  'vecteezy': {
    id: 'vecteezy',
    name: 'Vecteezy',
    titleStrategy: 'Illustration and vector design attributes. Highly stylistic.',
    keywordLimit: 50,
    descStyle: 'Vector asset scalability and design themes',
    categoryPreference: 'Vecteezy Design Categories',
    categories: ['Vectors', 'Photos'],
    preferredKeywords: ['vector', 'editable', 'scalable', 'flat', 'line art'],
    forbiddenKeywords: ['photo', 'photography', 'lens'],
    titleMinLength: 45,
    titleMaxLength: 200,
    keywordMinCount: 5,
    keywordMaxCount: 50
  },
  'pond5': {
    id: 'pond5',
    name: 'Pond5',
    titleStrategy: 'Action-oriented and descriptive of motion or emotion.',
    keywordLimit: 50,
    descStyle: 'Clear description of actions, moods, and setting.',
    categoryPreference: 'Pond5 Media Categories',
    categories: ['Footage', 'Music', 'SFX'],
    preferredKeywords: ['motion', 'dynamic', 'action', 'emotion', 'cinematic'],
    forbiddenKeywords: [],
    titleMinLength: 45,
    titleMaxLength: 200,
    keywordMinCount: 5,
    keywordMaxCount: 50
  },
  'general': {
    id: 'general',
    name: 'Universal Microstock',
    titleStrategy: 'Universal microstock metadata standards. 8-12 words.',
    keywordLimit: 50,
    descStyle: 'Clear, concise visual summary',
    categoryPreference: 'General Stock Taxonomy',
    categories: ['General', 'Backgrounds', 'Business'],
    preferredKeywords: [],
    forbiddenKeywords: ['best', 'cheap', 'buy', 'download'],
    titleMinLength: 45,
    titleMaxLength: 200,
    keywordMinCount: 5,
    keywordMaxCount: 50
  }
};

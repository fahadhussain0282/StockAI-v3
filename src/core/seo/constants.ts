export const MARKETPLACE_PROFILES: Record<string, { titleStrategy: string; keywordLimit: number; descStyle: string; categoryPreference: string }> = {
  'adobe-stock': {
    titleStrategy: 'Commercial SEO focused, 8-12 words, zero filler phrases',
    keywordLimit: 49,
    descStyle: 'Natural descriptive 1-2 sentences highlighting visual subject and commercial uses',
    categoryPreference: 'Adobe Stock Taxonomy Standard'
  },
  'shutterstock': {
    titleStrategy: 'Strict subject-first description, no brand names or trademark terms',
    keywordLimit: 50,
    descStyle: 'Detailed subject overview with lighting and mood',
    categoryPreference: 'Shutterstock Dual-Category Standard'
  },
  'freepik': {
    titleStrategy: 'Design-oriented vector and template keywords',
    keywordLimit: 30,
    descStyle: 'Graphic asset composition and file format suitability',
    categoryPreference: 'Freepik Asset Taxonomy'
  },
  'vecteezy': {
    titleStrategy: 'Illustration and vector design attributes',
    keywordLimit: 50,
    descStyle: 'Vector asset scalability and design themes',
    categoryPreference: 'Vecteezy Design Categories'
  },
  'general': {
    titleStrategy: 'Universal microstock metadata standards',
    keywordLimit: 30,
    descStyle: 'Clear, concise visual summary',
    categoryPreference: 'General Stock Taxonomy'
  }
};

export const GENERIC_TITLE_PHRASES = [
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
  'concept image',
  'digital asset',
  'vector background',
  'commercial visual design asset',
  'abstract background',
  'abstract cover templates'
];

export const GENERIC_MICROSTOCK_TERMS = [
  'background', 'concept', 'design', 'illustration', 'vector', 'abstract',
  'modern', 'business', 'technology', 'graphic', 'isolated', 'pattern',
  'template', 'banner', 'creative', 'digital', 'art', 'symbol', 'element',
  'style', 'texture', 'presentation', 'marketing', 'advertising', 'minimal',
  'corporate', 'professional', 'commercial', 'stock photo', 'high quality',
  'layout', 'decorative', 'header', 'cover', 'web', 'media', 'finance',
  'industry', 'growth', 'future', 'innovation', 'success', 'connection',
  'network', 'communication', 'strategy', 'data', 'information', 'service',
  'solution', 'global', 'management', 'office', 'work', 'workplace', 'people',
  'lifestyle', 'healthy', 'nature', 'landscape', 'outdoor', 'bright',
  'colorful', 'light', 'dark', 'shadow', 'gradient', 'dynamic', 'flat',
  'shape', 'composition', 'creativity', 'branding', 'editorial', 'publication',
  'promotion', 'display', 'graphics', 'visual', 'artwork', 'contemporary'
];

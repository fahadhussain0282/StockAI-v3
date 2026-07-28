import { BenchmarkAsset } from '../types';

export const GOLDEN_DATASET: BenchmarkAsset[] = [
  {
    id: 'asset_001_icon',
    assetType: 'Icon',
    marketplace: 'adobe-stock',
    fileName: 'home_button_ui.png',
    mockVisionData: {
      primarySubject: 'Home Button Icon',
      styleAndMedium: 'Flat UI Design',
      commercialUseCases: ['Web Navigation', 'Mobile Apps'],
      targetBuyers: ['UI/UX Designers'],
      dominantColors: ['Blue', 'White'],
      isTransparent: true
    },
    expectations: {
      minimumSeoScore: 90,
      requiredKeywords: ['icon', 'ui', 'interface', 'navigation', 'home'],
      forbiddenKeywords: ['photo', 'photography', 'realistic'],
      titleMustContain: ['Home', 'Icon'],
      expectedCategory: 'Graphic Resources'
    }
  },
  {
    id: 'asset_002_vector',
    assetType: 'Vector',
    marketplace: 'vecteezy',
    fileName: 'corporate_infographic.eps',
    mockVisionData: {
      primarySubject: 'Corporate Business Infographic',
      styleAndMedium: 'Vector Illustration',
      commercialUseCases: ['Business Presentations', 'Annual Reports'],
      targetBuyers: ['Corporate Professionals'],
      dominantColors: ['Blue', 'Gray'],
      isTransparent: false
    },
    expectations: {
      minimumSeoScore: 90,
      requiredKeywords: ['vector', 'infographic', 'business', 'corporate', 'chart', 'editable'],
      forbiddenKeywords: ['photo', 'lens'],
      titleMustContain: ['Infographic', 'Business'],
      expectedCategory: 'Vectors'
    }
  },
  {
    id: 'asset_003_photo_medical',
    assetType: 'Photo',
    marketplace: 'shutterstock',
    fileName: 'doctor_smiling_clinic.jpg',
    mockVisionData: {
      primarySubject: 'Female Doctor Smiling in Clinic',
      styleAndMedium: 'Professional Photography',
      commercialUseCases: ['Healthcare Marketing', 'Hospital Websites'],
      targetBuyers: ['Healthcare Providers'],
      dominantColors: ['White', 'Blue'],
      isTransparent: false
    },
    expectations: {
      minimumSeoScore: 92,
      requiredKeywords: ['doctor', 'healthcare', 'medical', 'clinic', 'professional'],
      forbiddenKeywords: ['vector', 'illustration', 'clipart'],
      titleMustContain: ['Doctor', 'Healthcare'],
      expectedCategory: 'Healthcare/Medical'
    }
  },
  {
    id: 'asset_004_transparent',
    assetType: 'Transparent',
    marketplace: 'freepik',
    fileName: 'laptop_mockup_cutout.png',
    mockVisionData: {
      primarySubject: 'Modern Laptop Mockup',
      styleAndMedium: '3D Render',
      commercialUseCases: ['Web Design Showcase', 'Software Marketing'],
      targetBuyers: ['Web Designers', 'Developers'],
      dominantColors: ['Silver', 'Black'],
      isTransparent: true
    },
    expectations: {
      minimumSeoScore: 90,
      requiredKeywords: ['laptop', 'mockup', 'transparent', 'isolated', 'computer'],
      forbiddenKeywords: ['nature', 'outdoor'],
      titleMustContain: ['Laptop', 'Mockup', 'transparent'],
      expectedCategory: 'Technology'
    }
  }
];

// We export a helper to generate a large load dataset for performance testing
export function generateLoadDataset(count: number): BenchmarkAsset[] {
  const loadDataset: BenchmarkAsset[] = [];
  const baseAsset = GOLDEN_DATASET[0];
  for (let i = 0; i < count; i++) {
    loadDataset.push({
      ...baseAsset,
      id: `load_asset_${i}`,
      fileName: `generated_asset_${i}.png`
    });
  }
  return loadDataset;
}

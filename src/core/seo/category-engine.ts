import { CategoryPrediction } from '../../types';

export class CategoryEngine {
  public static predictCategoryIntelligence(primary: string, secondary: string, title: string): CategoryPrediction {
    const titleLower = title.toLowerCase();
    let sector = 'Business & Commercial';
    
    if (titleLower.includes('tech') || titleLower.includes('data') || titleLower.includes('ai') || titleLower.includes('code')) {
      sector = 'Technology & Science';
    } else if (titleLower.includes('health') || titleLower.includes('doctor') || titleLower.includes('medical')) {
      sector = 'Healthcare & Medicine';
    } else if (titleLower.includes('nature') || titleLower.includes('animal') || titleLower.includes('landscape')) {
      sector = 'Environment & Nature';
    }

    return {
      primaryCategory: primary || 'Business/Workplace',
      secondaryCategory: secondary || 'Backgrounds/Textures',
      commercialSector: sector,
      confidenceScore: 96
    };
  }
}

import { CategoryPrediction } from '../../types';
import { SharedMetadataContext } from './types';

export class CategoryEngine {
  public static predictCategoryIntelligence(
    primary: string,
    secondary: string,
    context: SharedMetadataContext,
    marketplaceRules: any
  ): CategoryPrediction {
    
    // Deep Vision Analysis Based Heuristics
    let sector = context.commercialCategory || 'Business & Commercial';
    let confidence = 85;

    // Utilize the V2 Deep Vision fields
    const intent = (context.marketplaceIntent || '').toLowerCase();
    const useCase = (context.businessUseCase || '').toLowerCase();
    const industry = (context.industry || '').toLowerCase();
    
    if (industry.includes('tech') || industry.includes('software') || useCase.includes('data')) {
      sector = 'Technology & Science';
      confidence += 5;
    } else if (industry.includes('health') || useCase.includes('medical') || useCase.includes('clinic')) {
      sector = 'Healthcare & Medicine';
      confidence += 5;
    } else if (industry.includes('finance') || useCase.includes('investment') || intent.includes('financial')) {
      sector = 'Business & Finance';
      confidence += 5;
    } else if (industry.includes('education') || useCase.includes('learning')) {
      sector = 'Education & Learning';
      confidence += 5;
    }

    // Attempt to map to exact marketplace category names if provided
    let finalPrimary = primary;
    let finalSecondary = secondary;
    
    if (marketplaceRules && marketplaceRules.categories && marketplaceRules.categories.length > 0) {
       // Just a simple validation that the AI picked a valid category from the allowed list
       const allowedLower = marketplaceRules.categories.map((c: string) => c.toLowerCase());
       if (!allowedLower.includes(primary.toLowerCase())) {
          finalPrimary = marketplaceRules.categories[0];
          confidence -= 10;
       }
    }

    return {
      primaryCategory: finalPrimary || 'General',
      secondaryCategory: finalSecondary || 'Backgrounds/Textures',
      commercialSector: sector,
      confidenceScore: Math.min(99, confidence + (context.commercialIntentScore || 0) * 0.1)
    };
  }
}

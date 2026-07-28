import { BenchmarkAsset } from './types';
import { SeoEngine } from '../seo-engine';
import { MARKETPLACE_KNOWLEDGE } from '../knowledge';

export class DeterminismEngine {
  public static async testDeterminism(asset: BenchmarkAsset, iterations: number = 5): Promise<number> {
    const results: string[] = [];
    const mpRule = MARKETPLACE_KNOWLEDGE[asset.marketplace] || MARKETPLACE_KNOWLEDGE['general'];
    
    for (let i = 0; i < iterations; i++) {
      // Create a unique fileId to bypass caching for pure logic determinism,
      // but keeping identical input data to test algorithm stability.
      const options: any = {
        fileId: `${asset.id}_det_${i}`,
        fileName: asset.fileName,
        fileType: asset.assetType,
        marketplaceRule: mpRule,
        settings: {
          titleLength: mpRule.keywordLimit > 40 ? 70 : 50,
          keywordsCount: mpRule.keywordLimit,
          autoTransparentPngTag: asset.assetType === 'Transparent'
        },
        benchmarkMode: true
      };
      
      const res = await SeoEngine.generateMetadata(options);
      
      // Serialize Title + Keywords + Score for strict deterministic hashing
      const signature = JSON.stringify({
        title: res.title,
        keywords: res.keywords,
        score: res.scores.seoScore
      });
      
      results.push(signature);
    }
    
    const uniqueSignatures = new Set(results);
    
    // If there is only 1 unique signature across all N runs, determinism is 100%
    if (uniqueSignatures.size === 1) return 100;
    
    // Calculate a rough score based on variance
    return Math.max(0, 100 - (uniqueSignatures.size - 1) * 20);
  }
}

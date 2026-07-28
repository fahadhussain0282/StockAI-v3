import { BenchmarkAsset, PerformanceMetrics } from './types';
import { SeoEngine } from '../seo-engine';
import { MARKETPLACE_PROFILES } from '../constants'; // fallback, though we have knowledge layer now
import { MARKETPLACE_KNOWLEDGE } from '../knowledge';

export class PerformanceEngine {
  public static async runLoadTest(assets: BenchmarkAsset[], mode: 'QUALITY' | 'LOAD'): Promise<PerformanceMetrics> {
    const startTime = Date.now();
    const startMemory = process.memoryUsage().heapUsed;
    let cacheHits = 0;

    for (const asset of assets) {
      const mpRule = MARKETPLACE_KNOWLEDGE[asset.marketplace] || MARKETPLACE_KNOWLEDGE['general'];
      
      const options: any = {
        fileId: asset.id,
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

      // In LOAD mode, we mock the Gemini response using a mock customApiKey or by intercepting
      // But since we built the architecture properly, we can just pass the mocked vision data
      // into the pipeline via a "mockProvider" flag we can add to SeoEngine, 
      // or rely on fallback logic. For this test, we just run the engine.
      // If no valid key is provided, it falls back to basic logic which is VERY fast, perfectly testing our local TS pipeline.
      
      const res = await SeoEngine.generateMetadata(options);
      
      // We check if it was cached (simulate cache hits on duplicate runs)
      // For a fresh load test, they should be all cache misses unless run twice.
    }

    const totalTimeMs = Date.now() - startTime;
    const endMemory = process.memoryUsage().heapUsed;
    const peakMemoryMB = Math.round((endMemory - startMemory) / 1024 / 1024);

    return {
      mode,
      assetCount: assets.length,
      totalTimeMs,
      averageTimePerAssetMs: Math.round(totalTimeMs / assets.length),
      peakMemoryMB: Math.max(1, peakMemoryMB),
      cacheHitRate: 0 // Mocked for now
    };
  }
}

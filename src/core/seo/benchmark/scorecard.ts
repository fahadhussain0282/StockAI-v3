import { BenchmarkReport } from './types';
import { calculateGrade } from './utils';

export class ScorecardGenerator {
  public static generateTerminalReport(report: BenchmarkReport): string {
    return `
====================================================
           STOCKAI SEO BENCHMARK REPORT             
====================================================

Assets Tested: ${report.assetsTested}
Passed: ${report.passedCount}
Failed: ${report.failedCount}

--- AVERAGE QUALITY METRICS ---
Average SEO Score:          ${Math.round(report.averageSeoScore)}
Average Commercial Intent:  ${Math.round(report.averageCommercialIntent)}
Average Keyword Quality:    ${Math.round(report.averageKeywordQuality)}
Average Title Quality:      ${Math.round(report.averageTitleQuality)}

--- MARKETPLACE COMPATIBILITY ---
Adobe Stock:                ${Math.round(report.adobeCompatibility)}
Shutterstock:               ${Math.round(report.shutterstockCompatibility)}
Freepik:                    ${Math.round(report.freepikCompatibility)}
Vecteezy:                   ${Math.round(report.vecteezyCompatibility)}
Pond5:                      ${Math.round(report.pond5Compatibility)}

--- PERFORMANCE ---
Mode:                       ${report.performance.mode}
Average Processing Time:    ${report.performance.averageTimePerAssetMs} ms
Peak Memory Usage:          ${report.performance.peakMemoryMB} MB
Cache Hit Rate:             ${report.performance.cacheHitRate}%

--- ENGINE HEALTH ---
Determinism Score:          ${report.determinismScore}
Regression Status:          ${report.regressionStatus}

====================================================
FINAL OVERALL GRADE:        ${calculateGrade(report.averageSeoScore)}
====================================================
`;
  }
}

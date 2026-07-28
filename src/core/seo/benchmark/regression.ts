import { BenchmarkReport } from './types';
import { loadPreviousBenchmark } from './utils';

export class RegressionEngine {
  public static checkRegression(current: BenchmarkReport): 'PASS' | 'FAIL' {
    const previous = loadPreviousBenchmark();
    
    if (!previous) return 'PASS'; // No history to regress against

    // Fail if overall SEO score drops by more than 2 points
    if (previous.averageSeoScore - current.averageSeoScore > 2) {
      return 'FAIL';
    }

    // Fail if deterministic score drops
    if (current.determinismScore < previous.determinismScore) {
      return 'FAIL';
    }

    return 'PASS';
  }
}

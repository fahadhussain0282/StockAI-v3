import { AiDiagnosticsData } from './types';

class DiagnosticsTracker {
  private logs: AiDiagnosticsData[] = [];

  record(data: AiDiagnosticsData) {
    this.logs.unshift(data);
    if (this.logs.length > 100) {
      this.logs.pop(); // Keep last 100
    }
    if (process.env.AI_DEVELOPER_MODE === 'true') {
      this.printDeveloperLog(data);
    }
  }

  getLogs(): AiDiagnosticsData[] {
    return this.logs;
  }

  private printDeveloperLog(data: AiDiagnosticsData) {
    console.log('\n================================================================================');
    console.log('[AI DEVELOPER MODE - GATEWAY DIAGNOSTICS]');
    console.log(`Provider: ${data.providerUsed} | Model: ${data.modelUsed}`);
    console.log(`Latency: ${data.latency}ms | Success: ${data.success}`);
    console.log(`Tokens: Prompt(${data.tokenUsage.prompt}) Completion(${data.tokenUsage.completion})`);
    if (!data.success) {
      console.log(`Error: ${data.error}`);
    }
    console.log('================================================================================\n');
  }
}

export const AiDiagnostics = new DiagnosticsTracker();

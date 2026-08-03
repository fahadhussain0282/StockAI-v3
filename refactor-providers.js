const fs = require('fs');
const path = require('path');

const providersDir = path.join(__dirname, 'src/core/ai/providers');
const files = fs.readdirSync(providersDir).filter(f => f.endsWith('.ts') && f !== 'base-provider.ts' && f !== 'index.ts');

for (const file of files) {
  const filePath = path.join(providersDir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  // 1. Rename generateVisionAnalysis to generateMetadata
  if (content.includes('generateVisionAnalysis(')) {
    content = content.replace(/async generateVisionAnalysis\(/g, 'async generateMetadata(');
  }

  // 2. Add generateKeywords if missing
  if (!content.includes('async generateKeywords(')) {
    const keywordStub = `
  async generateKeywords(options: GenerateVisionOptions): Promise<string[]> {
    const meta = await this.generateMetadata(options);
    return meta.parsedResponse?.keywords || [];
  }
`;
    // Find the end of the class
    content = content.replace(/\n\}\s*$/, `\n${keywordStub}\n}\n`);
  }

  // 3. Add healthCheck if missing
  if (!content.includes('async healthCheck(')) {
    const healthStub = `
  async healthCheck(): Promise<{ isHealthy: boolean; message: string; latency: number }> {
    const start = Date.now();
    try {
      const key = process.env[this.id.toUpperCase() + '_API_KEY'] || '';
      const res = await this.validateKey(key);
      return { isHealthy: res.valid, message: res.message, latency: Date.now() - start };
    } catch (e: any) {
      return { isHealthy: false, message: e.message, latency: Date.now() - start };
    }
  }
`;
    content = content.replace(/\n\}\s*$/, `\n${healthStub}\n}\n`);
  }

  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Refactored ${file}`);
}

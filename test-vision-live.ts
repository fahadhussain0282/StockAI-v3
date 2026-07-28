import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { SeoEngine } from './src/core/seo/seo-engine';
import { MARKETPLACE_PROFILES } from './src/core/seo/constants';

// Replace this with the actual artifact directory where the generated images were saved,
// or move the images to a local 'dataset' folder.
const DATASET_DIR = `C:/Users/MUHAMMAD AURANGZAIB/.gemini/antigravity-ide/brain/6f7927af-ded9-469e-b262-3c0aad5a1a1c/`;

const DATASET = [
  { name: 'Alarm Clock Icon.png', file: 'alarm_clock_icon_1785237755988.png' },
  { name: 'Golden Retriever.jpg', file: 'golden_retriever_1785237768669.png' },
  { name: 'Red Sports Car.jpg', file: 'red_sports_car_1785237778208.png' },
  { name: 'Pizza.jpg', file: 'pizza_1785237789429.png' },
  { name: 'Hospital.jpg', file: 'hospital_1785237800276.png' },
  { name: 'Mountain Landscape.jpg', file: 'mountain_landscape_1785237810593.png' },
  { name: 'Business Team Meeting.jpg', file: 'business_team_1785237821920.png' },
  { name: 'UI Icon Pack.png', file: 'ui_icon_pack_1785237831108.png' },
  { name: 'Transparent PNG Object.png', file: 'transparent_object_1785237840761.png' },
  { name: 'Flat Vector Illustration.png', file: 'flat_illustration_1785237848915.png' }
];

const PROVIDERS = ['google-gemini', 'groq', 'xai'];

function formatDate(date: Date) {
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}_${pad(date.getHours())}-${pad(date.getMinutes())}-${pad(date.getSeconds())}`;
}

async function runLiveValidation() {
  console.log('================================================================================');
  console.log('FINAL VISION VALIDATION - ENTERPRISE AI GATEWAY');
  console.log('================================================================================');

  const timestamp = formatDate(new Date());
  const reportDir = path.join(process.cwd(), 'reports', 'vision-validation', timestamp);
  fs.mkdirSync(reportDir, { recursive: true });

  const allResults: any[] = [];
  const failures: any[] = [];
  const latencyMap: Record<string, any> = {};

  for (const provider of PROVIDERS) {
    console.log(`\n\n>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>`);
    console.log(`TESTING PROVIDER: ${provider.toUpperCase()}`);
    console.log(`>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>`);
    
    for (const image of DATASET) {
      const fullPath = path.join(DATASET_DIR, image.file);
      
      if (!fs.existsSync(fullPath)) {
        console.error(`[SKIP] Image not found: ${fullPath}. Please ensure the dataset exists.`);
        failures.push({ image: image.name, provider, error: 'Image not found' });
        continue;
      }

      console.log(`\n--------------------------------------------------------------------------------`);
      console.log(`[TESTING IMAGE] ${image.name}`);
      console.log(`--------------------------------------------------------------------------------`);
      
      const buffer = fs.readFileSync(fullPath);
      const base64Data = `data:image/png;base64,${buffer.toString('base64')}`;

      const t0 = Date.now();
      try {
        const result = await SeoEngine.generateMetadata({
          fileName: image.name,
          fileType: image.name.split('.').pop(),
          base64Data, 
          provider,
          settings: {
            titleLength: 70,
            keywordsCount: 30,
            developerMode: true
          },
          marketplaceRule: {
            id: 'general',
            name: 'General Stock',
            titleMaxLength: 70,
            keywordMaxCount: 30,
            categories: ['General'],
            profile: MARKETPLACE_PROFILES['general']
          } as any
        });

        const totalTime = Date.now() - t0;
        const diagLogs = (await import('./src/core/ai')).AiGateway.getDiagnostics();
        const lastDiag = diagLogs[0]; // Assuming it's the latest

        const reportData = {
          imageName: image.name,
          provider,
          model: lastDiag?.modelUsed || 'unknown',
          visionLatency: lastDiag?.latency || 0,
          totalGenerationTime: totalTime,
          rawVisionDetection: lastDiag ? 'Logged in JSON' : 'None',
          parsedObjects: result.visionAnalysis.sharedContext?.dominantObjects || [],
          parsedStyle: result.visionAnalysis.sharedContext?.visualStyle || '',
          parsedContext: result.visionAnalysis.sharedContext?.purpose || '',
          generatedTitle: result.title,
          generatedDescription: result.description,
          generatedKeywords: result.keywords,
          generatedCategories: [result.primaryCategory, result.secondaryCategory],
          seoScore: result.scores.seoScore,
          commercialIntent: result.commercialOpportunity?.opportunityScore,
          tokenUsage: lastDiag?.tokenUsage || {},
          success: true
        };
        allResults.push(reportData);

        // Failure detection on content
        if (result.title.toLowerCase().includes('abstract') && !image.name.toLowerCase().includes('flat')) {
          // just an example of generic detection
        }
        if (reportData.parsedStyle === 'Modern' && reportData.parsedContext === 'Marketing' && image.name === 'Golden Retriever.jpg') {
          failures.push({ image: image.name, provider, error: 'Fallback metadata detected!' });
        }
        if (!latencyMap[provider]) latencyMap[provider] = [];
        latencyMap[provider].push({ image: image.name, visionLatency: reportData.visionLatency, totalTime });

      } catch (err: any) {
        console.error(`\n[ERROR] Generation failed for ${image.name} using ${provider}:`, err.message);
        failures.push({ image: image.name, provider, error: err.message, success: false });
        allResults.push({ imageName: image.name, provider, success: false, error: err.message });
      }
    }
  }

  // Duplicate metadata detection
  const titles = new Set();
  const keywordsStr = new Set();
  for (const r of allResults) {
    if (r.success) {
      if (titles.has(r.generatedTitle)) {
        failures.push({ image: r.imageName, provider: r.provider, error: 'Duplicate metadata detected (Title)' });
      }
      titles.add(r.generatedTitle);
      
      const keyStr = r.generatedKeywords.join(',');
      if (keywordsStr.has(keyStr)) {
        failures.push({ image: r.imageName, provider: r.provider, error: 'Duplicate metadata detected (Keywords)' });
      }
      keywordsStr.add(keyStr);
    }
  }

  // Write reports
  fs.writeFileSync(path.join(reportDir, 'report.json'), JSON.stringify(allResults, null, 2));
  fs.writeFileSync(path.join(reportDir, 'failures.json'), JSON.stringify(failures, null, 2));
  fs.writeFileSync(path.join(reportDir, 'latency.json'), JSON.stringify(latencyMap, null, 2));

  // Comparison
  const comparison: any = {};
  for (const img of DATASET) {
    comparison[img.name] = {};
    for (const p of PROVIDERS) {
      const res = allResults.find(r => r.imageName === img.name && r.provider === p);
      if (res) {
        comparison[img.name][p] = {
          title: res.generatedTitle,
          keywords: res.generatedKeywords?.slice(0,5),
          categories: res.generatedCategories,
          seoScore: res.seoScore,
          latency: res.visionLatency,
          commercialIntent: res.commercialIntent
        };
      }
    }
  }
  fs.writeFileSync(path.join(reportDir, 'metadata-comparison.json'), JSON.stringify(comparison, null, 2));

  // Markdown Report
  let md = `# Vision Validation Report\n\n## Comparison Table\n\n`;
  md += `| Image | Provider | Title | Categories | SEO Score | Latency |\n`;
  md += `|---|---|---|---|---|---|\n`;
  for (const img of DATASET) {
    for (const p of PROVIDERS) {
      const res = comparison[img.name]?.[p];
      if (res) {
        md += `| ${img.name} | ${p} | ${res.title} | ${res.categories?.join(', ')} | ${res.seoScore} | ${res.latency}ms |\n`;
      } else {
        md += `| ${img.name} | ${p} | FAILED | N/A | N/A | N/A |\n`;
      }
    }
  }
  fs.writeFileSync(path.join(reportDir, 'report.md'), md);

  // Health Stats
  const { AiGateway } = await import('./src/core/ai');
  const healthStats = AiGateway.getHealth();
  fs.writeFileSync(path.join(reportDir, 'provider-health.json'), JSON.stringify(healthStats, null, 2));

  // Summary
  const summary = {
    totalTests: DATASET.length * PROVIDERS.length,
    successful: allResults.filter(r => r.success).length,
    failed: failures.length,
    timestamp
  };
  fs.writeFileSync(path.join(reportDir, 'summary.json'), JSON.stringify(summary, null, 2));

  console.log(`\n================================================================================`);
  console.log(`REPORTS GENERATED SUCCESSFULLY in: ${reportDir}`);
  console.log(`================================================================================`);
  
  if (failures.length > 0) {
    console.error(`\n[WARNING] Found ${failures.length} failures. See failures.json for details.`);
  }
}

runLiveValidation().catch(console.error);

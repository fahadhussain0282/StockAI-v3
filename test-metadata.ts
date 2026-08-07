import 'dotenv/config';
import { SeoEngine } from './src/core/seo';
import { ApiKeyManager } from './src/core/auth';
import { getDb, isDbAvailable } from './src/core/db/client';

async function testLiveGeneration() {
  console.log('Testing live metadata generation via SeoEngine...');
  
  // Need to seed keys to Gateway
  const { ApiKeyManager: AiKeyManager } = await import('./src/core/ai/api-key-manager');
  AiKeyManager.seedFromEnvironment();
  
  try {
    const { MARKETPLACE_REGISTRY } = await import('./src/registries/marketplaces');
    const result = await SeoEngine.generateMetadata({
      fileId: 'test-file-123',
      fileName: 'test-commercial-photo.jpg', 
      fileType: 'image/jpeg', 
      base64Data: '',
      provider: 'google-gemini',
      marketplaceRule: MARKETPLACE_REGISTRY['adobe-stock'],
      settings: {
        keywordsCount: 49,
        targetPlatform: 'adobe-stock'
      }
    });
    
    console.log('Success!', JSON.stringify(result, null, 2));
  } catch (error: any) {
    console.error('Error generating metadata:', error);
  }
}

testLiveGeneration().catch(console.error);


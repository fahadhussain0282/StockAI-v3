const https = require('https');

function fetchModels(url, headers) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers }, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

async function verify() {
  try {
    const orModels = await fetchModels('https://openrouter.ai/api/v1/models', {});
    const orFree = orModels.data.filter(m => m.pricing?.prompt === "0" || m.pricing?.prompt === "0.0").map(m => m.id);
    console.log("OpenRouter Free Models Count:", orFree.length);
    console.log("Includes openrouter/free?", orModels.data.some(m => m.id === 'openrouter/free' || m.id === 'openrouter/auto'));
    console.log("Includes meta-llama/llama-3.2-11b-vision-instruct:free?", orFree.includes('meta-llama/llama-3.2-11b-vision-instruct:free'));
    
    const togModels = await fetchModels('https://api.together.xyz/v1/models', {
        // Need an API key for Together? Let's try without first, some providers allow fetching models publically
    });
    console.log("Together Models Count:", togModels.length || (togModels.data && togModels.data.length) || togModels);
    
  } catch (e) {
    console.error(e);
  }
}
verify();

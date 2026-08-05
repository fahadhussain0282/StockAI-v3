const fs = require('fs');
const lines = fs.readFileSync('vercel_logs.json', 'utf8').split('\n').filter(Boolean);
for (const line of lines) {
  try {
    const log = JSON.parse(line);
    if (log.message) {
      console.log(log.message);
    }
  } catch (e) {}
}

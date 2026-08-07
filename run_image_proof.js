const fs = require('fs');
const sharp = require('sharp');
const path = require('path');

async function run() {
  const formats = ['jpg', 'png', 'webp', 'svg', 'eps'];
  
  // Create sample 1000x1000 images
  const sampleData = Buffer.from(
    '<svg width="1000" height="1000"><rect width="1000" height="1000" fill="blue"/><circle cx="500" cy="500" r="400" fill="red"/></svg>'
  );

  console.log("format | original bytes | optimized bytes | base64 bytes | compression % | processing time (ms)");
  console.log("-------|----------------|-----------------|--------------|---------------|-----------------------");

  for (const ext of formats) {
    const file = path.join(__dirname, `sample.${ext}`);
    
    // Generate dummy files
    if (ext === 'svg') {
      fs.writeFileSync(file, sampleData);
    } else if (ext === 'eps') {
      fs.writeFileSync(file, '%!PS-Adobe-3.0 EPSF-3.0\n%%BoundingBox: 0 0 1000 1000\n1000 1000 scale 0 0 1 setrgbcolor 0 0 1 1 rectfill\nshowpage');
    } else {
      await sharp(sampleData).toFormat(ext === 'jpg' ? 'jpeg' : ext).toFile(file);
    }

    const origBuffer = fs.readFileSync(file);
    const origBytes = origBuffer.length;
    
    const startTime = Date.now();
    let optBuffer;
    
    // Simulate App.tsx logic
    if (ext === 'svg' || ext === 'eps') {
      // SVG/EPS not compressed
      optBuffer = origBuffer;
    } else {
      // Image compressed to JPEG 80% (like canvas.toDataURL('image/jpeg', 0.8))
      optBuffer = await sharp(origBuffer)
        .jpeg({ quality: 80 })
        .toBuffer();
    }
    
    const time = Date.now() - startTime;
    const optBytes = optBuffer.length;
    
    let base64 = "";
    if (ext === 'svg' || ext === 'eps') {
      base64 = `data:image/${ext};base64,${optBuffer.toString('base64')}`;
    } else {
      base64 = `data:image/jpeg;base64,${optBuffer.toString('base64')}`;
    }
    const b64Bytes = Buffer.byteLength(base64, 'utf8');
    const compPct = ((origBytes - optBytes) / origBytes * 100).toFixed(2);
    
    console.log(`${ext.padEnd(6)} | ${origBytes.toString().padEnd(14)} | ${optBytes.toString().padEnd(15)} | ${b64Bytes.toString().padEnd(12)} | ${(ext==='svg'||ext==='eps' ? 'N/A' : compPct + '%').padEnd(13)} | ${time}`);
  }
}
run().catch(console.error);

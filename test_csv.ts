import { generateMarketplaceCSV } from './src/services/csvnest/exporter';
import * as fs from 'fs';

const mockItems = [
  {
    fileId: 'photo_1.jpg',
    title: 'A beautiful sunset over the mountains',
    description: 'A beautiful sunset over the mountains with red and orange sky',
    keywords: ['sunset', 'mountain', 'nature', 'landscape', 'beautiful', 'orange', 'sky'],
    primaryCategory: 'Nature',
    secondaryCategory: 'Landscapes',
    editorial: false,
    modelReleaseRequired: false,
    propertyReleaseRequired: false
  },
  {
    fileId: 'vector_2.eps',
    title: 'Abstract geometric background "with quotes"',
    description: 'Abstract geometric background "with quotes" and multiple\nlines\nof description, commas, and special chars &!@',
    keywords: ['abstract', 'geometric', 'background', '"quotes"', 'comma, inside'],
    primaryCategory: 'Backgrounds',
    secondaryCategory: 'Abstract',
    editorial: true,
    modelReleaseRequired: false,
    propertyReleaseRequired: false
  }
];

function run() {
  const adobe = generateMarketplaceCSV(mockItems as any, 'adobe-stock');
  const freepik = generateMarketplaceCSV(mockItems as any, 'freepik');
  const shutterstock = generateMarketplaceCSV(mockItems as any, 'shutterstock');
  const pond5 = generateMarketplaceCSV(mockItems as any, 'pond5');

  const addBOM = (csv: string) => '\uFEFF' + csv;

  fs.writeFileSync('adobe_sample.csv', addBOM(adobe), 'utf8');
  fs.writeFileSync('freepik_sample.csv', addBOM(freepik), 'utf8');
  fs.writeFileSync('shutterstock_sample.csv', addBOM(shutterstock), 'utf8');
  fs.writeFileSync('pond5_sample.csv', addBOM(pond5), 'utf8');

  console.log('--- ADOBE STOCK CSV ---');
  console.log(adobe);
  console.log('\n--- FREEPIK CSV ---');
  console.log(freepik);
  console.log('\n--- SHUTTERSTOCK CSV ---');
  console.log(shutterstock);
}

run();

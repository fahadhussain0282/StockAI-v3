import { generateMarketplaceCSV } from './src/services/csvnest/exporter';
import * as fs from 'fs';

const mockItems = [
  {
    fileId: 'photo_1.jpg',
    title: 'A beautiful sunset, "with quotes"',
    description: 'A beautiful sunset over the mountains\nwith multiple lines,\nquotes like "this" and commas.',
    keywords: ['sunset', 'mountain', 'nature', '"quotes"', 'comma, inside'],
    primaryCategory: 'Nature',
    editorial: false,
    modelReleaseRequired: false,
    propertyReleaseRequired: false
  },
  {
    fileId: 'photo_2.jpg',
    title: 'Unicode test \u00A9 \u00AE \u2122',
    description: 'Emoji \uD83D\uDE00\uD83D\uDE80 Arabic: \u0645\u0631\u062D\u0628\u0627 Chinese: \u4F60\u597D',
    keywords: ['unicode', 'emoji\uD83D\uDE80', '\u0639\u0631\u0628\u064A', '\u4E2D\u6587'],
    primaryCategory: 'Culture',
    editorial: true,
    modelReleaseRequired: false,
    propertyReleaseRequired: false
  }
];

function run() {
  const adobe = generateMarketplaceCSV(mockItems as any, 'adobe-stock');
  const addBOM = (csv: string) => '\uFEFF' + csv;
  fs.writeFileSync('adobe_proof.csv', addBOM(adobe), 'utf8');
  console.log('CSV successfully generated with multiline, emojis, quotes, commas, unicode, arabic, chinese.');
  console.log(adobe);
}

run();

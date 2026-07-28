import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { BenchmarkReport } from './types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function calculateGrade(score: number): string {
  if (score >= 98) return 'A+';
  if (score >= 95) return 'A';
  if (score >= 90) return 'A-';
  if (score >= 85) return 'B+';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  return 'F';
}

export function saveBenchmarkHistory(report: BenchmarkReport) {
  const historyDir = path.join(__dirname, 'history');
  if (!fs.existsSync(historyDir)) {
    fs.mkdirSync(historyDir, { recursive: true });
  }

  const dateStr = new Date().toISOString().split('T')[0];
  const latestPath = path.join(historyDir, 'latest.json');
  const datePath = path.join(historyDir, `${dateStr}.json`);

  const data = JSON.stringify(report, null, 2);
  fs.writeFileSync(latestPath, data);
  fs.writeFileSync(datePath, data);
}

export function loadPreviousBenchmark(): BenchmarkReport | null {
  const latestPath = path.join(__dirname, 'history', 'latest.json');
  if (fs.existsSync(latestPath)) {
    return JSON.parse(fs.readFileSync(latestPath, 'utf8'));
  }
  return null;
}

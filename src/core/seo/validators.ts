export function sanitizeFileName(rawFileName: string): string {
  if (!rawFileName) return 'Commercial Stock Visual Asset';

  let name = rawFileName
    .replace(/\.[a-zA-Z0-9]+$/, '') // Strip extension
    .replace(/[-_]+/g, ' ') // Convert hyphens and underscores to spaces
    .replace(/\b(IMG|DSC|DCIM|MOV|VID|RAW|PHOTO|IMAGE|FILE|TEMP|UPLOAD|STOCK|ASSET|DESIGN|EXPORT|COPY|DRAFT)[_ -]?\b/gi, '') // Strip camera/upload prefixes
    .replace(/\b\d{4}[-_.]?\d{2}[-_.]?\d{2}[-_.]?\d*\b/g, '') // Strip date/timestamps (e.g. 202607261018)
    .replace(/\b\d{3,}\b/g, '') // Strip standalone digits (3+ digits)
    .replace(/\bv\d+\b/gi, '') // Strip version numbers v1, v2
    .replace(/\b[a-f0-9]{8,}\b/gi, ''); // Strip random hex hashes

  const words = name
    .trim()
    .split(/\s+/)
    .filter(w => {
      const clean = w.toLowerCase();
      if (/^\d+$/.test(clean)) return false;
      if (clean.length < 2) return false;
      return true;
    })
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());

  if (words.length === 0) {
    return 'Commercial Stock Visual Asset';
  }

  return words.join(' ');
}

export function sanitizeGeneratedText(text: string): string {
  if (!text) return '';
  return text
    .replace(/\b\d{8,14}\b/g, '') // Remove 8-14 digit timestamps (e.g. 202607261018)
    .replace(/\b\d{4}[-_.]\d{2}[-_.]\d{2}\b/g, '') // Remove YYYY-MM-DD
    .replace(/\b(IMG|DSC|DCIM|VID|RAW|FILE|TEMP|UPLOAD)[-_]?\d+\b/gi, '') // Remove IMG_0001, DSC8831
    .replace(/\.(jpeg|jpg|png|eps|svg|tiff|gif|ai|psd)\b/gi, '') // Remove file extension mentions
    .replace(/\b\d{5,}\b/g, '') // Remove random 5+ digit numbers
    .replace(/\s+/g, ' ')
    .replace(/\s+([,.:;-])/g, '$1')
    .trim();
}

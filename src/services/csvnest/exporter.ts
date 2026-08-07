import { MetadataResult, MarketplaceRule } from '../../types';
import { MARKETPLACE_REGISTRY } from '../../registries/marketplaces';

/**
 * Escapes a field for CSV compliance
 */
function escapeCsvField(field: string | number | boolean | undefined | null): string {
  if (field === undefined || field === null) return '""';
  const str = String(field).trim();
  // Escape inner double quotes by doubling them
  const escaped = str.replace(/"/g, '""');
  return `"${escaped}"`;
}

/**
 * Converts a list of MetadataResult objects into a compliant CSV string for a specific marketplace
 */
export function generateMarketplaceCSV(
  items: MetadataResult[],
  targetMarketplace: string = 'general'
): string {
  const rule: MarketplaceRule = MARKETPLACE_REGISTRY[targetMarketplace as keyof typeof MARKETPLACE_REGISTRY] || MARKETPLACE_REGISTRY.general;
  const headers = rule.csvColumns;

  const rows: string[] = [];
  // Header row
  rows.push(headers.map(escapeCsvField).join(','));

  for (const item of items) {
    const filename = item.fileId || 'asset.jpg';
    const title = item.title || '';
    const description = item.description || title;
    const keywordsStr = item.keywords.join(', ');
    const primaryCategory = item.primaryCategory || 'General';

    let rowData: string[] = [];

    switch (rule.id) {
      case 'adobe-stock':
        // Filename, Title, Keywords, Category, Releases
        rowData = [
          filename,
          title.slice(0, rule.titleMaxLength),
          keywordsStr,
          primaryCategory,
          '' // Releases
        ];
        break;

      case 'shutterstock':
        // Filename, Description, Keywords, Categories, Editorial, Illustration, Mature Content
        rowData = [
          filename,
          description.slice(0, rule.titleMaxLength),
          keywordsStr,
          item.secondaryCategory ? `${primaryCategory}, ${item.secondaryCategory}` : primaryCategory,
          item.editorial ? 'Yes' : 'No',
          item.fileId.endsWith('.svg') || item.fileId.endsWith('.eps') ? 'Yes' : 'No',
          'No'
        ];
        break;

      case 'freepik':
        // Filename, Title, Keywords
        rowData = [
          filename,
          title.slice(0, rule.titleMaxLength),
          keywordsStr
        ];
        break;

      case 'vecteezy':
        // Filename, Title, Description, Keywords, License Type
        rowData = [
          filename,
          title.slice(0, rule.titleMaxLength),
          description,
          keywordsStr,
          'Free'
        ];
        break;

      case 'pond5':
        // OriginalFilename, Title, Description, Keywords, Category, Price, ModelRelease, PropertyRelease
        rowData = [
          filename,
          title.slice(0, rule.titleMaxLength),
          description,
          keywordsStr,
          primaryCategory,
          '0',
          item.modelReleaseRequired ? 'Yes' : 'No',
          item.propertyReleaseRequired ? 'Yes' : 'No'
        ];
        break;

      case 'general':
      default:
        // Filename, Title, Description, Keywords, Categories
        rowData = [
          filename,
          title,
          description,
          keywordsStr,
          item.secondaryCategory ? `${primaryCategory} / ${item.secondaryCategory}` : primaryCategory
        ];
        break;
    }

    rows.push(rowData.map(escapeCsvField).join(','));
  }

  return '\uFEFF' + rows.join('\r\n');
}

/**
 * Exports metadata in JSON format
 */
export function generateMetadataJSON(items: MetadataResult[]): string {
  return JSON.stringify(items, null, 2);
}

/**
 * Exports metadata in plain text copyable format
 */
export function generateMetadataTXT(items: MetadataResult[]): string {
  return items
    .map((item, idx) => {
      return `FILE #${idx + 1}: ${item.fileId}
TITLE: ${item.title}
DESCRIPTION: ${item.description}
KEYWORDS (${item.keywords.length}): ${item.keywords.join(', ')}
CATEGORY: ${item.primaryCategory} ${item.secondaryCategory ? `/ ${item.secondaryCategory}` : ''}
--------------------------------------------------`;
    })
    .join('\n\n');
}

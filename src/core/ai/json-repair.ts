export class JSONRepair {
  /**
   * Attempts to parse and repair malformed JSON strings from AI models.
   */
  static parse(text: string, defaultOutput: any = {}): any {
    if (!text || text.trim().length === 0) return defaultOutput;
    
    let cleaned = text.trim();

    // 1. Strip markdown fences if present
    if (cleaned.startsWith('\`\`\`')) {
      cleaned = cleaned.replace(/^\`\`\`json/i, '').replace(/^\`\`\`/, '');
      cleaned = cleaned.replace(/\`\`\`$/, '');
    }

    // 2. Try native parse first
    try {
      return JSON.parse(cleaned.trim());
    } catch (e) {
      // Continue to repair
    }

    // 3. Extract anything between the first { and last }
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      cleaned = jsonMatch[0];
      try {
        return JSON.parse(cleaned);
      } catch (e) {
        // Continue to aggressive repair
      }
    }

    // 4. Aggressive repairs
    try {
      // Fix unquoted keys
      cleaned = cleaned.replace(/([{,]\s*)([a-zA-Z0-9_]+)\s*:/g, '$1"$2":');
      
      // Fix trailing commas
      cleaned = cleaned.replace(/,\s*([}\]])/g, '$1');
      
      // Fix single quotes to double quotes (naive but often works)
      cleaned = cleaned.replace(/'/g, '"');
      
      // Fix newlines inside strings (very naive)
      cleaned = cleaned.replace(/:\s*"([^"]*)"/g, (match, p1) => {
        return ': "' + p1.replace(/\n/g, '\\n') + '"';
      });

      return JSON.parse(cleaned);
    } catch (e) {
      // If all fails, return default
      return defaultOutput;
    }
  }

  /**
   * Normalizes the AI output to ensure exactly 49 keywords and proper structure.
   */
  static normalizeMetadata(parsed: any): any {
    if (!parsed) return {};
    
    const result = {
      title: parsed.title || parsed.Title || '',
      description: parsed.description || parsed.Description || '',
      keywords: parsed.keywords || parsed.Keywords || [],
      category: parsed.category || parsed.Category || parsed.adobeCategory || 1
    };

    if (typeof result.title !== 'string') result.title = String(result.title);
    if (typeof result.description !== 'string') result.description = String(result.description);
    
    if (typeof result.keywords === 'string') {
      result.keywords = result.keywords.split(',').map((k: string) => k.trim());
    }

    if (Array.isArray(result.keywords)) {
      // Remove duplicates and empty strings
      let unique = [...new Set(result.keywords.filter(Boolean))];
      
      // Enforce EXACTLY 49 keywords
      if (unique.length > 49) {
        unique = unique.slice(0, 49);
      } else if (unique.length < 49) {
        let padIndex = 1;
        while (unique.length < 49) {
          unique.push(`stock_image_${padIndex++}`);
        }
      }
      result.keywords = unique;
    } else {
      result.keywords = Array.from({length: 49}, (_, i) => `stock_image_${i+1}`);
    }

    return result;
  }
}

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
   * Normalizes the AI output structure (deduplication, type coercions).
   * NOTE: Keyword count enforcement is done by KeywordEngine.ensureExactKeywordCount in the SEO engine.
   * This method only cleans up structure — it does NOT pad with placeholder keywords.
   */
  static normalizeMetadata(parsed: any): any {
    if (!parsed) return {};

    const result = {
      title: parsed.title || parsed.Title || '',
      description: parsed.description || parsed.Description || '',
      keywords: parsed.keywords || parsed.Keywords || [],
      primaryCategory: parsed.primaryCategory || parsed.category || parsed.Category || '',
      secondaryCategory: parsed.secondaryCategory || '',
      sharedContext: parsed.sharedContext || {}
    };

    if (typeof result.title !== 'string') result.title = String(result.title);
    if (typeof result.description !== 'string') result.description = String(result.description);

    if (typeof result.keywords === 'string') {
      result.keywords = result.keywords.split(',').map((k: string) => k.trim()).filter(Boolean);
    }

    if (Array.isArray(result.keywords)) {
      // Deduplicate and remove empty strings — do NOT pad (SEO engine handles padding)
      result.keywords = [...new Set(result.keywords.filter(Boolean))];
      // Cap at max 49 to prevent over-generation
      if (result.keywords.length > 49) {
        result.keywords = result.keywords.slice(0, 49);
      }
    } else {
      result.keywords = [];
    }

    return result;
  }

}

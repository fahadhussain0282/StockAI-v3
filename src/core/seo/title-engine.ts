import { GENERIC_TITLE_PHRASES } from './constants';
import { sanitizeGeneratedText } from './validators';
import { SharedMetadataContext } from './types';

export class TitleEngine {
  public static sanitizeTitle(rawTitle: string, defaultFallback: string = 'Commercial Visual Design Asset'): string {
    if (!rawTitle) return defaultFallback;

    let title = sanitizeGeneratedText(rawTitle);

    // Remove known marketing suffixes, hardcoded templates & stock filler phrases
    title = title
      .replace(/\s*[-_–—|:]\s*(High Quality Commercial Stock Asset|High Quality Commercial Asset|High Quality Commercial Image|Commercial Stock Asset|Commercial Stock Concept|Stock Photo|Stock Asset|High Quality|Stock Visual Asset)\b/gi, '')
      .replace(/\b(High Quality Commercial Stock Asset|High Quality Commercial Asset|High Quality Commercial Image|Commercial Stock Asset|Commercial Stock Concept)\b/gi, '')
      .replace(/\s*[-_–—|:]\s*$/g, '') // Remove trailing hyphens/dashes/pipes/colons
      .replace(/^\s*[-_–—|:]\s*/g, '') // Remove leading hyphens/dashes/pipes/colons
      .replace(/\s{2,}/g, ' ') // Collapse multiple spaces
      .replace(/[-_–—]{2,}/g, '-') // Replace multiple hyphens with single
      .trim();

    // Strip trailing & leading punctuation separators (-, :, ;, ,, .)
    title = title.replace(/[-_–—|:,;.]\s*$/g, '').trim();
    title = title.replace(/^\s*[-_–—|:,;.]/g, '').trim();

    if (!title || title.length < 3) {
      return defaultFallback;
    }

    return title;
  }

  public static constructHumanWrittenTitle(context: SharedMetadataContext): string {
    // Structural Formula: [Primary Subject] + [Main Attribute] + [Style] + [Purpose] + [Background]
    const subject = context.primarySubject;
    const attribute = context.secondarySubjects.length > 0 ? `with ${context.secondarySubjects.slice(0, 2).join(' and ')}` : '';
    const style = context.visualStyle && context.visualStyle !== 'Unknown' ? `in ${context.visualStyle} style` : '';
    const purpose = context.purpose && context.purpose !== 'Unknown' ? `for ${context.purpose}` : '';
    const background = context.backgroundType !== 'Unknown' && context.backgroundType !== 'Isolated' && !context.isTransparent ? `on ${context.backgroundType} background` : '';

    const parts = [subject, attribute, style, purpose, background].filter(Boolean);
    const generatedTitle = parts.join(' ');
    
    // Fallback if it becomes too robotic or long
    const words = generatedTitle.split(/\s+/);
    if (words.length > 14) {
      return words.slice(0, 12).join(' ');
    }
    
    return this.sanitizeTitle(generatedTitle);
  }

  public static refineTitleToCommercialStandard(rawTitle: string, context: SharedMetadataContext, cleanFileName?: string): string {
    let title = this.sanitizeTitle(rawTitle, cleanFileName || 'Commercial Visual Stock Asset');

    const words = title.split(/\s+/).filter(Boolean);
    const titleLower = title.toLowerCase().trim();
    const isGeneric = GENERIC_TITLE_PHRASES.some(pat => titleLower === pat || titleLower === `a ${pat}` || titleLower === `an ${pat}`);

    // If title is already strong (>= 8 words, >= 45 chars, not generic), return it
    if (!isGeneric && words.length >= 6 && title.length >= 45) {
      return title;
    }

    // Attempt dynamic human-written construction
    let candidate = this.constructHumanWrittenTitle(context);
    let candidateWords = candidate.split(/\s+/).filter(Boolean);

    if (candidateWords.length < 6 || candidate.length < 45) {
       candidate = `Commercial ${context.primarySubject} ${context.visualStyle} design element for ${context.industry} projects`;
       candidateWords = candidate.split(/\s+/).filter(Boolean);
    }

    if (candidateWords.length > 14) {
      candidate = candidateWords.slice(0, 12).join(' ');
    }

    return this.sanitizeTitle(candidate, 'Professional Commercial Stock Asset for Digital Marketing');
  }
}

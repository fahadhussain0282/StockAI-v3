export const getTitlePrompt = (maxLength: number = 70): string => {
  return `2. TITLE GENERATION: Write a natural, human-readable commercial title. 
- MUST be 8-12 words long.
- MUST follow this structure: [Primary Subject] + [Main Attribute] + [Style] + [Purpose] + [Background].
- MUST sound like it was written by an experienced top stock contributor.
- NEVER sound robotic or AI-generated.
- NEVER start with generic phrases like "Abstract graphic of".
- Maximum ${maxLength} characters.`;
};

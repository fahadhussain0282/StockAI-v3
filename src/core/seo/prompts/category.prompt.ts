export const getCategoryPrompt = (categories: string[]) => `
5. CATEGORY PREDICTION: Choose primary and secondary categories from: [${categories.join(', ')}]. Ensure accuracy based on primary subject and industry.
`;

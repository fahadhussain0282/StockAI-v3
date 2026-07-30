export var getTitlePrompt = function (maxLength) {
    if (maxLength === void 0) { maxLength = 70; }
    return "2. TITLE GENERATION: Write a natural, human-readable commercial title. \n- MUST be 8-12 words long.\n- MUST follow this structure: [Primary Subject] + [Main Attribute] + [Style] + [Purpose] + [Background].\n- MUST sound like it was written by an experienced top stock contributor.\n- NEVER sound robotic or AI-generated.\n- NEVER start with generic phrases like \"Abstract graphic of\".\n- Maximum ".concat(maxLength, " characters.");
};

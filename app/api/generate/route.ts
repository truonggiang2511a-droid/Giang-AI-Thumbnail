const prompt = `Create a highly engaging, viral Vietnamese real-estate YouTube thumbnail background in 16:9 at 4K quality.

This is an EDIT/COMPOSITION task using real source photos. DO NOT invent facts, but MAXIMIZE VISUAL IMPACT for high Click-Through-Rate (CTR).

SOURCE PRIORITY:
1) Preserve exact person identity (if supplied). Enhance the subject with a subtle rim light, clear and expressive face, making them pop out from the background.
2) Preserve the exact property architecture (if supplied).

YOUTUBE CTR ENHANCEMENTS:
- Color & Contrast: Use vibrant, highly saturated colors. Boost the contrast significantly. Make the sky dramatic (e.g., golden hour or deep blue) to make the property look premium.
- Depth: Use a strong foreground-background separation. Keep the main subject (person/house) razor-sharp while slightly blurring distant backgrounds.
- Lighting: Add cinematic lighting or subtle sun flares to make the property highly desirable.
- Composition: Follow the rule of thirds. Leave a clear, intentionally darkened or clean negative space for the user's large Vietnamese text hook (DO NOT generate any text yourself).
- Direction: ${variantDirection[variant] || variantDirection.CURIOSITY}

CONTENT CONTEXT:
Video title: ${title}
Selected Hook: ${hook}
Style: ${style}
Property information: ${propertyInfo}

FINAL INSTRUCTION:
Create the most eye-catching, clickable thumbnail background possible from the sources. Prioritize vibrant lighting, emotional impact, and clear focal points. STRICTLY NO TEXT or watermarks.`;

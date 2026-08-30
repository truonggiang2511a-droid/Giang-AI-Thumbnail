import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

export const runtime = 'nodejs';

async function fileToPart(value: FormDataEntryValue | null) {
  if (!(value instanceof File) || !value.type.startsWith('image/')) return null;
  const bytes = Buffer.from(await value.arrayBuffer());
  return { type: 'image' as const, mime_type: value.type, data: bytes.toString('base64') };
}

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Thiếu GEMINI_API_KEY trong Vercel Environment Variables.' }, { status: 400 });
    }

    const form = await req.formData();
    const title = String(form.get('title') || '').slice(0, 200);
    const hook = String(form.get('hook') || '').slice(0, 120);
    const style = String(form.get('style') || 'BĐS Viral').slice(0, 80);
    const propertyInfo = String(form.get('propertyInfo') || '').slice(0, 5000);
    const personPart = await fileToPart(form.get('person'));
    const housePart = await fileToPart(form.get('house'));

    if (!personPart && !housePart) {
      return NextResponse.json({ error: 'Hãy upload ít nhất 1 ảnh MC hoặc căn nhà.' }, { status: 400 });
    }

    const prompt = `Create a professional Vietnamese real-estate YouTube thumbnail, 16:9, 4K.

IMPORTANT: Treat the supplied photos as source assets, not loose inspiration.
- PERSON REFERENCE: preserve the exact identity, facial structure, skin tone, hairstyle, clothing, and recognizable appearance. Do not invent a different person. Keep the face natural and photorealistic.
- PROPERTY REFERENCE: preserve the actual architecture, facade, windows, roof, proportions, materials, landscaping, and major visual features. Do not redesign the house or invent rooms.
- If only one reference is supplied, use it faithfully and build the composition around it.
- Blend the person and property naturally with realistic scale, perspective, shadows, and matching light direction.

THUMBNAIL ART DIRECTION:
- Designed for YouTube mobile feed first.
- One dominant visual story, instantly understandable within 1 second.
- Strong foreground/background separation, realistic depth, crisp subject edges.
- Use a bold cinematic but believable color grade; preserve true property colors.
- Leave a clean negative-space area for headline text; do NOT render headline text into the image.
- Avoid generic stock-photo aesthetics, fake luxury elements, fantasy architecture, excessive neon, plastic skin, distorted hands, duplicated objects, or clutter.
- Make the house the hero when property benefit is the key story; make the person the hero when emotion/curiosity is the key story.

CONTENT CONTEXT:
Video title: ${title}
Selected Hook: ${hook}
Style: ${style}
Property information: ${propertyInfo}

Generate a premium, photorealistic thumbnail background that visually supports the selected Hook while staying faithful to the supplied real photos. Do not add logos, fake text, fake prices, or unsupported claims.`;

    const ai = new GoogleGenAI({ apiKey });
    const inputs: any[] = [{ type: 'text', text: prompt }];
    if (personPart) inputs.push(personPart);
    if (housePart) inputs.push(housePart);

    const interaction = await ai.interactions.create({
      model: 'gemini-3-pro-image',
      input: inputs,
      response_format: {
        type: 'image',
        mime_type: 'image/png',
        aspect_ratio: '16:9',
        image_size: '4K',
      },
    });

    const image = interaction.output_image;
    if (!image?.data) {
      return NextResponse.json({ error: 'Gemini không trả về ảnh.' }, { status: 502 });
    }

    return NextResponse.json({
      imageData: `data:image/png;base64,${image.data}`,
      model: 'gemini-3-pro-image',
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'AI generation failed',
    }, { status: 500 });
  }
}

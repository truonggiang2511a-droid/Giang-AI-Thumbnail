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
    const variant = String(form.get('variant') || 'CURIOSITY').slice(0, 40);
    const propertyInfo = String(form.get('propertyInfo') || '').slice(0, 5000);
    const personPart = await fileToPart(form.get('person'));
    const housePart = await fileToPart(form.get('house'));

    if (!personPart && !housePart) {
      return NextResponse.json({ error: 'Hãy upload ít nhất 1 ảnh MC hoặc căn nhà.' }, { status: 400 });
    }

    const variantDirection: Record<string, string> = {
      'PRICE SHOCK': 'Visual story: lead with the most attractive verified price/value point. Make the property feel like a strong value discovery.',
      'LOCATION': 'Visual story: emphasize the real location benefit and travel convenience only when supported by the property information.',
      'CURIOSITY': 'Visual story: create a strong curiosity gap around one real, distinctive property feature without inventing facts.',
      'LIFESTYLE': 'Visual story: emphasize believable family living, comfort, space and lifestyle potential using only what is visibly supported.',
    };

    const prompt = `Create one premium Vietnamese real-estate YouTube thumbnail background in 16:9 at 4K quality.

This is an EDIT/COMPOSITION task using real source photos. The supplied photos are authoritative source assets.

SOURCE PRIORITY:
1) Preserve the exact real person identity if a person reference is supplied: face shape, recognizable facial features, skin tone, hairstyle, age appearance, clothing, and overall identity. Do not create a different person.
2) Preserve the exact real property if a property reference is supplied: facade, windows, roof, doors, proportions, materials, landscaping, colors, and recognizable architectural details. Do not redesign it.
3) Do not fabricate pools, extra floors, larger rooms, luxury furniture, impossible lighting, fake views, fake signage, fake logos, fake prices, or other unsupported facts.

COMPOSITION:
- ${variantDirection[variant] || variantDirection.CURIOSITY}
- Use strong foreground/background separation and natural depth.
- Keep realistic perspective and scale between person and property.
- Match light direction, color temperature, shadows and contrast between references.
- Make the main story understandable within about one second on a mobile YouTube feed.
- Create a premium, cinematic real-estate editorial look, but keep the actual property recognizable and believable.
- Leave intentional clean negative space for the headline; DO NOT render headline text into the image because the web app adds the Vietnamese text separately.
- Avoid generic stock photography, plastic skin, distorted anatomy, duplicate objects, excessive neon, extreme HDR, or fantasy architecture.

CONTENT CONTEXT:
Video title: ${title}
Selected Hook: ${hook}
Style: ${style}
Property information: ${propertyInfo}

FINAL INSTRUCTION:
Create the strongest thumbnail composition possible from the supplied real photos. Preserve the source identity and architecture first; optimize lighting, depth, framing, visual hierarchy and emotional impact second. No text or watermark-like additions.`;

    const ai = new GoogleGenAI({ apiKey });
    const inputs: any[] = [{ type: 'text', text: prompt }];
    if (personPart) inputs.push(personPart);
    if (housePart) inputs.push(housePart);

    const interaction = await ai.interactions.create({
      model: 'gemini-3-pro-image',
      input: inputs,
      response_format: {
        type: 'image',
        mime_type: 'image/jpeg',
        aspect_ratio: '16:9',
        image_size: '4K',
      },
    });

    const image = interaction.output_image;
    if (!image?.data) {
      return NextResponse.json({ error: 'Gemini không trả về ảnh.' }, { status: 502 });
    }

    return NextResponse.json({
      imageData: `data:image/jpeg;base64,${image.data}`,
      model: 'gemini-3-pro-image',
      variant,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'AI generation failed',
    }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

export const runtime = 'nodejs';

async function fileToPart(value: FormDataEntryValue | null) {
  if (!(value instanceof File) || !value.type.startsWith('image/')) return null;
  const bytes = Buffer.from(await value.arrayBuffer());
  return { type: 'image' as const, mime_type: value.type, data: bytes.toString('base64') };
}

const variantGuidance: Record<string, string> = {
  'PRICE SHOCK': 'Make the price the dominant curiosity trigger. Strong visual emphasis on value, premium property, bold contrast, but no added text.',
  'LOCATION': 'Make location and proximity feel visually important. Use depth and directional composition that suggests convenience and access, but no added text.',
  'CURIOSITY': 'Create a strong curiosity gap with an intriguing composition and one visually mysterious focal detail. Do not fabricate property features.',
  'LIFESTYLE': 'Emphasize aspirational family lifestyle, spaciousness, warmth and livability while preserving the real house architecture.',
};

export async function POST(req: Request) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: 'Thiếu GEMINI_API_KEY trong Vercel Environment Variables.' }, { status: 400 });
    }

    const form = await req.formData();
    const title = String(form.get('title') || '').slice(0, 200);
    const hook = String(form.get('hook') || '').slice(0, 120);
    const style = String(form.get('style') || 'BĐS Viral').slice(0, 60);
    const variant = String(form.get('variant') || 'CURIOSITY').slice(0, 40);
    const personPart = await fileToPart(form.get('person'));
    const housePart = await fileToPart(form.get('house'));

    if (!personPart && !housePart) {
      return NextResponse.json({ error: 'Hãy upload ít nhất 1 ảnh MC hoặc căn nhà.' }, { status: 400 });
    }

    const guidance = variantGuidance[variant] || variantGuidance.CURIOSITY;
    const inputs: any[] = [{
      type: 'text',
      text: `You are the visual director for a high-performing Vietnamese real-estate YouTube channel. Create a premium photorealistic YouTube thumbnail image, 16:9, 2K.
Video title: ${title}
Thumbnail hook: ${hook}
Style: ${style}
Variant: ${variant}
Variant direction: ${guidance}

Use supplied reference images faithfully. Preserve the real person's identity and the actual house architecture. Improve lighting, depth, composition, color grading and subject separation. Create a professional mobile-first thumbnail with one dominant focal story and intentional negative space where the headline will be overlaid later.

CRITICAL: do not render any words, letters, numbers, logos or watermark-like text into the generated image. Do not invent rooms, floors, pools, views, roads or amenities not visible in the references. Make the final visual feel premium, emotionally compelling and scroll-stopping.`
    }];

    if (personPart) inputs.push(personPart);
    if (housePart) inputs.push(housePart);

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const interaction = await ai.interactions.create({
      model: 'gemini-3.1-flash-image',
      input: inputs,
      response_format: { type: 'image', mime_type: 'image/png', aspect_ratio: '16:9', image_size: '2K' },
    });

    const image = interaction.output_image;
    if (!image?.data) return NextResponse.json({ error: 'Gemini không trả về ảnh.' }, { status: 502 });
    return NextResponse.json({ imageData: `data:image/png;base64,${image.data}`, model: 'gemini-3.1-flash-image', variant });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'AI generation failed' }, { status: 500 });
  }
}

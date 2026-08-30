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
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: 'Thiếu GEMINI_API_KEY trong Environment Variables của Vercel.' }, { status: 400 });
    }

    const form = await req.formData();
    const title = String(form.get('title') || '').slice(0, 200);
    const hook = String(form.get('hook') || '').slice(0, 120);
    const style = String(form.get('style') || 'BĐS Viral').slice(0, 60);
    const personPart = await fileToPart(form.get('person'));
    const housePart = await fileToPart(form.get('house'));

    if (!personPart && !housePart) {
      return NextResponse.json({ error: 'Hãy upload ít nhất 1 ảnh MC hoặc căn nhà.' }, { status: 400 });
    }

    const inputs: any[] = [{
      type: 'text',
      text: `Create a premium YouTube thumbnail background for a Vietnamese real-estate video. Aspect ratio 16:9. Style: ${style}. Video title: ${title}. Main hook concept: ${hook}. Use the supplied reference images faithfully: preserve the real person identity and the real house architecture. Compose the person and property naturally, with dramatic professional lighting, strong depth, crisp subject separation, clean negative space for a bold headline on the left or lower-left. No text, no logos, no watermark-like additions. Photorealistic, high-end YouTube thumbnail, designed to stop scrolling on mobile.`
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
    return NextResponse.json({ imageData: `data:image/png;base64,${image.data}`, model: 'gemini-3.1-flash-image' });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'AI generation failed' }, { status: 500 });
  }
}

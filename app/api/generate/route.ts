import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

export const runtime = 'nodejs';

function dataUrlToPart(dataUrl: string) {
  const match = dataUrl.match(/^data:(image\/[^;]+);base64,(.+)$/);
  if (!match) return null;
  return { type: 'image' as const, mime_type: match[1], data: match[2] };
}

export async function POST(req: Request) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: 'Thiếu GEMINI_API_KEY trong Environment Variables của Vercel.' }, { status: 400 });
    }

    const form = await req.formData();
    const title = String(form.get('title') || '');
    const hook = String(form.get('hook') || '');
    const style = String(form.get('style') || 'BĐS Viral');
    const person = form.get('person');
    const house = form.get('house');

    const inputs: any[] = [{ type: 'text', text: `Create a premium YouTube thumbnail background for a Vietnamese real-estate video. Aspect ratio 16:9. Style: ${style}. Video title: ${title}. Main hook concept: ${hook}. Use the supplied reference images faithfully: preserve the real person identity and the real house architecture. Compose the person and property naturally, with dramatic professional lighting, strong depth, crisp subject separation, clean negative space for a bold headline on the left or lower-left. No text, no logos, no watermark-like additions. Photorealistic, high-end YouTube thumbnail, designed to stop scrolling on mobile.` }];

    for (const item of [person, house]) {
      if (typeof item === 'string' && item.startsWith('data:image/')) {
        const part = dataUrlToPart(item);
        if (part) inputs.push(part);
      }
    }

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

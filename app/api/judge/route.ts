import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

export const runtime = 'nodejs';

const schema = {
  type: 'object',
  properties: {
    score: { type: 'integer' },
    strengths: { type: 'array', items: { type: 'string' } },
    weaknesses: { type: 'array', items: { type: 'string' } },
    recommendation: { type: 'string' },
  },
  required: ['score', 'strengths', 'weaknesses', 'recommendation'],
};

function dataUrlToPart(dataUrl: string) {
  const match = dataUrl.match(/^data:(image\/[\w.+-]+);base64,(.+)$/);
  if (!match) return null;
  return { type: 'image' as const, mime_type: match[1], data: match[2] };
}

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return NextResponse.json({ error: 'Thiếu GEMINI_API_KEY trong Vercel Environment Variables.' }, { status: 400 });

    const body = await req.json();
    const image = String(body.image || '');
    const hook = String(body.hook || '').slice(0, 120);
    const propertyInfo = String(body.propertyInfo || '').slice(0, 4000);
    const part = dataUrlToPart(image);
    if (!part) return NextResponse.json({ error: 'Ảnh thumbnail không hợp lệ.' }, { status: 400 });

    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: [{ role: 'user', parts: [
        { text: `Bạn là YouTube Thumbnail CTR Judge cho kênh bất động sản Việt Nam. Chấm thumbnail này trên thang 0-100 dựa trên khả năng dừng lướt và kích thích click, không phải dự đoán CTR tuyệt đối.

Hook trên thumbnail: ${hook}
Thông tin sản phẩm để kiểm tra độ liên quan: ${propertyInfo}

Đánh giá: visual hierarchy, chủ thể chính, khuôn mặt, căn nhà, độ tương phản, mobile readability, curiosity gap, clarity, emotional impact, và mức liên quan với Hook. Không thưởng điểm cho claim sai hoặc visual bịa đặt. Đưa ra 2-4 strengths, 1-3 weaknesses và một recommendation ngắn.` },
        part,
      ]}],
      config: { responseMimeType: 'application/json', responseSchema: schema },
    });

    const data = JSON.parse(response.text || '{}');
    return NextResponse.json(data);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Không thể chấm thumbnail.' }, { status: 500 });
  }
}

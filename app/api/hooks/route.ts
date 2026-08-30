import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

export const runtime = 'nodejs';

const schema = {
  type: 'object',
  properties: {
    hooks: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          hook: { type: 'string' },
          angle: { type: 'string' },
          ctrScore: { type: 'integer' },
          why: { type: 'string' },
          risk: { type: 'string' },
        },
        required: ['hook', 'angle', 'ctrScore', 'why', 'risk'],
      },
    },
    winner: { type: 'integer' },
    winnerReason: { type: 'string' },
  },
  required: ['hooks', 'winner', 'winnerReason'],
};

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Thiếu GEMINI_API_KEY trong Vercel Environment Variables.' }, { status: 400 });
    }

    const body = await req.json();
    const propertyInfo = String(body.propertyInfo || '').trim();
    const target = String(body.target || 'Khách mua nhà phố vùng ven TP.HCM').trim();
    const style = String(body.style || 'BĐS Viral').trim();

    if (!propertyInfo) {
      return NextResponse.json({ error: 'Hãy nhập thông tin căn nhà trước khi tạo Hook.' }, { status: 400 });
    }

    const ai = new GoogleGenAI({ apiKey });
    const prompt = `Bạn là AI Creative Director chuyên YouTube thumbnail và marketing bất động sản Việt Nam.

Nhiệm vụ: đọc thông tin căn nhà dưới đây và tạo đúng 10 HOOK ngắn để đặt trên thumbnail YouTube. Mục tiêu là tăng CTR nhưng không bịa thông tin, không dùng claim tuyệt đối nếu dữ liệu không chứng minh được.

Khách hàng mục tiêu: ${target}
Phong cách: ${style}

THÔNG TIN CĂN NHÀ:
${propertyInfo}

Yêu cầu Hook:
- Viết bằng tiếng Việt tự nhiên.
- Ưu tiên 3-8 từ, dễ đọc trên điện thoại.
- Có nhiều góc: giá sốc, tò mò, vị trí, diện tích, lợi ích, so sánh, lifestyle, phù hợp gia đình, đầu tư.
- Không spam dấu chấm than.
- Không hứa lợi nhuận chắc chắn.
- Không bịa tiện ích, pháp lý, khoảng cách hay giá.
- CTR score 0-100 là điểm dự đoán tương đối dựa trên sức mạnh tò mò + lợi ích + độ ngắn + độ rõ.
- risk ghi LOW/MEDIUM/HIGH và lý do ngắn.
- winner là index 0-based của Hook tốt nhất.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: schema,
      },
    });

    const data = JSON.parse(response.text || '{}');
    return NextResponse.json(data);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Không thể tạo Hook.' }, { status: 500 });
  }
}

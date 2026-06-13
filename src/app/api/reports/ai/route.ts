import { NextResponse } from 'next/server';
import { GoogleGenAI, Type, Schema } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export const maxDuration = 60; // Max duration for Vercel Hobby

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const { income, expense, categoryBreakdown } = data;

    const prompt = `
    Anda adalah FinMate AI, asisten keuangan yang sangat cerdas.
    Berikut adalah data keuangan pengguna untuk bulan ini:
    - Total Pemasukan: Rp${income.toLocaleString('id-ID')}
    - Total Pengeluaran: Rp${expense.toLocaleString('id-ID')}
    - Rincian Pengeluaran berdasarkan kategori:
    ${Object.entries(categoryBreakdown).map(([k, v]) => `  - ${k}: Rp${Number(v).toLocaleString('id-ID')}`).join('\n')}
    
    Analisis data ini dan berikan insight dalam format JSON. 
    1. 'worst_category_text': Penjelasan singkat (1-2 kalimat) tentang kategori pengeluaran terbesar dan seberapa boros pengguna di sana.
    2. 'good_news_text': Penjelasan singkat (1-2 kalimat) tentang hal baik dari pengeluaran pengguna atau pengeluaran yang berhasil dikendalikan.
    3. 'tips': Array berisi 3 tips hemat praktis dan spesifik (setiap tips 1 kalimat) yang sangat relevan dengan pola pengeluaran di atas.
    
    Jangan berikan salam pembuka, langsung kembalikan objek JSON.
    `;

    const responseSchema: Schema = {
      type: Type.OBJECT,
      properties: {
        worst_category_text: { type: Type.STRING },
        good_news_text: { type: Type.STRING },
        tips: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      },
      required: ['worst_category_text', 'good_news_text', 'tips']
    };

    // Cek apakah n8n Webhook URL dikonfigurasi
    if (process.env.N8N_REPORTS_WEBHOOK_URL) {
      try {
        const n8nResponse = await fetch(process.env.N8N_REPORTS_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt })
        });
        
        if (n8nResponse.ok) {
          const n8nData = await n8nResponse.json();
          return NextResponse.json(n8nData);
        } else {
          console.error("n8n webhook error:", await n8nResponse.text());
          // Fallback ke Gemini langsung
        }
      } catch (err) {
        console.error("Gagal menghubungi n8n webhook:", err);
        // Fallback ke Gemini langsung
      }
    }

    // Fallback: Panggil Gemini secara lokal
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        temperature: 0.2,
        responseMimeType: 'application/json',
        responseSchema: responseSchema,
      }
    });

    let result;
    try {
      let text = response.text || '{}';
      text = text.replace(/```json/g, '').replace(/```/g, '').trim();
      result = JSON.parse(text);
    } catch (e) {
      console.error("Failed to parse JSON:", e, response.text);
      throw new Error("Format balasan AI tidak valid");
    }
    
    return NextResponse.json(result);

  } catch (error: any) {
    console.error('Error generating AI report:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

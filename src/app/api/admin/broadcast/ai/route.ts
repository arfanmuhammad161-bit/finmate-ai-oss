import { NextResponse } from 'next/server';
import { chatWithGemini } from '@/lib/gemini';
import { verifyAdmin } from '@/lib/admin-auth';

export async function POST(req: Request) {
  try {
    const auth = await verifyAdmin();
    if (auth.error) return auth.error;

    const { title, message } = await req.json();

    if (!title && !message) {
      return NextResponse.json({ error: 'Title or message required' }, { status: 400 });
    }

    const prompt = `Anda adalah asisten AI profesional untuk aplikasi finansial bernama "FinMate AI".
Tugas Anda adalah merapikan pesan pengumuman (broadcast) kasar dari Admin agar menjadi lebih profesional, ramah, dan mudah dibaca oleh pengguna.

Judul kasar: "${title}"
Pesan kasar: "${message}"

Silakan susun ulang teks tersebut.
Aturan:
1. Jangan mengubah makna pesan.
2. Gunakan sapaan yang ramah (misalnya "Halo Sobat FinMate,").
3. Gunakan paragraf pendek atau poin-poin agar mudah dibaca di layar HP.
4. Jangan memberikan tambahan komentar apa pun selain hasil akhirnya.
5. Format jawaban harus berupa JSON murni dengan format:
{
  "title": "Judul yang disempurnakan",
  "message": "Pesan yang disempurnakan (bisa gunakan emoji)"
}
`;

    const responseText = await chatWithGemini(prompt, []);
    
    // Parse JSON dari response (hilangkan markdown json jika ada)
    const jsonStr = (responseText || "").replace(/```json/g, '').replace(/```/g, '').trim();
    const result = JSON.parse(jsonStr);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('API Broadcast AI Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

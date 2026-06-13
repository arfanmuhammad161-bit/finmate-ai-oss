import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { chatWithGemini } from '@/lib/gemini'

export const maxDuration = 60; // Max duration for Vercel Hobby

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { messages } = body

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Invalid messages' }, { status: 400 })
    }

    // Ambil profil user untuk memanggil nama
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single()

    const userName = profile?.full_name?.split(' ')[0] || 'User'

    // Ambil data transaksi 30 hari terakhir
    const date30DaysAgo = new Date()
    date30DaysAgo.setDate(date30DaysAgo.getDate() - 30)
    
    const { data: txs } = await supabase
      .from('transactions')
      .select('type, amount, category_name, description, date')
      .eq('user_id', user.id)
      .gte('date', date30DaysAgo.toISOString().split('T')[0])
      .order('date', { ascending: false })

    const totalPemasukan = (txs || []).filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
    const totalPengeluaran = (txs || []).filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)

    // Siapkan system prompt
    const systemPrompt = `
Anda adalah FinMate AI, asisten keuangan pribadi yang cerdas dan ramah.
Anda sedang berbicara dengan user bernama: ${userName}.
Gunakan bahasa Indonesia yang natural, profesional namun santai (boleh pakai emoji secukupnya).

Berikut adalah data transaksi ${userName} dalam 30 hari terakhir:
- Total Pemasukan: Rp ${totalPemasukan.toLocaleString('id-ID')}
- Total Pengeluaran: Rp ${totalPengeluaran.toLocaleString('id-ID')}
- Sisa Saldo 30 Hari: Rp ${(totalPemasukan - totalPengeluaran).toLocaleString('id-ID')}

Detail Transaksi (Terbaru ke Terlama):
${(txs || []).slice(0, 50).map(t => `- ${t.date} | ${t.type === 'income' ? 'Pemasukan' : 'Pengeluaran'} | Rp${t.amount.toLocaleString('id-ID')} | ${t.category_name} | ${t.description}`).join('\n')}

Tugas Anda:
1. Jawab pertanyaan user berdasarkan data transaksi di atas.
2. Jika user menanyakan tren, berikan insight (misalnya kategori apa yang paling boros).
3. Jika user meminta saran hemat, berikan tips praktis.
4. Jika pengguna mengunggah foto STRUK BELANJA (Receipt), baca detail harganya, sebutkan totalnya, dan buatlah rincian barang yang dibeli jika terlihat. Tanyakan apakah mereka ingin Anda yang mencatatkannya secara otomatis ke sistem.
5. Jangan halu/mengarang data transaksi yang tidak ada di atas. Jika data kosong, bilang bahwa belum ada transaksi yang dicatat dalam 30 hari terakhir.
6. Format jawaban Anda menggunakan Markdown yang rapi (bold, bullet points).
`;

    // Cek apakah n8n Webhook URL dikonfigurasi
    if (process.env.N8N_CHAT_WEBHOOK_URL) {
      try {
        const n8nResponse = await fetch(process.env.N8N_CHAT_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ systemPrompt, messages, user: { id: user.id, name: userName } })
        });
        
        if (n8nResponse.ok) {
          const n8nData = await n8nResponse.json();
          // n8n diharapkan mengembalikan JSON dengan format { "reply": "teks balasan" }
          return NextResponse.json({ reply: n8nData.reply || "Maaf, format balasan n8n tidak sesuai." });
        } else {
          console.error("n8n webhook error:", await n8nResponse.text());
          // Fallback ke Gemini langsung jika n8n error
        }
      } catch (err) {
        console.error("Gagal menghubungi n8n webhook:", err);
        // Fallback ke Gemini langsung
      }
    }

    // Fallback: Panggil Gemini langsung secara lokal
    const reply = await chatWithGemini(systemPrompt, messages)

    return NextResponse.json({ reply })

  } catch (error: any) {
    console.error('Chat API Error:', error)
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}

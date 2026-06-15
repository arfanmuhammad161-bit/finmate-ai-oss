import { GoogleGenAI, Type } from '@google/genai'

// Inisialisasi API Keys (Bisa menerima banyak key dipisah koma)
const rawKeys = process.env.GEMINI_API_KEY || ''
const apiKeys = rawKeys.split(',').map(k => k.trim()).filter(Boolean)
let currentKeyIndex = 0

if (apiKeys.length === 0) {
  console.warn("⚠️ PERINGATAN: GEMINI_API_KEY tidak ditemukan!")
}

export function getActiveGeminiAI() {
  const key = apiKeys[currentKeyIndex] || ''
  return new GoogleGenAI({ apiKey: key })
}

export function rotateGeminiKey() {
  if (apiKeys.length <= 1) return false;

  currentKeyIndex = (currentKeyIndex + 1) % apiKeys.length;
  console.log(`🔄 [FAILOVER] Beralih ke Gemini API Key #${currentKeyIndex + 1}`);
  return true;
}

export function getKeysCount() {
  return apiKeys.length;
}

// Tipe respons standar dari AI
export interface AiTransactionResult {
  intent: 'record_transaction' | 'ask_personal_report' | 'ask_admin_stats' | 'general_chat'
  replyText: string
  transactions?: {
    type: 'income' | 'expense'
    amount: number
    description: string
    category: string
    date?: string // YYYY-MM-DD, optional - kalau ada di struk
  }[]
}

// Prompt utama untuk extraction transaksi (text + image + voice)
function buildPrompt(text: string, systemContext?: string, hasMedia?: boolean) {
  return `
Anda adalah AI asisten keuangan pribadi bernama FinMate.
${systemContext ? `\nKONTEKS PENGGUNA SAAT INI:\n${systemContext}\n` : ''}

Tugas Anda adalah memahami permintaan pengguna dan memberikan respons yang sesuai.
Input pengguna bisa berupa teks, rekaman suara, atau gambar struk belanja.

${hasMedia ? `
=== ATURAN KHUSUS UNTUK FOTO STRUK BELANJA ===
1. Baca SEMUA item baris per baris di struk. SETIAP ITEM jadi 1 transaksi terpisah (type: "expense").
2. JANGAN catat baris "Total", "Subtotal", "Grand Total", "Pajak", "PPN", "Diskon", atau "Kembalian" sebagai transaksi.
3. Kalau item harganya negatif/diskon (potongan), JANGAN dimasukkan — itu bagian dari kalkulasi.
4. Kalau struk pakai Bahasa Inggris atau bahasa asing, terjemahkan deskripsi ke Bahasa Indonesia singkat.
5. Kalau ada tanggal jelas di struk, masukkan ke field "date" format YYYY-MM-DD. Kalau tidak jelas, kosongkan saja.
6. Kategorikan tiap item sesuai konteksnya (makanan ke "Makanan", minum di kafe ke "Makanan", tisu/sabun ke "Belanja", dll).
7. Description harus singkat dan jelas (maks 40 karakter). Misal: "Indomie Goreng" bukan "INDOMIE INSTANT GORENG SEMUR DAGING".
8. replyText harus konfirmasi sopan + total semua item yang berhasil dicatat.

=== ATURAN UNTUK VOICE NOTE ===
1. Transkripsi audio jadi teks, lalu ekstrak transaksi dari teks tersebut.
2. Boleh ada lebih dari 1 transaksi dalam satu voice note (contoh: "tadi beli kopi 18rb dan gorengan 5rb").
` : ''}

=== ATURAN UNTUK TEKS BIASA ===
1. Pahami bahasa santai Indonesia ("ngopi 25rb", "abis bensin 50ribu", "terima gaji 5jt").
2. Konversi notasi singkat: "rb" → ribu, "jt" → juta, "k" → ribu.
3. Default ke "expense" kecuali jelas pemasukan (gaji, freelance, jual, terima, bonus, dll).

=== FORMAT JSON KEMBALIAN ===
- intent: salah satu dari "record_transaction", "ask_personal_report", "ask_admin_stats", "general_chat".
- replyText: balasan natural dalam Markdown Telegram (*bold*, _italic_). Pakai emoji ramah.
- transactions: array (hanya kalau intent="record_transaction"). Setiap item:
  - type: "income" atau "expense"
  - amount: integer (rupiah, tanpa pemisah)
  - description: singkat & jelas
  - category: "Makanan" | "Transportasi" | "Hiburan" | "Belanja" | "Tagihan" | "Kesehatan" | "Pendidikan" | "Gaji" | "Freelance" | "Lainnya"
  - date (optional): "YYYY-MM-DD", hanya isi kalau dari struk dengan tanggal jelas

Input Pengguna:
${text || '(tidak ada teks, hanya media)'}
`
}

const JSON_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    intent: {
      type: Type.STRING,
      enum: ['record_transaction', 'ask_personal_report', 'ask_admin_stats', 'general_chat']
    },
    replyText: { type: Type.STRING },
    transactions: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          type: { type: Type.STRING, enum: ['income', 'expense'] },
          amount: { type: Type.INTEGER },
          description: { type: Type.STRING },
          category: { type: Type.STRING, enum: ["Makanan", "Transportasi", "Hiburan", "Belanja", "Tagihan", "Kesehatan", "Pendidikan", "Gaji", "Freelance", "Lainnya"] },
          date: { type: Type.STRING }
        },
        required: ['type', 'amount', 'description', 'category']
      }
    }
  },
  required: ['intent', 'replyText']
}

// Coba pakai Qwen2.5-VL gratis via OpenRouter sebagai fallback untuk vision
async function tryQwenFallback(
  text: string,
  mediaBase64: string,
  mimeType: string,
  systemContext?: string
): Promise<AiTransactionResult | null> {
  const openrouterKey = (process.env.OPENROUTER_API_KEY || '').trim()
  if (!openrouterKey) return null
  if (!mimeType.startsWith('image/')) return null // Qwen-VL hanya untuk gambar, voice tetap di Gemini

  try {
    const prompt = buildPrompt(text, systemContext, true) + `\n\nWAJIB respon JSON saja, no markdown wrapper, no penjelasan ekstra.`

    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openrouterKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://finmate-ai-brown.vercel.app',
        'X-Title': 'FinMate AI'
      },
      body: JSON.stringify({
        model: 'qwen/qwen2.5-vl-72b-instruct:free',
        messages: [{
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            { type: 'image_url', image_url: { url: `data:${mimeType};base64,${mediaBase64}` } }
          ]
        }],
        response_format: { type: 'json_object' },
        temperature: 0.1
      })
    })

    if (!res.ok) {
      console.warn(`⚠️ [Qwen Fallback] HTTP ${res.status}`)
      return null
    }

    const data = await res.json()
    const raw = data?.choices?.[0]?.message?.content
    if (!raw) return null

    // Bersihkan markdown wrapper jika ada
    const cleaned = String(raw).replace(/```json/g, '').replace(/```/g, '').trim()
    const parsed = JSON.parse(cleaned) as AiTransactionResult
    console.log(`✅ [Qwen Fallback] berhasil`)
    return parsed
  } catch (e: any) {
    console.warn(`⚠️ [Qwen Fallback] gagal: ${e.message}`)
    return null
  }
}

export async function handleTelegramChatWithGemini(
  text: string,
  mediaBase64?: string,
  mimeType?: string,
  systemContext?: string
): Promise<AiTransactionResult> {
  const hasMedia = !!(mediaBase64 && mimeType)
  const prompt = buildPrompt(text, systemContext, hasMedia)

  const contents: any[] = [{ role: 'user', parts: [] }]

  if (mediaBase64 && mimeType) {
    contents[0].parts.push({
      inlineData: {
        data: mediaBase64,
        mimeType: mimeType
      }
    })
  }

  contents[0].parts.push({ text: prompt })

  const ai = getActiveGeminiAI()
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: contents,
    config: {
      temperature: 0.1,
      responseMimeType: 'application/json',
      responseSchema: JSON_SCHEMA
    }
  })

  try {
    let rawText = response.text
    if (!rawText) throw new Error("Respons AI Kosong")

    rawText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(rawText) as AiTransactionResult
    return parsed
  } catch (error: any) {
    console.error("Gemini parse error:", error)
    // Coba Qwen sebagai fallback untuk image-based queries
    if (mediaBase64 && mimeType?.startsWith('image/')) {
      const qwenResult = await tryQwenFallback(text, mediaBase64, mimeType, systemContext)
      if (qwenResult) return qwenResult
    }
    throw new Error(`Parse Error: ${error.message}. Response was: ${response.text?.substring(0, 50)}...`)
  }
}

export async function chatWithGemini(systemPrompt: string, history: {role: string, content: string, imageBase64?: string, mimeType?: string}[]) {
  const contents: any[] = []

  contents.push({ role: 'user', parts: [{ text: systemPrompt }] })
  contents.push({ role: 'model', parts: [{ text: 'Baik, saya paham. Saya akan bertindak sesuai instruksi tersebut.' }] })

  for (const msg of history) {
    const parts: any[] = []
    if (msg.imageBase64 && msg.mimeType) {
      parts.push({
        inlineData: {
          data: msg.imageBase64,
          mimeType: msg.mimeType
        }
      })
    }
    parts.push({ text: msg.content || 'Lampiran Gambar' })

    contents.push({
      role: msg.role === 'ai' ? 'model' : 'user',
      parts
    })
  }

  const ai = getActiveGeminiAI()
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: contents,
    config: {
      temperature: 0.7,
    }
  })

  try {
    return response.text
  } catch (error) {
    console.error("Gemini chat error:", error)
    return "Maaf, sistem AI sedang mengalami gangguan. Silakan coba beberapa saat lagi."
  }
}

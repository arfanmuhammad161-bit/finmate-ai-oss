import { GoogleGenAI, Type } from '@google/genai'

// === TIERED API KEY SYSTEM ===
// FREE keys: untuk user Trial. Bisa multi-key (rotasi saat 429).
// PAID key: untuk user Pro/Yearly. Single key dari Gemini paid tier (rate limit jauh
// lebih tinggi). Set di env GEMINI_API_KEY_PAID. Kalau kosong, fallback ke FREE.
const rawFreeKeys = process.env.GEMINI_API_KEY || ''
const apiKeys = rawFreeKeys.split(',').map(k => k.trim()).filter(Boolean)
const paidKey = (process.env.GEMINI_API_KEY_PAID || '').trim()
let currentKeyIndex = 0

if (apiKeys.length === 0) {
  console.warn("⚠️ PERINGATAN: GEMINI_API_KEY (free tier) tidak ditemukan!")
}
if (!paidKey) {
  console.log("ℹ️ GEMINI_API_KEY_PAID belum diset. Pro user akan tetap pakai free tier.")
}

export type UserTier = 'free' | 'paid'

/** Tentukan tier dari plan subscription. Pro Bulanan/Tahunan = paid. */
export function tierForPlan(plan: string | undefined | null): UserTier {
  if (plan === 'monthly' || plan === 'yearly' || plan === 'admin') return 'paid'
  return 'free'
}

/** Get active Gemini client berdasar tier. Paid user → paid key (kalau ada), Free → multi-key rotation. */
export function getActiveGeminiAI(tier: UserTier = 'free') {
  if (tier === 'paid' && paidKey) {
    return new GoogleGenAI({ apiKey: paidKey })
  }
  const key = apiKeys[currentKeyIndex] || ''
  return new GoogleGenAI({ apiKey: key })
}

export function rotateGeminiKey() {
  if (apiKeys.length <= 1) return false;
  currentKeyIndex = (currentKeyIndex + 1) % apiKeys.length;
  console.log(`🔄 [FAILOVER] Beralih ke Gemini Free Key #${currentKeyIndex + 1}`);
  return true;
}

export function getKeysCount() {
  return apiKeys.length;
}

export function hasPaidKey() {
  return !!paidKey;
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

export async function handleTelegramChatWithGemini(
  text: string,
  mediaBase64?: string,
  mimeType?: string,
  systemContext?: string,
  tier: UserTier = 'free'
): Promise<AiTransactionResult> {
  const hasMedia = !!(mediaBase64 && mimeType)
  const prompt = buildPrompt(text, systemContext, hasMedia)

  const contents: any[] = [{ role: 'user', parts: [] }]

  if (mediaBase64 && mimeType) {
    contents[0].parts.push({
      inlineData: { data: mediaBase64, mimeType: mimeType }
    })
  }
  contents[0].parts.push({ text: prompt })

  const ai = getActiveGeminiAI(tier)
  // Paid user pakai 2.5-flash (lebih pintar). Free pakai 2.5-flash juga karena harganya gratis di free tier.
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
    throw new Error(`Parse Error: ${error.message}. Response was: ${response.text?.substring(0, 50)}...`)
  }
}

export async function chatWithGemini(
  systemPrompt: string,
  history: {role: string, content: string, imageBase64?: string, mimeType?: string}[],
  tier: UserTier = 'free'
) {
  const contents: any[] = []
  contents.push({ role: 'user', parts: [{ text: systemPrompt }] })
  contents.push({ role: 'model', parts: [{ text: 'Baik, saya paham. Saya akan bertindak sesuai instruksi tersebut.' }] })

  for (const msg of history) {
    const parts: any[] = []
    if (msg.imageBase64 && msg.mimeType) {
      parts.push({ inlineData: { data: msg.imageBase64, mimeType: msg.mimeType } })
    }
    parts.push({ text: msg.content || 'Lampiran Gambar' })
    contents.push({
      role: msg.role === 'ai' ? 'model' : 'user',
      parts
    })
  }

  const ai = getActiveGeminiAI(tier)
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: contents,
    config: { temperature: 0.7 }
  })

  try {
    return response.text
  } catch (error) {
    console.error("Gemini chat error:", error)
    return "Maaf, sistem AI sedang mengalami gangguan. Silakan coba beberapa saat lagi."
  }
}

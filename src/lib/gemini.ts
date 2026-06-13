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

export async function handleTelegramChatWithGemini(
  text: string,
  mediaBase64?: string,
  mimeType?: string,
  systemContext?: string
) {
  const prompt = `
Anda adalah AI asisten keuangan pribadi bernama FinMate.
${systemContext ? `\nKONTEKS PENGGUNA SAAT INI:\n${systemContext}\n` : ''}

Tugas Anda adalah memahami permintaan pengguna dan memberikan respons yang sesuai.
Input pengguna bisa berupa teks (chat), rekaman suara (audio), atau gambar struk belanja.

Ekstrak dan kembalikan data dalam format JSON persis dengan skema berikut:
- intent: "record_transaction" (jika pengguna ingin mencatat transaksi baru), "ask_personal_report" (jika bertanya riwayat transaksi pribadi/laporan), "ask_admin_stats" (jika admin bertanya jumlah user/pendapatan), atau "general_chat" (untuk percakapan lain).
- replyText: Balasan natural dari AI untuk pengguna, gunakan format Markdown Telegram (*bold*, _italic_). Jika intent="ask_admin_stats" tapi data admin tidak ada di konteks, tolak dengan sopan bahwa pengguna tidak memiliki akses admin.
- transactions: HANYA DIISI JIKA intent="record_transaction". Daftar transaksi yang diekstrak. Formatnya:
  - type: "income" atau "expense"
  - amount: angka (integer)
  - description: deskripsi singkat transaksi
  - category: Pilih salah satu: "Makanan", "Transportasi", "Hiburan", "Belanja", "Tagihan", "Kesehatan", "Pendidikan", "Gaji", "Freelance", "Lainnya".

Input Pengguna:
${text}
`

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
      responseSchema: {
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
                category: { type: Type.STRING, enum: ["Makanan", "Transportasi", "Hiburan", "Belanja", "Tagihan", "Kesehatan", "Pendidikan", "Gaji", "Freelance", "Lainnya"] }
              },
              required: ['type', 'amount', 'description', 'category']
            }
          }
        },
        required: ['intent', 'replyText']
      }
    }
  })

  try {
    let rawText = response.text
    if (!rawText) throw new Error("Respons AI Kosong")
    
    // Clean markdown backticks if present
    rawText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();

    const parsed = JSON.parse(rawText) as {
      intent: 'record_transaction' | 'ask_personal_report' | 'ask_admin_stats' | 'general_chat'
      replyText: string
      transactions?: {
        type: 'income' | 'expense'
        amount: number
        description: string
        category: string
      }[]
    }
    return parsed
  } catch (error: any) {
    console.error("Gemini parse error:", error)
    throw new Error(`Parse Error: ${error.message}. Response was: ${response.text?.substring(0, 50)}...`)
  }
}

export async function chatWithGemini(systemPrompt: string, history: {role: string, content: string, imageBase64?: string, mimeType?: string}[]) {
  const contents: any[] = []
  
  // Add system prompt as the first user message, and a model acknowledgement
  contents.push({ role: 'user', parts: [{ text: systemPrompt }] })
  contents.push({ role: 'model', parts: [{ text: 'Baik, saya paham. Saya akan bertindak sesuai instruksi tersebut.' }] })

  // Add the actual conversation history
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
      temperature: 0.7, // Lebih kreatif sedikit untuk chat
    }
  })

  try {
    return response.text
  } catch (error) {
    console.error("Gemini chat error:", error)
    return "Maaf, sistem AI sedang mengalami gangguan. Silakan coba beberapa saat lagi."
  }
}

import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { handleTelegramChatWithGemini, rotateGeminiKey, getKeysCount, tierForPlan, UserTier } from '@/lib/gemini'
import { checkAiRateLimit, configForPlan } from '@/lib/rateLimit'
import { checkUserAccess } from '@/lib/checkAccess'

const UPGRADE_URL = 'https://finmate-ai-brown.vercel.app/dashboard/settings?tab=subscription'

/** Bangun reply keyboard inline untuk tombol upgrade Pro */
function upgradeKeyboard() {
  return {
    inline_keyboard: [[
      { text: '⚡ Upgrade ke Pro', url: UPGRADE_URL }
    ]]
  }
}

/** Menu tombol persisten di bawah input chat — biar user gak perlu hafal command */
function mainMenuKeyboard() {
  return {
    keyboard: [
      [{ text: '📊 Laporan' }, { text: '💰 Saldo' }],
      [{ text: '📄 Laporan PDF' }, { text: '❓ Bantuan' }],
    ],
    resize_keyboard: true,
    is_persistent: true,
    input_field_placeholder: 'Ketik transaksi atau pilih menu...',
  }
}

// Helper untuk fetch file dari Telegram
async function getTelegramFileBase64(fileId: string): Promise<{ base64: string, mimeType: string }> {
  const token = (process.env.TELEGRAM_BOT_TOKEN || '').trim()
  if (!token) throw new Error("TELEGRAM_BOT_TOKEN tidak ditemukan")

  // 1. Dapatkan file_path menggunakan POST agar tidak di-cache oleh Next.js
  const res = await fetch(`https://api.telegram.org/bot${token}/getFile`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ file_id: fileId })
  })
  if (!res.ok) {
    const errText = await res.text()
    throw new Error(`HTTP ${res.status}. Response: ${errText}. Token prefix: ${token.substring(0,5)}`)
  }
  
  const data = await res.json()
  if (!data.ok) throw new Error(`Telegram API Error: ${data.description || 'Unknown'}`)

  const filePath = data.result.file_path
  if (!filePath) throw new Error("file_path tidak ada di respons Telegram")
  
  // 2. Download file aktual
  const fileRes = await fetch(`https://api.telegram.org/file/bot${token}/${filePath}`, { cache: 'no-store' })
  if (!fileRes.ok) throw new Error(`Gagal download file: HTTP ${fileRes.status}`)

  const arrayBuffer = await fileRes.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)
  const base64 = buffer.toString('base64')

  // Tentukan mimeType sederhana berdasarkan ekstensi filePath
  let mimeType = 'application/octet-stream'
  if (filePath.endsWith('.jpg') || filePath.endsWith('.jpeg')) mimeType = 'image/jpeg'
  else if (filePath.endsWith('.png')) mimeType = 'image/png'
  else if (filePath.endsWith('.ogg') || filePath.endsWith('.oga')) mimeType = 'audio/ogg'
  else if (filePath.endsWith('.mp3')) mimeType = 'audio/mpeg'

  return { base64, mimeType }
}

// Fungsi pembantu kirim notifikasi error ke admin
async function notifyAdmin(errorMsg: string) {
  const adminId = process.env.ADMIN_TELEGRAM_ID
  const token = process.env.TELEGRAM_BOT_TOKEN
  if (adminId && token) {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: adminId,
        text: `⚠️ *SYSTEM ERROR*\n\n${errorMsg}`,
        parse_mode: 'Markdown'
      })
    })
  }
}

export async function POST(request: NextRequest) {
  let chatId = 0
  
  try {
    const body = await request.json()
    const { message } = body

    if (!message || !message.chat) {
      return NextResponse.json({ ok: true })
    }

    chatId = message.chat.id
    
    // Gunakan Service Role Key untuk bypass RLS
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Deteksi tipe input: text, photo, atau voice
    const isVoice = !!message.voice
    const isPhoto = !!message.photo && message.photo.length > 0
    let text = (message.text || message.caption || '').trim()

    // Map tombol menu (teks) ke command supaya handler di bawah tetap jalan
    const buttonMap: Record<string, string> = {
      '📊 Laporan': '/laporan',
      '💰 Saldo': '/saldo',
      '📄 Laporan PDF': '/pdf',
      '❓ Bantuan': '/help',
    }
    if (buttonMap[text]) text = buttonMap[text]

    // Handle perintah Start
    if (text.startsWith('/start')) {
      return NextResponse.json({
        method: 'sendMessage',
        chat_id: chatId,
        text: `🤖 *Halo! Saya FinMate AI Bot.*\n\nUntuk menghubungkan akun:\n1️⃣ Buka aplikasi web FinMate\n2️⃣ Masuk ke *Pengaturan → Telegram Bot*\n3️⃣ Salin kode verifikasi (format: FIN-XXXXXX)\n4️⃣ Kirim kode itu ke chat ini\n\nKirim kode verifikasi Anda sekarang 👇`,
        parse_mode: 'Markdown',
      })
    }

    // Handle Verification Code
    if (text.startsWith('FIN-')) {
      const code = text.replace('FIN-', '').toLowerCase()
      
      const { data: profiles } = await supabaseAdmin
        .from('profiles')
        .select('id')

      const match = profiles?.find(p => p.id.toLowerCase().startsWith(code))

      if (match) {
        await supabaseAdmin.from('profiles').update({ telegram_id: chatId.toString() }).eq('id', match.id)
        
        // Simpan Admin ID jika ini adalah user pertama (opsional, tapi berguna)
        if (!process.env.ADMIN_TELEGRAM_ID && match) {
          console.log(`SET ADMIN ID IN ENV: ${chatId}`);
          // Di production sesungguhnya kita menyimpan roles di DB, tapi ini untuk demonstrasi
        }
        
        return NextResponse.json({
          method: 'sendMessage',
          chat_id: chatId,
          text: `✅ *Akun Anda berhasil terhubung!*\n\nSekarang Anda bisa mulai mencatat keuangan:\n\n💬 *Teks:* ketik "makan siang 35rb"\n🎤 *Voice:* rekam "tadi beli bensin 50 ribu"\n📸 *Foto struk:* AI baca otomatis\n\nGunakan *menu tombol di bawah* untuk akses cepat 👇`,
          parse_mode: 'Markdown',
          reply_markup: mainMenuKeyboard(),
        })
      } else {
        return NextResponse.json({
          method: 'sendMessage',
          chat_id: chatId,
          text: `❌ Kode verifikasi tidak valid atau kedaluwarsa.`
        })
      }
    }

    // Cek apakah user terdaftar
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name')
      .eq('telegram_id', chatId.toString())
      .single()

    if (!profile) {
      return NextResponse.json({
        method: 'sendMessage',
        chat_id: chatId,
        text: `❌ Akun Telegram Anda belum terhubung dengan FinMate AI.\n\nBuka web app dan hubungkan di Pengaturan > Telegram Bot.`
      })
    }

    // Command Standar Laporan
    if (text === '/laporan' || text === '/report') {
      const now = new Date()
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
      
      const { data: txs } = await supabaseAdmin
        .from('transactions')
        .select('type, amount, category_name')
        .eq('user_id', profile.id)
        .gte('date', monthStart)

      const income = (txs || []).filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
      const expense = (txs || []).filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
      const savings = income - expense

      const monthName = now.toLocaleString('id-ID', { month: 'long', year: 'numeric' })
      
      return NextResponse.json({
        method: 'sendMessage',
        chat_id: chatId,
        text: `📊 *Laporan ${monthName}*\n\n` +
          `💚 Pemasukan: Rp${income.toLocaleString('id-ID')}\n` +
          `❤️ Pengeluaran: Rp${expense.toLocaleString('id-ID')}\n` +
          `💙 Tabungan: Rp${savings.toLocaleString('id-ID')}\n\n` +
          `📱 Lihat detail di web app!`,
        parse_mode: 'Markdown'
      })
    }

    // Handle /pdf command — generate PDF dan kirim sebagai dokumen
    if (text === '/pdf' || text === '/laporan_pdf' || text === '/laporanpdf') {
      // Fire-and-forget: kirim "memproses" dulu, generate PDF di background
      const token = (process.env.TELEGRAM_BOT_TOKEN || '').trim()
      if (token) {
        // Kirim status processing
        await fetch(`https://api.telegram.org/bot${token}/sendChatAction`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: chatId, action: 'upload_document' })
        }).catch(() => {})

        // Generate PDF
        try {
          const { generateReportPdf } = await import('@/lib/generateReportPdf')

          const now = new Date()
          const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
          const monthName = now.toLocaleString('id-ID', { month: 'long', year: 'numeric' })

          const { data: txs } = await supabaseAdmin
            .from('transactions')
            .select('type, amount, category_name, description, date')
            .eq('user_id', profile.id)
            .gte('date', monthStart)

          const all = txs || []
          const income = all.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0)
          const expense = all.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0)

          const catBreakdown: Record<string, number> = {}
          all.filter(t => t.type === 'expense').forEach(t => {
            const k = t.category_name || 'Lainnya'
            catBreakdown[k] = (catBreakdown[k] || 0) + Number(t.amount)
          })

          const topExpenses = all
            .filter(t => t.type === 'expense')
            .sort((a, b) => Number(b.amount) - Number(a.amount))
            .slice(0, 5)
            .map(t => ({
              description: t.description || '',
              category_name: t.category_name || '',
              amount: Number(t.amount),
              date: t.date,
            }))

          const pdfBytes = generateReportPdf({
            userName: profile.full_name || 'User FinMate',
            periodLabel: monthName,
            income,
            expense,
            net: income - expense,
            categoryBreakdown: catBreakdown,
            topTransactions: topExpenses,
          })

          // Send PDF via Telegram sendDocument (multipart/form-data)
          const formData = new FormData()
          formData.append('chat_id', String(chatId))
          formData.append('caption', `📄 *Laporan ${monthName}*\n\nBerikut laporan keuangan Anda bulan ini.`)
          formData.append('parse_mode', 'Markdown')
          formData.append('document', new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' }), `FinMate_${monthName.replace(/ /g, '_')}.pdf`)

          const sendRes = await fetch(`https://api.telegram.org/bot${token}/sendDocument`, {
            method: 'POST',
            body: formData,
          })

          if (!sendRes.ok) {
            const err = await sendRes.text().catch(() => '')
            console.error('Telegram sendDocument failed:', err)
            return NextResponse.json({
              method: 'sendMessage',
              chat_id: chatId,
              text: `⚠️ Gagal mengirim PDF. Coba lagi atau lihat di web app.`
            })
          }

          // Berhasil — return empty 200 (PDF sudah terkirim via sendDocument)
          return NextResponse.json({ ok: true })
        } catch (pdfErr: any) {
          console.error('PDF generation error:', pdfErr)
          return NextResponse.json({
            method: 'sendMessage',
            chat_id: chatId,
            text: `⚠️ Gagal membuat PDF: ${pdfErr.message?.substring(0, 100) || 'unknown error'}`
          })
        }
      }
      return NextResponse.json({
        method: 'sendMessage',
        chat_id: chatId,
        text: `⚠️ Bot token tidak tersedia.`
      })
    }

    // Handle /saldo command
    if (text === '/saldo' || text === '/balance') {
      const now = new Date()
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
      
      const { data: txs } = await supabaseAdmin
        .from('transactions')
        .select('type, amount')
        .eq('user_id', profile.id)
        .gte('date', monthStart)

      const income = (txs || []).filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
      const expense = (txs || []).filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)

      return NextResponse.json({
        method: 'sendMessage',
        chat_id: chatId,
        text: `💰 Saldo bulan ini: *Rp${(income - expense).toLocaleString('id-ID')}*\n\n(Pemasukan: Rp${income.toLocaleString('id-ID')} | Pengeluaran: Rp${expense.toLocaleString('id-ID')})`,
        parse_mode: 'Markdown'
      })
    }

    if (text === '/help') {
      return NextResponse.json({
        method: 'sendMessage',
        chat_id: chatId,
        text: `🤖 *FinMate AI Bot — Panduan*\n\n` +
          `*✍️ Cara Catat Transaksi:*\n` +
          `💬 Ketik bebas: _"makan siang 35rb"_\n` +
          `💬 Pemasukan: _"terima gaji 5jt"_\n` +
          `📸 Kirim *foto struk* → AI baca otomatis\n` +
          `🎤 Kirim *voice note* → langsung dicatat\n\n` +
          `*📋 Menu Cepat (tombol di bawah):*\n` +
          `📊 Laporan — ringkasan bulan ini\n` +
          `📄 Laporan PDF — file PDF rapi\n` +
          `💰 Saldo — cek saldo saat ini\n` +
          `❓ Bantuan — panduan ini\n\n` +
          `_Tinggal tap tombol, gak perlu hafal perintah!_`,
        parse_mode: 'Markdown',
        reply_markup: mainMenuKeyboard(),
      })
    }

    // PROCESSING AI GEMINI (Text, Voice, Photo)
    if (text || isVoice || isPhoto) {
      // Cek rate limit dulu sebelum panggil AI mahal
      const { data: sub } = await supabaseAdmin
        .from('subscriptions')
        .select('plan')
        .eq('user_id', profile.id)
        .eq('status', 'active')
        .maybeSingle()

      const isAdminUser = chatId.toString() === process.env.ADMIN_TELEGRAM_ID
      const tier: UserTier = isAdminUser ? 'paid' : tierForPlan(sub?.plan)

      // ENFORCEMENT: blokir kalau trial/langganan habis
      const access = await checkUserAccess(supabaseAdmin, profile.id, isAdminUser ? 'arfanmuhammad161@gmail.com' : null)
      if (!access.hasAccess) {
        return NextResponse.json({
          method: 'sendMessage',
          chat_id: chatId,
          text: `🔒 *${access.reason}*\n\nUpgrade ke Pro untuk lanjut mencatat keuangan via bot.\n\nBuka aplikasi → Pengaturan → Langganan.`,
          parse_mode: 'Markdown',
          reply_markup: upgradeKeyboard(),
        })
      }

      const rateCheck = await checkAiRateLimit(
        supabaseAdmin,
        profile.id,
        configForPlan(sub?.plan),
        { skip: isAdminUser }
      )
      if (!rateCheck.allowed) {
        // Pesan ramah + tombol upgrade kalau user Free
        const friendlyMsg = tier === 'free'
          ? `⏰ *AI Mode Gratis lagi padat*\n\n${rateCheck.reason}\n\n💡 _Upgrade ke Pro untuk akses tanpa antrian._`
          : `⏰ ${rateCheck.reason}`
        return NextResponse.json({
          method: 'sendMessage',
          chat_id: chatId,
          text: friendlyMsg,
          parse_mode: 'Markdown',
          reply_markup: tier === 'free' ? upgradeKeyboard() : undefined,
        })
      }

      // Send temporary "typing" or processing message
      const token = process.env.TELEGRAM_BOT_TOKEN
      if (token) {
        await fetch(`https://api.telegram.org/bot${token}/sendChatAction`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: chatId, action: 'typing' })
        })
      }

      let mediaBase64: string | undefined
      let mimeType: string | undefined
      let userPrompt = text || 'Tolong ekstrak transaksi dari media ini.'

      if (isPhoto) {
        try {
          // Ambil resolusi terbesar
          const fileId = message.photo[message.photo.length - 1].file_id
          const media = await getTelegramFileBase64(fileId)
          mediaBase64 = media.base64
          mimeType = media.mimeType
        } catch (downloadErr: any) {
          return NextResponse.json({ method: 'sendMessage', chat_id: chatId, text: `⚠️ Gagal mengunduh foto: ${downloadErr.message}` })
        }
      } else if (isVoice) {
        try {
          const fileId = message.voice.file_id
          const media = await getTelegramFileBase64(fileId)
          mediaBase64 = media.base64
          mimeType = message.voice.mime_type || media.mimeType
        } catch (downloadErr: any) {
          return NextResponse.json({ method: 'sendMessage', chat_id: chatId, text: `⚠️ Gagal mengunduh Voice Note: ${downloadErr.message}` })
        }
      }

      // Build System Context for Gemini
      let systemContext = ''
      
      // Selalu fetch transaksi personal user (baik admin maupun bukan)
      const { data: txs } = await supabaseAdmin
        .from('transactions')
        .select('type, amount, description, date')
        .eq('user_id', profile.id)
        .order('date', { ascending: false })
        .limit(10)
        
      if (txs && txs.length > 0) {
        systemContext += `Data Transaksi Pribadi Anda (10 terakhir):\n`
        txs.forEach(t => {
          systemContext += `- [${t.date}] ${t.type === 'income' ? 'Pemasukan' : 'Pengeluaran'} Rp${t.amount}: ${t.description}\n`
        })
        systemContext += `\nGunakan data di atas jika pengguna menanyakan riwayat/laporan pengeluarannya.\n`
      }

      const isAdmin = isAdminUser

      if (isAdmin) {
        // Fetch admin stats
        const { count: userCount } = await supabaseAdmin.from('profiles').select('*', { count: 'exact', head: true })
        const { data: revData } = await supabaseAdmin.from('subscriptions').select('price').eq('status', 'active')
        const totalRev = revData?.reduce((s, row) => s + (row.price || 0), 0) || 0
        
        systemContext += `\nPeran Pengguna: ADMIN UTAMA APLIKASI.\n`
        systemContext += `Data Aplikasi Saat Ini (Hanya untuk Admin):\n`
        systemContext += `- Total User Terdaftar: ${userCount || 0}\n`
        systemContext += `- Estimasi Pendapatan Langganan Aktif: Rp${totalRev.toLocaleString('id-ID')}\n`
        systemContext += `\nAnda diizinkan untuk memberikan data admin jika diminta (intent: ask_admin_stats).`
      } else {
        systemContext += `\nPeran Pengguna: PENGGUNA BIASA (Nama: ${profile.full_name || 'Pengguna'}).\n`
        systemContext += `\nJika pengguna bertanya metrik admin/pendapatan aplikasi, tolak dengan sopan karena mereka bukan admin.`
      }

      // Gunakan Gemini untuk mengurai percakapan dengan auto-retry
      let aiResult;
      let retries = 3;
      while (retries > 0) {
        try {
          aiResult = await handleTelegramChatWithGemini(userPrompt, mediaBase64, mimeType, systemContext, tier)
          break;
        } catch (err: any) {
          retries--;
          if (retries === 0) {
            // Pesan ramah, sembunyikan technical jargon
            const isBusy = err.message?.includes('503') || err.message?.includes('UNAVAILABLE') || err.message?.includes('429') || err.message?.includes('exceeded')
            if (isBusy && tier === 'free') {
              return NextResponse.json({
                method: 'sendMessage',
                chat_id: chatId,
                text: `⏰ *AI Mode Gratis lagi sibuk*\n\nSemua antrian gratis lagi padat. Coba 1-2 menit lagi.\n\n💡 _Upgrade ke Pro untuk akses prioritas tanpa antri._`,
                parse_mode: 'Markdown',
                reply_markup: upgradeKeyboard(),
              })
            }
            return NextResponse.json({
              method: 'sendMessage',
              chat_id: chatId,
              text: `⚠️ Maaf, AI lagi ada gangguan. Coba sebentar lagi.`
            })
          }
          
          // Jika 429, coba rotate key sebelum retry
          if (err.message && (err.message.includes('429') || err.message.includes('exceeded'))) {
            const rotated = rotateGeminiKey();
            if (rotated) {
              console.log("Mencoba ulang dengan API Key yang baru...");
              continue; // Langsung retry tanpa delay karena pakai key baru
            }
          }
          
          // Tunggu 2 detik sebelum mencoba lagi
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
      // Pastikan aiResult ada sebelum diproses lebih lanjut
      if (!aiResult) {
        return NextResponse.json({ method: 'sendMessage', chat_id: chatId, text: `⚠️ Maaf, terjadi kesalahan saat memproses data AI.` })
      }

      // Routing Intent AI
      if (aiResult.intent === 'record_transaction' && aiResult.transactions && aiResult.transactions.length > 0) {
        const todayIso = new Date().toISOString().split('T')[0]
        // Validasi format tanggal dari AI (kalau ada). Hanya terima YYYY-MM-DD valid.
        const isValidDate = (d?: string) => !!d && /^\d{4}-\d{2}-\d{2}$/.test(d) && !isNaN(new Date(d).getTime())

        let totalAmount = 0
        for (const parsed of aiResult.transactions) {
          const useDate = isValidDate(parsed.date) ? parsed.date : todayIso
          await supabaseAdmin.from('transactions').insert({
            user_id: profile.id,
            type: parsed.type,
            amount: parsed.amount,
            description: parsed.description,
            category_name: parsed.category,
            date: useDate,
            source: 'telegram',
            ai_parsed: true
          })
          totalAmount += parsed.type === 'expense' ? parsed.amount : 0
        }

        let replyText = aiResult.replyText + `\n\n✨ *Mencatat ${aiResult.transactions.length} Transaksi:*\n`
        for (const parsed of aiResult.transactions) {
          const typeText = parsed.type === 'income' ? '💚' : '❤️'
          replyText += `${typeText} ${parsed.description}: Rp${parsed.amount.toLocaleString('id-ID')}\n`
        }
        if (aiResult.transactions.length > 1 && totalAmount > 0) {
          replyText += `\n💰 *Total pengeluaran: Rp${totalAmount.toLocaleString('id-ID')}*`
        }

        return NextResponse.json({
          method: 'sendMessage',
          chat_id: chatId,
          text: replyText,
          parse_mode: 'Markdown'
        })
      } else {
        // Balasan biasa (laporan, pertanyaan admin, obrolan santai, atau kegagalan parsing)
        return NextResponse.json({
          method: 'sendMessage',
          chat_id: chatId,
          text: aiResult.replyText || `Maaf, saya tidak mengerti maksud Anda. 🤔\nMedia: ${mediaBase64 ? 'Ada' : 'Tidak Ada'}`,
          parse_mode: 'Markdown'
        })
      }
    }

    return NextResponse.json({ ok: true })

  } catch (error: any) {
    console.error('Telegram webhook error:', error)
    // Laporkan ke Admin jika terjadi error sistem
    if (chatId) {
      await notifyAdmin(`Error saat memproses pesan dari user ${chatId}:\n${error.message}`)
    }
    return NextResponse.json({ ok: true })
  }
}

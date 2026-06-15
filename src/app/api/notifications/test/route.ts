import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

const FRIENDLY_DESC: Record<string, string> = {
  daily: 'Ringkasan harian (transaksi hari ini)',
  weekly: 'Ringkasan mingguan (7 hari terakhir)',
  budget: 'Peringatan anggaran',
  trial: 'Reminder masa trial',
  tips: 'Tips keuangan AI',
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const type = body.type as 'daily' | 'weekly' | 'budget' | 'trial' | 'tips'
    if (!type || !FRIENDLY_DESC[type]) {
      return NextResponse.json({ error: 'Tipe notifikasi tidak valid' }, { status: 400 })
    }

    const supabaseAdmin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Cek apakah user sudah connect Telegram
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('telegram_id, full_name')
      .eq('id', user.id)
      .single()

    if (!profile?.telegram_id) {
      return NextResponse.json({
        error: 'Telegram belum terhubung. Hubungkan dulu di tab Telegram Bot.',
        needsTelegram: true,
      }, { status: 400 })
    }

    // Generate isi notif sesuai tipe (pakai data riil user)
    let messageText = ''
    const now = new Date()
    const todayStr = new Intl.DateTimeFormat('fr-CA', { timeZone: 'Asia/Jakarta' }).format(now)
    const today = new Date(todayStr)

    if (type === 'daily') {
      const { data: txs } = await supabaseAdmin
        .from('transactions')
        .select('type, amount')
        .eq('user_id', user.id)
        .eq('date', todayStr)
      const income = (txs || []).filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0)
      const expense = (txs || []).filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0)
      messageText = `🧪 *[TEST] Ringkasan Harian (${today.toLocaleDateString('id-ID')})*\n\n`
      if (txs && txs.length > 0) {
        messageText += `💚 Pemasukan: Rp${income.toLocaleString('id-ID')}\n`
        messageText += `❤️ Pengeluaran: Rp${expense.toLocaleString('id-ID')}\n`
      } else {
        messageText += `_(Belum ada transaksi hari ini. Notif asli akan SKIP kalau begini.)_`
      }
    } else if (type === 'weekly') {
      const lastWeek = new Date()
      lastWeek.setDate(lastWeek.getDate() - 7)
      const lastWeekStr = lastWeek.toISOString().split('T')[0]
      const { data: txs } = await supabaseAdmin
        .from('transactions')
        .select('type, amount')
        .eq('user_id', user.id)
        .gte('date', lastWeekStr)
      const income = (txs || []).filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0)
      const expense = (txs || []).filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0)
      messageText = `🧪 *[TEST] Ringkasan Mingguan*\n\n7 hari terakhir:\n💚 Pemasukan: Rp${income.toLocaleString('id-ID')}\n❤️ Pengeluaran: Rp${expense.toLocaleString('id-ID')}\n\n_(Notif asli cuma muncul tiap hari SENIN pagi)_`
    } else if (type === 'budget') {
      messageText = `🧪 *[TEST] Peringatan Budget*\n\n⚠️ Contoh kategori *Makanan* sudah 85% dari budget.\n\n_(Notif asli muncul kalau ada budget yang sudah ≥80% terpakai)_`
    } else if (type === 'trial') {
      const { data: sub } = await supabaseAdmin
        .from('subscriptions')
        .select('expires_at, plan')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .maybeSingle()
      let extraText = ''
      if (sub?.expires_at) {
        const diffDays = Math.ceil((new Date(sub.expires_at).getTime() - today.getTime()) / 86400000)
        extraText = `\n\nSisa trial Anda saat ini: *${diffDays} hari*`
      }
      messageText = `🧪 *[TEST] Reminder Masa Trial*\n\n⏳ Contoh: Trial Anda sisa 3 hari lagi!${extraText}\n\n_(Notif asli muncul saat tersisa 7, 3, 1, atau 0 hari)_`
    } else if (type === 'tips') {
      messageText = `🧪 *[TEST] Tips Keuangan AI*\n\n💡 Coba alokasikan 20% pemasukan ke tabungan dulu sebelum bayar pengeluaran rutin. Cara ini bikin nabung lebih konsisten daripada nunggu sisa di akhir bulan. 🌱\n\n_(Notif asli muncul tiap SENIN pagi via Gemini)_`
    }

    // Kirim ke Telegram dengan retry tanpa Markdown kalau format invalid
    const token = (process.env.TELEGRAM_BOT_TOKEN || '').trim()
    if (!token) {
      return NextResponse.json({ error: 'TELEGRAM_BOT_TOKEN belum diset di server' }, { status: 500 })
    }

    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: profile.telegram_id,
        text: messageText,
        parse_mode: 'Markdown',
      }),
    })

    if (!res.ok) {
      const errBody = await res.text().catch(() => '')
      // Retry tanpa Markdown
      const retry = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: profile.telegram_id, text: messageText }),
      })
      if (!retry.ok) {
        return NextResponse.json({
          error: `Gagal kirim ke Telegram. HTTP ${res.status}. Detail: ${errBody.substring(0, 200)}`
        }, { status: 500 })
      }
    }

    return NextResponse.json({
      success: true,
      sent: FRIENDLY_DESC[type],
      chat_id: profile.telegram_id,
    })
  } catch (err: any) {
    console.error('Test notification error:', err)
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 })
  }
}

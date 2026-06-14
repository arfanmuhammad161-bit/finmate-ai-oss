import { NextResponse } from 'next/server';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { chatWithGemini } from '@/lib/gemini';

async function logTelegramError(
  supabaseAdmin: SupabaseClient,
  chatId: string,
  errorDetail: string,
  payload: string
) {
  try {
    await supabaseAdmin.from('error_logs').insert({
      service: 'Telegram Bot',
      error_type: 'Send Message Failed',
      message: `Gagal kirim Telegram ke ${chatId}: ${errorDetail}`,
      metadata: {
        chat_id: chatId,
        source: 'cron/notifications',
        payload_preview: payload.slice(0, 200),
      },
    });
  } catch {
    // Jangan biarkan error logging menggagalkan cron utama
  }
}

async function sendTelegramMessage(
  supabaseAdmin: SupabaseClient,
  chatId: string,
  text: string
): Promise<boolean> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    await logTelegramError(supabaseAdmin, chatId, 'TELEGRAM_BOT_TOKEN tidak diset', text);
    return false;
  }
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'Markdown',
      }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => '(no body)');
      await logTelegramError(supabaseAdmin, chatId, `HTTP ${res.status}: ${body}`, text);
      // Fallback: coba kirim ulang tanpa Markdown (kasus umum: format markdown invalid)
      const retry = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text }),
      });
      return retry.ok;
    }
    return true;
  } catch (err: any) {
    await logTelegramError(supabaseAdmin, chatId, err?.message || String(err), text);
    return false;
  }
}

export async function GET(req: Request) {
  try {
    // Verifikasi cron secret (dari Vercel Cron)
    const url = new URL(req.url);
    const isAdminTest = url.searchParams.get('admin_test') === 'true';

    const authHeader = req.headers.get('authorization');
    if (!isAdminTest && process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      if (process.env.NODE_ENV === 'production') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Ambil profil users yang connect Telegram dan punya settings
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from('profiles')
      .select('id, telegram_id, notification_settings, trial_ends_at')
      .not('telegram_id', 'is', null);

    if (profilesError) throw profilesError;

    // Paksa menggunakan zona waktu WIB (Asia/Jakarta)
    const todayStr = new Intl.DateTimeFormat('fr-CA', { timeZone: 'Asia/Jakarta' }).format(new Date());
    const today = new Date(todayStr);
    const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday
    
    // Untuk Ringkasan Mingguan (misal Senin pagi)
    const isWeeklyDay = dayOfWeek === 1;

    for (const profile of profiles || []) {
      const settings = profile.notification_settings || {
        budgetAlert: true,
        dailySummary: true,
        weeklySummary: false,
        trialReminder: true,
        aiTips: false
      };

      // 1. Ringkasan Harian
      if (settings.dailySummary) {
        // Ambil transaksi hari ini
        const { data: txs } = await supabaseAdmin
          .from('transactions')
          .select('type, amount')
          .eq('user_id', profile.id)
          .eq('date', todayStr);
          
        if (txs && txs.length > 0) {
          const income = txs.filter((t: any) => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0);
          const expense = txs.filter((t: any) => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);
          
          let msg = `📅 *Ringkasan Harian (${today.toLocaleDateString('id-ID')})*\n\n`;
          if (income > 0) msg += `💚 Pemasukan: Rp${income.toLocaleString('id-ID')}\n`;
          if (expense > 0) msg += `❤️ Pengeluaran: Rp${expense.toLocaleString('id-ID')}\n`;
          
          await sendTelegramMessage(supabaseAdmin, profile.telegram_id, msg);
        }
      }

      // 2. Budget Alert
      if (settings.budgetAlert) {
        const month = today.getMonth() + 1;
        const year = today.getFullYear();
        
        // Ambil budget bulan ini
        const { data: budgets } = await supabaseAdmin
          .from('budgets')
          .select('category_id, category_name, amount')
          .eq('user_id', profile.id)
          .eq('month', month)
          .eq('year', year);
          
        if (budgets && budgets.length > 0) {
          // Ambil pengeluaran bulan ini
          const monthStart = new Date(year, month - 1, 1).toISOString().split('T')[0];
          const { data: expenses } = await supabaseAdmin
            .from('transactions')
            .select('category_id, amount')
            .eq('user_id', profile.id)
            .eq('type', 'expense')
            .gte('date', monthStart);
            
          for (const budget of budgets) {
            const spent = (expenses || [])
              .filter((e: any) => e.category_id === budget.category_id)
              .reduce((sum, e) => sum + Number(e.amount), 0);
              
            const percentage = (spent / Number(budget.amount)) * 100;
            if (percentage >= 80 && percentage < 100) {
              await sendTelegramMessage(
                supabaseAdmin,
                profile.telegram_id,
                `⚠️ *Peringatan Budget!*\n\nPengeluaran kategori *${budget.category_name}* sudah mencapai ${percentage.toFixed(0)}% dari budget bulanan Anda.\n\nSisa budget: Rp${(Number(budget.amount) - spent).toLocaleString('id-ID')}`
              );
            } else if (percentage >= 100) {
              await sendTelegramMessage(
                supabaseAdmin,
                profile.telegram_id,
                `🚨 *Budget Overlimit!*\n\nPengeluaran kategori *${budget.category_name}* telah MELEBIHI budget bulanan Anda.`
              );
            }
          }
        }
      }

      // 3. Ringkasan Mingguan
      if (settings.weeklySummary && isWeeklyDay) {
        // Logika mingguan: 7 hari terakhir
        const lastWeek = new Date();
        lastWeek.setDate(lastWeek.getDate() - 7);
        const lastWeekStr = lastWeek.toISOString().split('T')[0];
        
        const { data: txs } = await supabaseAdmin
          .from('transactions')
          .select('type, amount')
          .eq('user_id', profile.id)
          .gte('date', lastWeekStr);
          
        const income = (txs || []).filter((t: any) => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0);
        const expense = (txs || []).filter((t: any) => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);
        
        await sendTelegramMessage(
          supabaseAdmin,
          profile.telegram_id,
          `📊 *Ringkasan Mingguan Anda*\n\nDalam 7 hari terakhir:\n💚 Pemasukan: Rp${income.toLocaleString('id-ID')}\n❤️ Pengeluaran: Rp${expense.toLocaleString('id-ID')}`
        );
      }
      
      // 4. Reminder Trial Berakhir
      if (settings.trialReminder && profile.trial_ends_at) {
        const trialDate = new Date(profile.trial_ends_at);
        const diffTime = trialDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 7 || diffDays === 3 || diffDays === 1) {
          await sendTelegramMessage(
            supabaseAdmin,
            profile.telegram_id,
            `⏳ *Masa Trial Anda Tersisa ${diffDays} Hari Lagi!*\n\nJangan lupa untuk segera upgrade ke akun Pro untuk terus menikmati semua fitur tanpa batas.`
          );
        } else if (diffDays === 0) {
          await sendTelegramMessage(
            supabaseAdmin,
            profile.telegram_id,
            `❌ *Masa Trial FinMate AI Anda Telah Berakhir!*\n\nSilakan kunjungi aplikasi web dan hubungi admin untuk melakukan pembayaran manual agar Anda bisa terus mencatat keuangan.`
          );
        }
      }

      // 5. Tips Keuangan AI (Mingguan)
      if (settings.aiTips && isWeeklyDay) {
        // Ambil transaksi sebulan terakhir untuk konteks AI
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
        const { data: recentTxs } = await supabaseAdmin
          .from('transactions')
          .select('type, amount, category_name')
          .eq('user_id', profile.id)
          .gte('date', monthStart)
          .limit(50);
          
        let contextData = 'Belum ada transaksi bulan ini.';
        if (recentTxs && recentTxs.length > 0) {
          const totalExpense = recentTxs.filter((t:any) => t.type === 'expense').reduce((a, b) => a + Number(b.amount), 0);
          contextData = `Pengeluaran bulan ini Rp${totalExpense}. Top kategori: ${[...new Set(recentTxs.map((t:any)=>t.category_name))].slice(0,3).join(', ')}`;
        }

        const prompt = "Berikan 1 paragraf singkat (maks 2 kalimat) saran hemat yang ramah dan memotivasi berdasarkan data ini. Format pesan santai menggunakan emoji.";
        const history = [{ role: 'user', content: `Data pengguna: ${contextData}. ${prompt}` }];
        
        const tipMessage = await chatWithGemini(
          "Anda adalah penasihat keuangan pribadi FinMate AI yang ahli, ramah, dan solutif.",
          history
        );

        if (tipMessage) {
          await sendTelegramMessage(
            supabaseAdmin,
            profile.telegram_id,
            `💡 *Tips Keuangan AI Minggu Ini:*\n\n${tipMessage}`
          );
        }
      }
    }

    return NextResponse.json({ success: true, message: 'Cron job executed successfully' });
  } catch (error: any) {
    console.error('Error in cron job:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

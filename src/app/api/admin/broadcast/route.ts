import { NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/admin-auth';

export async function POST(req: Request) {
  try {
    const auth = await verifyAdmin();
    if (auth.error) return auth.error;
    const { supabaseAdmin } = auth;

    const { title, message } = await req.json();

    if (!title || !message) {
      return NextResponse.json({ error: 'Title and message required' }, { status: 400 });
    }

    // Ambil semua user_id dari auth.users
    const { data: users, error: userError } = await supabaseAdmin.auth.admin.listUsers();
    if (userError) throw userError;

    // Siapkan array notifikasi massal
    const notifications = users.users.map((u: { id: string }) => ({
      user_id: u.id,
      title: title,
      message: message,
      is_read: false
    }));

    // Insert ke tabel notifications (jika kosong akan gagal, tapi itu wajar jika tabel belum dibuat)
    const { error: insertError } = await supabaseAdmin
      .from('notifications')
      .insert(notifications);

    if (insertError) {
      if (insertError.code === '42P01') {
        console.warn('Tabel notifications belum ada.');
      } else {
        throw insertError;
      }
    }

    // Catat juga ke system logs (jika ada) bahwa broadcast dikirim
    // Catat juga ke system logs (jika ada) bahwa broadcast dikirim
    try {
      const { error: logError } = await supabaseAdmin.from('system_logs').insert({
        service: 'Admin Dashboard',
        type: 'Broadcast Sent',
        message: `Broadcast "${title}" dikirim ke ${notifications.length} users.`,
        status: 'Resolved'
      });
      if (logError && logError.code === '42P01') {
        console.warn('Tabel system_logs belum ada.');
      } else if (logError) {
        console.error('System log error:', logError);
      }
    } catch (e) {
      console.warn('Gagal mencatat ke system_logs', e);
    }

    // === Kirim juga ke Telegram untuk user yang sudah connect ===
    const token = (process.env.TELEGRAM_BOT_TOKEN || '').trim();
    let telegramSent = 0;
    let telegramFailed = 0;

    if (token) {
      const { data: tgProfiles } = await supabaseAdmin
        .from('profiles')
        .select('telegram_id')
        .not('telegram_id', 'is', null);

      const telegramText = `📢 *${title}*\n\n${message}`;

      for (const p of tgProfiles || []) {
        try {
          const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: p.telegram_id,
              text: telegramText,
              parse_mode: 'Markdown',
            }),
          });
          if (res.ok) {
            telegramSent++;
          } else {
            // Retry tanpa Markdown kalau format invalid
            const retry = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ chat_id: p.telegram_id, text: telegramText }),
            });
            if (retry.ok) telegramSent++;
            else telegramFailed++;
          }
        } catch {
          telegramFailed++;
        }
      }
    }

    return NextResponse.json({
      success: true,
      count: notifications.length,
      telegramSent,
      telegramFailed,
    });
  } catch (error: any) {
    console.error('API Admin Broadcast Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

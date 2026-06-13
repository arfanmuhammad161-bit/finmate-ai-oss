import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: Request) {
  try {
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { title, message } = await req.json();

    if (!title || !message) {
      return NextResponse.json({ error: 'Title and message required' }, { status: 400 });
    }

    // Ambil semua user_id dari auth.users
    const { data: users, error: userError } = await supabaseAdmin.auth.admin.listUsers();
    if (userError) throw userError;

    // Siapkan array notifikasi massal
    const notifications = users.users.map(u => ({
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

    return NextResponse.json({ success: true, count: notifications.length });
  } catch (error: any) {
    console.error('API Admin Broadcast Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

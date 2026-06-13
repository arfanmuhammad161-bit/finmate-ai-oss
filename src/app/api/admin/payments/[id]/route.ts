// @ts-nocheck
import { NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/admin-auth';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await verifyAdmin();
    if (auth.error) return auth.error;

    const { supabaseAdmin } = auth;
    const { action } = await req.json();
    const resolvedParams = await params;
    const paymentId = resolvedParams.id;

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Aksi tidak valid' }, { status: 400 });
    }

    // Ambil data payment
    const { data: payment, error: paymentError } = await supabaseAdmin
      .from('payments')
      .select('*')
      .eq('id', paymentId)
      .single();

    if (paymentError || !payment) {
      return NextResponse.json({ error: 'Pembayaran tidak ditemukan' }, { status: 404 });
    }

    if (payment.status !== 'pending') {
      return NextResponse.json({ error: 'Pembayaran ini sudah diproses' }, { status: 400 });
    }

    if (action === 'approve') {
      const plan = payment.plan;
      const userId = payment.user_id;

      const now = new Date();
      if (plan === 'monthly') now.setMonth(now.getMonth() + 1);
      else if (plan === 'yearly') now.setFullYear(now.getFullYear() + 1);

      const expiresAt = now.toISOString();

      // 1. Upsert subscription dulu (aman untuk user baru & lama)
      const { error: subError } = await supabaseAdmin
        .from('subscriptions')
        .upsert({
          user_id: userId,
          plan: plan,
          status: 'active',
          expires_at: expiresAt
        }, { onConflict: 'user_id' });

      if (subError) {
        console.error('Subscription update error:', subError);
        return NextResponse.json({ error: 'Gagal mengaktifkan subscription' }, { status: 500 });
      }

      // 2. Update status payment -> success
      const { error: payError } = await supabaseAdmin
        .from('payments')
        .update({ status: 'success', updated_at: new Date().toISOString() })
        .eq('id', paymentId);

      if (payError) {
        console.error('Payment update error:', payError);
        return NextResponse.json({ error: 'Gagal update status pembayaran' }, { status: 500 });
      }

    } else if (action === 'reject') {
      const { error: payError } = await supabaseAdmin
        .from('payments')
        .update({ status: 'failed', updated_at: new Date().toISOString() })
        .eq('id', paymentId);

      if (payError) {
        return NextResponse.json({ error: 'Gagal update status pembayaran' }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Admin Payment Action Error:', error);
    return NextResponse.json({ error: error.message || 'Terjadi kesalahan sistem' }, { status: 500 });
  }
}

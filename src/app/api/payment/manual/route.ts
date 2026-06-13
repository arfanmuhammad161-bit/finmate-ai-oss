import { NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';

export async function POST(req: Request) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { plan, proof_url, coupon_code } = await req.json();

    if (!['monthly', 'yearly'].includes(plan)) {
      return NextResponse.json({ error: 'Paket tidak valid' }, { status: 400 });
    }

    const baseAmount = plan === 'monthly' ? 29000 : 249000;
    let finalAmount = baseAmount;
    let isFree = false;
    let validCoupon = null;

    // Supabase admin untuk operasi yang butuh privilege
    const supabaseAdmin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Validasi kupon jika ada
    if (coupon_code) {
      const { data: coupon } = await supabaseAdmin
        .from('coupons')
        .select('*')
        .eq('code', coupon_code.toUpperCase())
        .single();
        
      if (coupon && coupon.used_count < coupon.max_uses) {
        // Cek apakah kupon sudah expired
        if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
          return NextResponse.json({ error: 'Kupon sudah kadaluarsa' }, { status: 400 });
        }
        
        // Cek applicable_plan
        if (coupon.applicable_plan && coupon.applicable_plan !== 'all' && coupon.applicable_plan !== plan) {
          const planName = coupon.applicable_plan === 'monthly' ? '1 Bulan' : '1 Tahun';
          return NextResponse.json({ error: `Kupon ini khusus untuk paket langganan ${planName}` }, { status: 400 });
        }

        validCoupon = coupon;
        if (coupon.discount_type === 'percent') {
          finalAmount = Math.max(0, baseAmount - (baseAmount * coupon.discount_value / 100));
        } else {
          finalAmount = Math.max(0, baseAmount - coupon.discount_value);
        }
        isFree = finalAmount === 0;
      } else {
        return NextResponse.json({ error: 'Kupon tidak valid atau limit habis' }, { status: 400 });
      }
    }

    if (!isFree && !proof_url) {
      return NextResponse.json({ error: 'Bukti transfer tidak boleh kosong' }, { status: 400 });
    }

    const orderId = `MANUAL-${user.id.substring(0, 5)}-${plan.toUpperCase()}-${Date.now()}`;
    const paymentStatus = isFree ? 'success' : 'pending';

    const { error } = await supabaseAdmin
      .from('payments')
      .insert({
        user_id: user.id,
        midtrans_order_id: orderId,
        amount: finalAmount,
        plan: plan,
        status: paymentStatus,
        proof_url: proof_url || null
      });

    if (error) {
      console.error('Manual Payment Insert Error:', error);
      return NextResponse.json({ error: 'Gagal mencatat pembayaran' }, { status: 500 });
    }

    // Jika gratis 100%, langsung aktifkan paket dan tambah used_count kupon
    if (isFree && validCoupon) {
      // 1. Update kupon used_count
      await supabaseAdmin
        .from('coupons')
        .update({ used_count: validCoupon.used_count + 1 })
        .eq('id', validCoupon.id);

      // 2. Aktifkan subscription via upsert (aman untuk user baru maupun lama)
      const now = new Date();
      if (plan === 'monthly') now.setMonth(now.getMonth() + 1);
      else if (plan === 'yearly') now.setFullYear(now.getFullYear() + 1);
      
      const { error: subError } = await supabaseAdmin
        .from('subscriptions')
        .upsert({
          user_id: user.id,
          plan: plan,
          status: 'active',
          expires_at: now.toISOString()
        }, { onConflict: 'user_id' });

      if (subError) {
        console.error('Subscription upsert error:', subError);
        return NextResponse.json({ error: 'Gagal mengaktifkan subscription' }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true, message: isFree ? 'Paket diaktifkan via kupon.' : 'Pembayaran berhasil dikirim.' });

  } catch (error: any) {
    console.error('Manual Payment API Error:', error);
    return NextResponse.json({ error: error.message || 'Terjadi kesalahan sistem' }, { status: 500 });
  }
}

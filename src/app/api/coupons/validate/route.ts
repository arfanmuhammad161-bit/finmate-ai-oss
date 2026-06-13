import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Pakai service role karena tabel coupons diamankan dari public select
const getAdminSupabase = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { code, plan } = await req.json();

    if (!code) {
      return NextResponse.json({ error: 'Kode kupon kosong' }, { status: 400 });
    }

    const supabase = getAdminSupabase();
    
    // Cari kupon
    const { data: coupon, error } = await supabase
      .from('coupons')
      .select('*')
      .eq('code', code.toUpperCase())
      .single();

    if (error || !coupon) {
      return NextResponse.json({ error: 'Kode kupon tidak ditemukan' }, { status: 404 });
    }

    // Cek kuota
    if (coupon.used_count >= coupon.max_uses) {
      return NextResponse.json({ error: 'Kupon sudah habis (mencapai batas pemakaian)' }, { status: 400 });
    }

    // Cek is_active
    if (coupon.is_active === false) {
      return NextResponse.json({ error: 'Kupon tidak aktif' }, { status: 400 });
    }

    // Cek expired (jika ada valid_from dan valid_until)
    const now = new Date();
    if (coupon.valid_from && new Date(coupon.valid_from) > now) {
      return NextResponse.json({ error: 'Kupon belum bisa digunakan (masa promosi belum mulai)' }, { status: 400 });
    }
    if (coupon.valid_until && new Date(coupon.valid_until) < now) {
      return NextResponse.json({ error: 'Kupon sudah kadaluarsa (masa promosi habis)' }, { status: 400 });
    }

    // Cek applicable_plan
    if (coupon.applicable_plan && coupon.applicable_plan !== 'all' && plan && coupon.applicable_plan !== plan) {
      const planName = coupon.applicable_plan === 'monthly' ? '1 Bulan' : '1 Tahun';
      return NextResponse.json({ error: `Kupon ini khusus untuk paket langganan ${planName}` }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      coupon: {
        code: coupon.code,
        discount_type: coupon.discount_type,
        discount_value: coupon.discount_value,
        max_discount_amount: coupon.max_discount_amount,
        min_purchase_amount: coupon.min_purchase_amount,
        name: coupon.name
      }
    });

  } catch (error: any) {
    return NextResponse.json({ error: 'Terjadi kesalahan saat memvalidasi kupon' }, { status: 500 });
  }
}

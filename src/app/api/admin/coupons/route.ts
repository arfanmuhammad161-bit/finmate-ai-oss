// @ts-nocheck
import { NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/admin-auth';

export async function GET() {
  try {
    const auth = await verifyAdmin();
    if (auth.error) return auth.error;

    const { supabaseAdmin } = auth;
    const { data, error } = await supabaseAdmin
      .from('coupons')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return NextResponse.json({ coupons: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const auth = await verifyAdmin();
    if (auth.error) return auth.error;

    const { supabaseAdmin } = auth;
    const { name, code, discount_type, discount_value, max_uses, valid_from, valid_until, max_discount_amount, min_purchase_amount, voucher_type, applicable_plan } = await req.json();

    if (!name || !code || !discount_type || !discount_value || !valid_from || !valid_until) {
      return NextResponse.json({ error: 'Data wajib tidak lengkap' }, { status: 400 });
    }

    // Validasi tipe diskon
    if (!['percent', 'fixed'].includes(discount_type)) {
      return NextResponse.json({ error: 'Tipe diskon tidak valid' }, { status: 400 });
    }

    // Validasi nilai diskon untuk persen (harus 1-100)
    const numValue = Number(discount_value);
    if (isNaN(numValue) || numValue <= 0) {
      return NextResponse.json({ error: 'Nilai diskon tidak valid' }, { status: 400 });
    }
    if (discount_type === 'percent' && numValue > 100) {
      return NextResponse.json({ error: 'Diskon persen tidak boleh lebih dari 100%' }, { status: 400 });
    }

    // Validasi max_uses
    const parsedMaxUses = parseInt(max_uses);
    if (isNaN(parsedMaxUses) || parsedMaxUses < 1) {
      return NextResponse.json({ error: 'Batas pemakaian tidak valid' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('coupons')
      .insert({
        name: name,
        code: code.toUpperCase().trim(),
        discount_type: discount_type,
        discount_value: numValue,
        max_uses: parsedMaxUses,
        used_count: 0,
        valid_from: valid_from,
        valid_until: valid_until,
        max_discount_amount: max_discount_amount || null,
        min_purchase_amount: min_purchase_amount || null,
        applicable_plan: applicable_plan || 'all',
        is_active: true
      } as any)
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'Kode kupon sudah ada' }, { status: 400 });
      }
      throw error;
    }

    return NextResponse.json({ coupon: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

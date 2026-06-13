import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  try {
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: subs, error } = await supabaseAdmin
      .from('subscriptions')
      .select('plan, status, created_at');

    if (error) throw error;

    let totalRevenue = 0;
    let monthlyCount = 0;
    let yearlyCount = 0;

    (subs || []).forEach(s => {
      // Simplifikasi: anggap semua yang punya plan monthly/yearly sudah bayar.
      // Di sistem yang lebih kompleks, ini harusnya membaca dari tabel 'payments'
      if (s.plan === 'monthly') {
        totalRevenue += 29000;
        monthlyCount++;
      } else if (s.plan === 'yearly') {
        totalRevenue += 249000;
        yearlyCount++;
      }
    });

    return NextResponse.json({
      totalRevenue,
      monthlyCount,
      yearlyCount,
      totalPaidUsers: monthlyCount + yearlyCount
    });

  } catch (error: any) {
    console.error('API Admin Revenue Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

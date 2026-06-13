import { NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/admin-auth';

export async function GET() {
  try {
    const auth = await verifyAdmin();
    if (auth.error) return auth.error;

    const { supabaseAdmin } = auth;

    const { data, error } = await supabaseAdmin
      .from('payments')
      .select('*, profiles(full_name)')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ payments: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

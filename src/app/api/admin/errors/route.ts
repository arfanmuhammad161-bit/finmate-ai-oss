import { NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/admin-auth';

export async function GET() {
  try {
    const auth = await verifyAdmin();
    if (auth.error) return auth.error;
    const { supabaseAdmin } = auth;

    const { data: logs, error } = await supabaseAdmin
      .from('system_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      if (error.code === '42P01') return NextResponse.json([]); // Table missing
      throw error;
    }

    return NextResponse.json(logs || []);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT() {
  try {
    const auth = await verifyAdmin();
    if (auth.error) return auth.error;
    const { supabaseAdmin } = auth;

    // Clear all resolved errors
    const { error } = await supabaseAdmin
      .from('system_logs')
      .delete()
      .eq('status', 'Resolved');

    if (error && error.code !== '42P01') throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

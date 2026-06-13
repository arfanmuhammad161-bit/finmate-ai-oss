import { NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/admin-auth';

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await verifyAdmin();
    if (auth.error) return auth.error;

    const { supabaseAdmin } = auth;
    const resolvedParams = await params;
    const id = resolvedParams.id;

    const { error } = await supabaseAdmin
      .from('coupons')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

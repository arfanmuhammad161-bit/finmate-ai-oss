import { NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/admin-auth';

export async function GET() {
  try {
    const auth = await verifyAdmin();
    if (auth.error) return auth.error;
    const { supabaseAdmin } = auth;

    // Get all subscriptions
    const { data: subs, error: subsError } = await supabaseAdmin
      .from('subscriptions')
      .select('*')
      .order('created_at', { ascending: false });

    if (subsError) throw subsError;

    // Get all profiles to match names
    const { data: profiles, error: profError } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name');
      
    if (profError) throw profError;

    // Get user emails from auth
    const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (authError) throw authError;

    // Merge data
    const enrichedSubs = (subs || []).map((sub: any) => {
      const profile = profiles?.find((p: { id: string }) => p.id === sub.user_id);
      const authUser = authUsers.users.find((u: { id: string }) => u.id === sub.user_id);
      return {
        ...sub,
        full_name: profile?.full_name || 'Tanpa Nama',
        email: authUser?.email || 'Tanpa Email'
      };
    });

    return NextResponse.json(enrichedSubs);

  } catch (error: any) {
    console.error('API Admin Subscriptions Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  try {
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

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
    const enrichedSubs = (subs || []).map(sub => {
      const profile = profiles?.find(p => p.id === sub.user_id);
      const authUser = authUsers.users.find(u => u.id === sub.user_id);
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

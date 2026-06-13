import { NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/admin-auth';

export async function GET(req: Request) {
  try {
    const auth = await verifyAdmin();
    if (auth.error) return auth.error;

    const { supabaseAdmin } = auth;

    // Fetch all users from auth system
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.listUsers();
    if (authError) throw authError;

    const authUsers = authData.users;

    // Fetch from profiles and join with subscriptions
    const { data: profiles, error } = await supabaseAdmin
      .from('profiles')
      .select('*, subscriptions(plan, status, expires_at)')
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Fetch total transactions count per user
    // Since we can't easily group by in Postgrest JS client, we fetch counts or just all transactions
    // Actually, for a small number of users, we can just fetch transactions count
    // A better approach is to use a raw query or just fetch all transactions and reduce them.
    // Given the potential scale, let's fetch only `user_id` from transactions
    const { data: txsData, error: txsError } = await supabaseAdmin
      .from('transactions')
      .select('user_id');
      
    const txCounts: Record<string, number> = {};
    if (!txsError && txsData) {
      txsData.forEach((tx: any) => {
        txCounts[tx.user_id] = (txCounts[tx.user_id] || 0) + 1;
      });
    }

    const allUsers = profiles.map((p: any) => {
      // Find the active subscription 
      const subs = Array.isArray(p.subscriptions) ? p.subscriptions : [];
      const activeSub = subs.find((s: any) => s.status === 'active') || subs[0] || { plan: 'trial', expires_at: null };

      // Find the email from auth users
      const authUser = authUsers.find((u: any) => u.id === p.id);

      return {
        id: p.id,
        email: authUser?.email || 'No Email',
        full_name: p.full_name || 'User',
        telegram_id: p.telegram_id || '-',
        telegram_username: p.telegram_username || '-',
        avatar_url: p.avatar_url || '',
        plan: activeSub.plan,
        expires_at: activeSub.expires_at,
        created_at: p.created_at,
        financial_goal: p.financial_goal || 'Tidak ada target',
        notification_settings: p.notification_settings,
        total_transactions: txCounts[p.id] || 0
      };
    });

    return NextResponse.json(allUsers);
  } catch (error: any) {
    console.error('Error fetching admin users:', error);
    return NextResponse.json([], { status: 500 });
  }
}

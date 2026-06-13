import { NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/admin-auth';

export async function GET(req: Request) {
  try {
    const auth = await verifyAdmin();
    if (auth.error) return auth.error;

    const { supabaseAdmin } = auth;

    // 1. Get total users from profiles
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, avatar_url, created_at, subscriptions(plan, status, expires_at)')
      .order('created_at', { ascending: false });

    if (profilesError) throw profilesError;

    const totalUsers = profiles.length;

    const recentUsers = profiles.slice(0, 5).map((p: any) => {
      const subs = Array.isArray(p.subscriptions) ? p.subscriptions : [];
      const activeSub = subs.find((s: any) => s.status === 'active') || subs[0] || { plan: 'trial' };
      return {
        id: p.id,
        name: p.full_name || 'User',
        plan: activeSub.plan || 'trial',
        status: 'Active',
        joinDate: new Date(p.created_at).toLocaleDateString('id-ID')
      };
    });

    // 2. Get real revenue from payments with status=success and amount>0
    const { data: paymentsData, error: paymentsError } = await supabaseAdmin
      .from('payments')
      .select('amount, plan, created_at')
      .eq('status', 'success')
      .gt('amount', 0);

    if (paymentsError) throw paymentsError;

    const totalRevenue = (paymentsData || []).reduce((sum: number, p: any) => sum + Number(p.amount), 0);

    // 3. Count active plans
    const { data: subscriptions, error: subsError } = await supabaseAdmin
      .from('subscriptions')
      .select('plan, status, expires_at')
      .eq('status', 'active');

    if (subsError) throw subsError;

    const now = new Date();
    const activeSubs = (subscriptions || []).filter((s: any) => !s.expires_at || new Date(s.expires_at) > now);
    const trialCount = activeSubs.filter((s: any) => s.plan === 'trial').length;
    const proCount = activeSubs.filter((s: any) => s.plan === 'monthly' || s.plan === 'yearly').length;

    // 4. Build monthly chart data
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const currentYear = new Date().getFullYear();

    const chartData = months.map((m, idx) => {
      const usersInMonth = profiles.filter((p: any) => {
        const d = new Date(p.created_at);
        return d.getFullYear() === currentYear && d.getMonth() <= idx;
      }).length;

      const revenueInMonth = (paymentsData || []).filter((p: any) => {
        if (!p.created_at) return false;
        const d = new Date(p.created_at);
        return d.getFullYear() === currentYear && d.getMonth() === idx;
      }).reduce((sum: number, p: any) => sum + Number(p.amount), 0);

      return { name: m, users: usersInMonth, revenue: revenueInMonth };
    });

    return NextResponse.json({
      totalUsers,
      recentUsers,
      totalVolume: totalRevenue,
      activeTrials: trialCount,
      proUsers: proCount,
      chartData
    });

  } catch (error: any) {
    console.error('Error fetching admin metrics:', error);
    return NextResponse.json({
      totalUsers: 0,
      recentUsers: [],
      totalVolume: 0,
      activeTrials: 0,
      proUsers: 0,
      chartData: []
    });
  }
}

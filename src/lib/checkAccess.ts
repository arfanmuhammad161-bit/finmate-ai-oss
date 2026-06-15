import { SupabaseClient } from "@supabase/supabase-js";

const ADMIN_EMAILS = ["arfanmuhammad161@gmail.com"];

export interface AccessStatus {
  hasAccess: boolean;
  plan: string;
  isAdmin: boolean;
  isExpired: boolean;
  daysLeft: number;
  reason?: string;
}

/**
 * Cek apakah user masih punya akses aktif (trial belum habis ATAU Pro aktif).
 * Admin selalu hasAccess=true.
 *
 * Dipakai server-side dengan supabaseAdmin (service role) untuk enforcement
 * yang tidak bisa di-bypass dari client.
 */
export async function checkUserAccess(
  supabaseAdmin: SupabaseClient,
  userId: string,
  email?: string | null
): Promise<AccessStatus> {
  const isAdmin = !!email && ADMIN_EMAILS.includes(email);
  if (isAdmin) {
    return { hasAccess: true, plan: "admin", isAdmin: true, isExpired: false, daysLeft: 9999 };
  }

  const { data: sub } = await supabaseAdmin
    .from("subscriptions")
    .select("plan, status, expires_at")
    .eq("user_id", userId)
    .eq("status", "active")
    .maybeSingle();

  // Tidak ada subscription aktif sama sekali → tidak punya akses
  if (!sub) {
    return {
      hasAccess: false,
      plan: "none",
      isAdmin: false,
      isExpired: true,
      daysLeft: 0,
      reason: "Tidak ada langganan aktif.",
    };
  }

  const now = Date.now();
  const expiresAt = sub.expires_at ? new Date(sub.expires_at).getTime() : 0;
  const daysLeft = expiresAt > now ? Math.ceil((expiresAt - now) / 86400000) : 0;
  const isExpired = expiresAt > 0 && expiresAt <= now;

  // Trial atau Pro yang sudah lewat tanggal expired → blokir
  if (isExpired) {
    return {
      hasAccess: false,
      plan: sub.plan,
      isAdmin: false,
      isExpired: true,
      daysLeft: 0,
      reason: sub.plan === "trial"
        ? "Masa trial 14 hari Anda sudah berakhir."
        : "Masa langganan Anda sudah berakhir.",
    };
  }

  return {
    hasAccess: true,
    plan: sub.plan,
    isAdmin: false,
    isExpired: false,
    daysLeft,
  };
}

import { SupabaseClient } from "@supabase/supabase-js";

export interface RateLimitConfig {
  /** Maksimum request per jam. */
  perHour: number;
  /** Maksimum request per hari. */
  perDay: number;
}

export interface RateLimitResult {
  allowed: boolean;
  /** Alasan dalam bahasa manusia (untuk ditampilkan ke user). */
  reason?: string;
  /** Berapa lagi yang tersisa di jendela jam. */
  hourRemaining?: number;
  /** Berapa lagi yang tersisa di jendela hari. */
  dayRemaining?: number;
}

/** Limit default untuk user trial — proteksi kuota Gemini gratis. */
export const TRIAL_AI_LIMIT: RateLimitConfig = { perHour: 20, perDay: 100 };
/** Limit untuk user Pro Bulanan — lebih longgar tapi tetap ada batas. */
export const PRO_MONTHLY_AI_LIMIT: RateLimitConfig = { perHour: 60, perDay: 500 };
/** Limit untuk user Pro Tahunan — paling longgar. */
export const PRO_YEARLY_AI_LIMIT: RateLimitConfig = { perHour: 100, perDay: 1000 };

function bucketsFor(now: Date) {
  const iso = now.toISOString();
  return {
    hour: `hour:${iso.substring(0, 13)}`, // "hour:2026-06-15T03"
    day: `day:${iso.substring(0, 10)}`,   // "day:2026-06-15"
  };
}

/**
 * Cek apakah user masih boleh request, dan increment counter kalau boleh.
 * Skip rate limit untuk admin (return allowed=true tanpa increment).
 */
export async function checkAiRateLimit(
  supabaseAdmin: SupabaseClient,
  userId: string,
  config: RateLimitConfig,
  options?: { skip?: boolean }
): Promise<RateLimitResult> {
  if (options?.skip) {
    return { allowed: true };
  }

  const now = new Date();
  const { hour, day } = bucketsFor(now);

  try {
    // Ambil counter saat ini untuk dua bucket sekaligus
    const { data } = await supabaseAdmin
      .from("ai_usage_counters")
      .select("bucket, count")
      .eq("user_id", userId)
      .in("bucket", [hour, day]);

    const hourCount = data?.find((r: any) => r.bucket === hour)?.count || 0;
    const dayCount = data?.find((r: any) => r.bucket === day)?.count || 0;

    if (hourCount >= config.perHour) {
      return {
        allowed: false,
        reason: `Anda sudah pakai ${config.perHour} permintaan AI dalam 1 jam terakhir. Coba lagi dalam ~1 jam.`,
        hourRemaining: 0,
        dayRemaining: Math.max(0, config.perDay - dayCount),
      };
    }
    if (dayCount >= config.perDay) {
      return {
        allowed: false,
        reason: `Limit harian (${config.perDay} permintaan) tercapai. Reset besok pagi.`,
        hourRemaining: Math.max(0, config.perHour - hourCount),
        dayRemaining: 0,
      };
    }

    // Increment kedua bucket. Jangan blocking error — kalau gagal, tetap izinkan
    // (better UX daripada user di-reject karena DB hiccup).
    const nowIso = now.toISOString();
    await Promise.all([
      supabaseAdmin
        .from("ai_usage_counters")
        .upsert(
          { user_id: userId, bucket: hour, count: hourCount + 1, updated_at: nowIso },
          { onConflict: "user_id,bucket" }
        ),
      supabaseAdmin
        .from("ai_usage_counters")
        .upsert(
          { user_id: userId, bucket: day, count: dayCount + 1, updated_at: nowIso },
          { onConflict: "user_id,bucket" }
        ),
    ]);

    return {
      allowed: true,
      hourRemaining: config.perHour - hourCount - 1,
      dayRemaining: config.perDay - dayCount - 1,
    };
  } catch (err) {
    console.warn("[rateLimit] error, fail-open:", err);
    // Fail open — jangan blokir user karena masalah DB
    return { allowed: true };
  }
}

/** Pilih config berdasarkan plan user. */
export function configForPlan(plan: string | undefined | null): RateLimitConfig {
  if (plan === "yearly") return PRO_YEARLY_AI_LIMIT;
  if (plan === "monthly") return PRO_MONTHLY_AI_LIMIT;
  return TRIAL_AI_LIMIT;
}

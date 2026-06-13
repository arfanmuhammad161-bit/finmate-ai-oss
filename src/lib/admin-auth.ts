import { createClient as createServerClient } from '@/lib/supabase/server';
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// List of admin emails
const ADMIN_EMAILS = ['arfanmuhammad161@gmail.com'];

/**
 * Verifies that the caller is authenticated and is an admin.
 * Returns { supabaseAdmin, userId, email } on success.
 * Returns { error: NextResponse } on failure.
 */
export async function verifyAdmin(): Promise<
  { supabaseAdmin: any; userId: string; email: string; error?: never } |
  { error: NextResponse; supabaseAdmin?: never; userId?: never; email?: never }
> {
  try {
    const supabase = await createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      };
    }

    if (!user.email || !ADMIN_EMAILS.includes(user.email)) {
      return {
        error: NextResponse.json({ error: 'Forbidden: Admin only' }, { status: 403 })
      };
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    return { supabaseAdmin, userId: user.id, email: user.email };
  } catch (e: any) {
    return {
      error: NextResponse.json({ error: e.message || 'Internal error' }, { status: 500 })
    };
  }
}

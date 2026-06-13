import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') || searchParams.get('redirect_to') || '/dashboard'

  if (code) {
    const supabase = await createClient()
    await supabase.auth.exchangeCodeForSession(code)
  }

  // Fallback to dashboard if next is somehow not set
  return NextResponse.redirect(`${origin}${next.startsWith('/') ? next : '/' + next}`)
}

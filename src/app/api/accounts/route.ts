import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: accounts, error } = await supabase
    .from('accounts')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Hitung saldo per akun dari transaksi yang sudah dikaitkan
  const withBalance = await Promise.all(
    (accounts || []).map(async (acc) => {
      const { data: txs } = await supabase
        .from('transactions')
        .select('type, amount')
        .eq('account_id', acc.id)
        .eq('user_id', user.id)

      const balance = (txs || []).reduce((sum, t) =>
        sum + (t.type === 'income' ? Number(t.amount) : -Number(t.amount)), 0)

      return { ...acc, current_balance: balance }
    })
  )

  return NextResponse.json(withBalance)
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { name, type, color } = await request.json()
  if (!name || !type) {
    return NextResponse.json({ error: 'Nama dan tipe akun wajib diisi' }, { status: 400 })
  }

  const validTypes = ['cash', 'bank', 'ewallet', 'savings']
  if (!validTypes.includes(type)) {
    return NextResponse.json({ error: 'Tipe akun tidak valid' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('accounts')
    .insert({ user_id: user.id, name, type, color: color || '#6366f1' })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ...data, current_balance: 0 })
}

export async function DELETE(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await request.json()
  if (!id) return NextResponse.json({ error: 'ID akun diperlukan' }, { status: 400 })

  const { error } = await supabase
    .from('accounts')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

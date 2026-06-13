import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: payments, error } = await supabase
      .from('payments')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching payments:', error);
      // Jika tabel belum dibuat oleh user, kita tidak boleh crash
      if (error.code === '42P01') { // table does not exist
        return NextResponse.json([]); 
      }
      throw error;
    }

    return NextResponse.json(payments || []);
  } catch (error: any) {
    console.error('API User Payments Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

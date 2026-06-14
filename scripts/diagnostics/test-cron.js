const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testCron() {
  console.log('--- TEST CRON LOGIC ---');
  
  // 1. Ambil profil dengan telegram_id
  const { data: profiles, error } = await supabaseAdmin
    .from('profiles')
    .select('id, full_name, telegram_id, notification_settings')
    .not('telegram_id', 'is', null);

  if (error) {
    console.error('Error fetching profiles:', error.message);
    return;
  }

  console.log(`Found ${profiles.length} profiles with telegram_id`);
  
  if (profiles.length === 0) {
    console.log("Tidak ada profil dengan telegram_id. Proses dihentikan.");
    return;
  }

  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  console.log(`Today string (UTC): ${todayStr}`);

  for (const p of profiles) {
    console.log(`\nChecking profile: ${p.full_name} (${p.id})`);
    console.log(`Telegram ID: ${p.telegram_id}`);
    
    // Cek setting
    const settings = p.notification_settings || { dailySummary: true };
    console.log(`Daily Summary Enabled: ${settings.dailySummary}`);
    
    if (settings.dailySummary) {
      // Ambil transaksi hari ini
      const { data: txs, error: txError } = await supabaseAdmin
        .from('transactions')
        .select('type, amount, date')
        .eq('user_id', p.id);
        
      if (txError) {
         console.error('Error fetching txs:', txError);
         continue;
      }
      
      console.log(`Total transactions all time: ${txs.length}`);
      
      const todayTxs = txs.filter(t => t.date === todayStr);
      console.log(`Transactions matching todayStr (${todayStr}): ${todayTxs.length}`);
      
      if (todayTxs.length > 0) {
          const income = todayTxs.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0);
          const expense = todayTxs.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);
          console.log(`  -> Pemasukan: ${income}, Pengeluaran: ${expense}`);
          console.log(`  -> Akan mengirim pesan Telegram ke ${p.telegram_id}`);
          
          // Test token
          if (!process.env.TELEGRAM_BOT_TOKEN) {
            console.log('  -> ERROR: TELEGRAM_BOT_TOKEN tidak diset di .env.local');
          } else {
            console.log('  -> TELEGRAM_BOT_TOKEN tersedia. Mengirim...');
            let msg = `📅 *Ringkasan Harian (${today.toLocaleDateString('id-ID')})*\n\n`;
            if (income > 0) msg += `💚 Pemasukan: Rp${income.toLocaleString('id-ID')}\n`;
            if (expense > 0) msg += `❤️ Pengeluaran: Rp${expense.toLocaleString('id-ID')}\n`;

            const res = await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                chat_id: p.telegram_id,
                text: msg,
                parse_mode: 'Markdown'
              })
            });
            const data = await res.json();
            console.log('  -> Response Telegram:', data);
          }
      } else {
          console.log("  -> Tidak ada transaksi hari ini, pesan tidak dikirim.");
          console.log("  -> Tanggal transaksi yg ada:", [...new Set(txs.map(t => t.date))].join(', '));
      }
    }
  }
}

testCron();

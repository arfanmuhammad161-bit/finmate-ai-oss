const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function test() {
  console.log('Testing notifications table...');
  const res1 = await supabase.from('notifications').select('id').limit(1);
  console.log('Notifications:', res1.error ? res1.error.message : 'OK');

  console.log('Testing system_logs table...');
  const res2 = await supabase.from('system_logs').select('id').limit(1);
  console.log('System Logs:', res2.error ? res2.error.message : 'OK');
}

test();

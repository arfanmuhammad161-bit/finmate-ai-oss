const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8');
const { createClient } = require('@supabase/supabase-js');

let supabaseUrl = '';
let supabaseKey = '';

env.split('\n').forEach(line => {
  if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) supabaseUrl = line.split('=')[1].trim();
  if (line.startsWith('SUPABASE_SERVICE_ROLE_KEY=')) supabaseKey = line.split('=')[1].trim();
});

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data, error } = await supabase.from('notifications').select('id').limit(1);
  console.log('Error:', error ? error.message : 'No Error');
}
check();

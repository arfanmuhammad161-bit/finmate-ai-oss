const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8');
const { createClient } = require('@supabase/supabase-js');

let supabaseUrl = '';
let supabaseKey = '';

env.split('\n').forEach(line => {
  if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) supabaseUrl = line.split('=')[1].trim();
  if (line.startsWith('SUPABASE_SERVICE_ROLE_KEY=')) supabaseKey = line.split('=')[1].trim();
});

const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

async function checkUser() {
  const email = 'arfanmuhammad161@gmail.com';
  console.log(`Checking user: ${email}`);
  
  const { data: users, error } = await supabaseAdmin.auth.admin.listUsers();
  
  if (error) {
    console.error('Error fetching users:', error);
    return;
  }
  
  const user = users.users.find(u => u.email === email);
  
  if (!user) {
    console.log('USER NOT FOUND IN SUPABASE AUTH!');
  } else {
    console.log('USER FOUND!');
    console.log('ID:', user.id);
    console.log('Email confirmed at:', user.email_confirmed_at);
    console.log('Last sign in:', user.last_sign_in_at);
    console.log('Providers:', user.app_metadata.providers);
    console.log('Created at:', user.created_at);
  }
}

checkUser();

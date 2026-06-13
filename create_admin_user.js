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

async function forceCreateUser() {
  const email = 'arfanmuhammad161@gmail.com';
  const password = 'Password123!';
  console.log(`Forcibly creating user: ${email}`);
  
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email: email,
    password: password,
    email_confirm: true,
    user_metadata: {
      full_name: 'Arfan',
      financial_goal: 'Mengontrol pengeluaran'
    }
  });
  
  if (error) {
    console.error('Error creating user:', error);
  } else {
    console.log('USER SUCCESSFULLY CREATED AND CONFIRMED!');
    console.log('Email:', email);
    console.log('Temporary Password:', password);
  }
}

forceCreateUser();

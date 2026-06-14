require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testSignup() {
  console.log('Testing signup...');
  const { data, error } = await supabase.auth.signUp({
    email: 'test_arfan_' + Date.now() + '@example.com',
    password: 'password123',
    options: {
      data: {
        full_name: 'Arfan Test',
        financial_goal: 'Menabung'
      }
    }
  });

  if (error) {
    console.error('Signup Error:', error);
  } else {
    console.log('Signup Success:', data);
  }
}

testSignup();

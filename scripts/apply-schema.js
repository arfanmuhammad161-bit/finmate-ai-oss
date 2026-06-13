/**
 * Apply Supabase Schema via Direct PostgreSQL Connection
 * Connection string format: postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres
 * 
 * HOW TO GET YOUR CONNECTION STRING:
 * 1. Go to: https://supabase.com/dashboard/project/ypvysfgmvgxulxjctsle/settings/database
 * 2. Copy the "Connection string" (Transaction pooler mode)
 * 3. Replace [YOUR-PASSWORD] below with your actual database password
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// ==========================================
// PASTE YOUR CONNECTION STRING HERE:
// ==========================================
const CONNECTION_STRING = process.argv[2] || '';

if (!CONNECTION_STRING) {
  console.log('\n❌ No connection string provided!');
  console.log('\nUsage:');
  console.log('  node scripts/apply-schema.js "postgresql://postgres.ypvysfgmvgxulxjctsle:[PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres"');
  console.log('\nGet your connection string from:');
  console.log('  https://supabase.com/dashboard/project/ypvysfgmvgxulxjctsle/settings/database');
  process.exit(1);
}

async function applySchema() {
  const client = new Client({
    connectionString: CONNECTION_STRING,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('Connecting to Supabase PostgreSQL...');
    await client.connect();
    console.log('✅ Connected!\n');

    const schema = fs.readFileSync(path.join(__dirname, '../supabase/schema.sql'), 'utf8');
    
    console.log('Applying schema...');
    await client.query(schema);
    console.log('✅ Schema applied successfully!\n');

    // Verify tables created
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    console.log('Tables created:');
    result.rows.forEach(r => console.log('  ✅', r.table_name));

  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await client.end();
  }
}

applySchema();

const https = require('https');
const fs = require('fs');
const path = require('path');

// Read schema file
const schema = fs.readFileSync(path.join(__dirname, '../supabase/schema.sql'), 'utf8');

// Split into individual statements (split on semicolons that end a line)
// We'll send them in chunks via the Supabase REST API pg-meta endpoint
// But since we only have anon key, we use a workaround: 
// We'll try the /pg endpoint or use pg-meta

// Actually, we need to use the Supabase Management API
// Project ref: ypvysfgmvgxulxjctsle
const PROJECT_REF = 'ypvysfgmvgxulxjctsle';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlwdnlzZmdtdmd4dWx4amN0c2xlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA0ODMxNDYsImV4cCI6MjA5NjA1OTE0Nn0.94zXLC-I_bqZVA19rlnFa3T3kwxIGdzcqFMXIHksPf8';

function makeRequest(hostname, path, method, body, headers) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        resolve({ status: res.statusCode, data });
      });
    });

    req.on('error', reject);
    if (body) req.write(typeof body === 'string' ? body : JSON.stringify(body));
    req.end();
  });
}

async function runSQL(sql) {
  // Try using Supabase's internal pg endpoint via REST
  const res = await makeRequest(
    `${PROJECT_REF}.supabase.co`,
    '/pg/query',
    'POST',
    { query: sql },
    {
      'apikey': ANON_KEY,
      'Authorization': `Bearer ${ANON_KEY}`
    }
  );
  return res;
}

async function main() {
  console.log('Schema file loaded, length:', schema.length);
  
  // Try the pg-meta endpoint
  const res = await runSQL('SELECT current_database(), version()');
  console.log('Test query status:', res.status);
  console.log('Response:', res.data.substring(0, 300));
}

main().catch(console.error);

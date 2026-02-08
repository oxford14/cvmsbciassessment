/**
 * One-time script to create the first admin user.
 * Run: npm run create-admin
 * Or: ADMIN_EMAIL=x ADMIN_PASSWORD=y npm run create-admin
 * Loads .env.local if present.
 */

require('dotenv').config({ path: '.env.local' });
const bcrypt = require('bcryptjs');
const { createClient } = require('@supabase/supabase-js');

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error('Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local');
    process.exit(1);
  }

  const email = process.argv[2] || process.env.ADMIN_EMAIL || 'admin@cvmsbci.org';
  const password = process.argv[3] || process.env.ADMIN_PASSWORD;
  if (!password) {
    console.error('Usage: ADMIN_PASSWORD=yourpassword node scripts/create-admin.js [email]');
    console.error('   Or: node scripts/create-admin.js email@example.com yourpassword');
    process.exit(1);
  }

  const hash = await bcrypt.hash(password, 10);
  const supabase = createClient(url, key);

  const { data, error } = await supabase
    .from('admin_users')
    .upsert(
      {
        email: email.trim().toLowerCase(),
        password_hash: hash,
        full_name: 'Admin',
        is_active: true,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'email' }
    )
    .select('id, email')
    .single();

  if (error) {
    console.error('Error creating admin:', error.message);
    process.exit(1);
  }
  console.log('Admin user created:', data?.email);
}

main();

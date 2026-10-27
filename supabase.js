/**
 * supabase.js — Supabase client untuk server-side (Node.js)
 * Digunakan oleh server.js untuk operasi DB & Storage
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('⚠️  SUPABASE_URL atau SUPABASE_ANON_KEY belum diset di .env!');
  console.error('   Salin file .env.example ke .env dan isi dengan kredensial Supabase kamu.');
}

const supabase = createClient(SUPABASE_URL || '', SUPABASE_ANON_KEY || '');

module.exports = supabase;

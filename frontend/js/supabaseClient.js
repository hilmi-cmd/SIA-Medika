// Konfigurasi Supabase Anda
const SUPABASE_URL = 'https://yjmjsxrzxdtuxatncybz.supabase.co'; 
const SUPABASE_ANON_KEY = 'sb_publishable_ZaP0uYh_6jTs1piTKZ6GDg_HRP5hVTQ';

// Inisialisasi Klien Supabase
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// TAMBAHKAN BARIS INI DI BAWAHNYA AGAR COCOK DENGAN app.js:
const supabaseClient = supabase;

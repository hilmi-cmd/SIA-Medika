// Konfigurasi Supabase Anda (Ganti dengan URL & Key milik Anda jika belum sesuai)
const SUPABASE_URL = 'https://yjmjsxrzxdtuxatncybz.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_ZaP0uYh_6jTs1piTKZ6GDg_HRP5hVTQ';

// Inisialisasi global ke objek window browser
window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

// frontend/js/supabaseClient.js
const SUPABASE_URL = 'https://yjmjsxrzxdtuxatncybz.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_ZaP0uYh_6jTs1piTKZ6GDg_HRP5hVTQ';

// Pastikan variabel global 'supabaseClient' didefinisikan seperti ini:
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

// Ganti URL dan Anon Key dengan kredensial Supabase milik Anda
const SUPABASE_URL = 'https://yjmjsxrzxdtuxatncybz.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_ZaP0uYh_6jTs1piTKZ6GDg_HRP5hVTQ';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
// DeFatFit v3 — supabase.js
// Cliente Supabase centralizado

const SUPABASE_URL     = 'https://ddjpeyewnoewylokagun.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_ybc-hTQjieaFC405rVmrAw_fMl73_eU';

window.db = window.db.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Usuario actual en memoria
window.currentUser    = null;
window.currentProfile = null;

window.tripAwaySupabase = null;

const tripAwaySupabaseUrl = 'https://olodwoavtyerdnrhsplv.supabase.co';
const tripAwaySupabaseAnonKey = 'sb_publishable_TIqy7eutOBqKFgnGKLfSTQ_DxMz89n_';

if (tripAwaySupabaseUrl && tripAwaySupabaseAnonKey) {
    if (!window.supabase?.createClient) {
        console.error('Supabase SDK did not load. Check the network connection and try again.');
    } else {
        window.tripAwaySupabase = window.supabase.createClient(tripAwaySupabaseUrl, tripAwaySupabaseAnonKey, {
            auth: {
                autoRefreshToken: true,
                detectSessionInUrl: true,
                persistSession: true
            }
        });
    }
}

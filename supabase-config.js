const AGAPE_SUPABASE_URL =
  "https://odqngntdaofpkyikuqfy.supabase.co";

const AGAPE_SUPABASE_KEY =
  "sb_publishable_84W0oSGu9bNgq9cZcxhYBw_ixRvY64W";

window.agapeSupabase = window.supabase.createClient(
  AGAPE_SUPABASE_URL,
  AGAPE_SUPABASE_KEY
);
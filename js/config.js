/* LOS · configurazione
   URL e publishable key di Supabase sono pubblici per definizione:
   la protezione dei dati sta nelle policy RLS (ogni riga è leggibile solo dal tuo utente). */
window.LOS_CONFIG = {
  SUPABASE_URL: 'https://jgulakplcxupdacpyhur.supabase.co',
  SUPABASE_KEY: 'sb_publishable_ioxUNQ5N3-wGgJIEIUEUNA_uouE1nXH',
  // Indirizzo pubblico della webapp (GitHub Pages). Serve a Strava per tornare all'app dopo il collegamento.
  WEB_URL: 'https://marcostrianese.github.io/repoLos/',
  VERSION: '1.0.0',
};

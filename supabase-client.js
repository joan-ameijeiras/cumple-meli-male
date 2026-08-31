// ---------------------------------------------------------------
// Supabase config — reemplazá estos dos valores con los de tu
// proyecto (Project Settings → API). Mientras digan "TU-PROYECTO"
// la app funciona igual, pero solo imprime los resultados en la
// consola en lugar de guardarlos o leerlos.
//
// Este archivo lo importan tanto app.js (guarda respuestas) como
// leaderboard.js (lee el ranking), así que las credenciales solo
// viven en un lugar.
// ---------------------------------------------------------------
export const SUPABASE_URL = "https://hwudmfdxkmyytzsupweq.supabase.co";
export const SUPABASE_ANON_KEY = "sb_publishable_PUTr3HcNEm9m1MlKE24YaA_9uiFFRuL";

export let supabase = null;
if (!SUPABASE_URL.includes("TU-PROYECTO")) {
  const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2");
  supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

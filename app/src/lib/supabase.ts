// Ejecuta una consulta de solo lectura contra la API run_sql de Supabase (solo desde el servidor)
export async function runSql<T = Record<string, unknown>>(q: string): Promise<T[]> {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_KEY;
  if (!url || !key) throw new Error('Faltan las variables SUPABASE_URL y SUPABASE_KEY');
  const r = await fetch(`${url}/rest/v1/rpc/run_sql`, {
    method: 'POST',
    headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ q, quien: 'Panel Scuffers' }),
    cache: 'no-store',
  });
  const j = await r.json();
  if (!r.ok) throw new Error(j?.message ?? JSON.stringify(j));
  return j as T[];
}

export type Resultado<T> = { data: T[]; error: string | null };

export async function seguro<T = Record<string, unknown>>(q: string): Promise<Resultado<T>> {
  try {
    return { data: await runSql<T>(q), error: null };
  } catch (e) {
    return { data: [], error: e instanceof Error ? e.message : String(e) };
  }
}

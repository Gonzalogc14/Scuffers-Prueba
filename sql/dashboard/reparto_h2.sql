WITH base AS (
  SELECT o.id, o.customer_id, o.country, o.created_at::date AS fecha,
    CASE LOWER(TRIM(o.channel))
      WHEN 'meta ads' THEN 'Meta Ads' WHEN 'instagram ads' THEN 'Meta Ads'
      WHEN 'email' THEN 'Email' WHEN 'newsletter' THEN 'Email'
      WHEN 'google ads' THEN 'Google Ads' WHEN 'tiktok ads' THEN 'TikTok Ads'
      WHEN 'organic' THEN 'Organic' WHEN 'direct' THEN 'Direct'
    END AS canal,
    o.subtotal_cents, o.shipping_cents, o.total_amount_cents
  FROM public.orders o
  WHERE o.status = 'delivered'
    AND NULLIF(o.deleted_at::text, '') IS NULL
    AND o.created_at::date BETWEEN DATE '2026-01-01' AND DATE '2026-06-30'
    AND o.subtotal_cents >= 100
),
gasto AS (
  SELECT "date" AS fecha,
    CASE WHEN channel = 'Instagram Ads' THEN 'Meta Ads' ELSE channel END AS canal,
    CASE WHEN currency_unit = 'EUR_CENTS' THEN spend_raw::numeric / 100 ELSE spend_raw::numeric END AS gasto_eur
  FROM (SELECT DISTINCT "date", channel, spend_raw, currency_unit FROM public.marketing_spend) m
  WHERE "date" BETWEEN DATE '2026-01-01' AND DATE '2026-06-30'
),
ingresos AS (
  SELECT canal, SUM(total_amount_cents) / 100.0 AS ingresos_eur
  FROM base
  WHERE fecha >= DATE '2026-03-01'
  GROUP BY canal
),
gasto_canal AS (
  SELECT canal, SUM(gasto_eur) AS gasto_eur
  FROM gasto
  WHERE fecha >= DATE '2026-03-01'
  GROUP BY canal
),
iec AS (
  SELECT i.canal, g.gasto_eur, i.ingresos_eur / g.gasto_eur AS iec
  FROM ingresos i
  JOIN gasto_canal g ON g.canal = i.canal
)
SELECT ROUND(m.gasto_eur / 4, 2) AS meta_gasto_mensual_eur,
  ROUND(m.gasto_eur / 4 * 6, 2) AS meta_gasto_h2_eur,
  ROUND(m.gasto_eur / 4 * 6 * 0.25, 2) AS traslado_eur,
  ROUND(e.gasto_eur / 4 * 6, 2) AS email_gasto_h2_eur,
  ROUND((SELECT SUM(gasto_eur) FROM gasto_canal) / 4 * 6, 2) AS gasto_total_h2_eur,
  ROUND(m.iec, 2) AS iec_meta,
  ROUND(e.iec, 2) AS iec_email,
  ROUND(100.0 * m.iec / e.iec, 1) AS iec_minimo_email_pct_del_medio,
  ROUND(m.gasto_eur / 4 * 6 * 0.25 * m.iec, 2) AS ingresos_que_deja_de_atribuir_meta_eur,
  ROUND(m.gasto_eur / 4 * 6 * 0.25 * e.iec, 2) AS ingresos_si_email_mantiene_su_iec_eur
FROM iec m, iec e
WHERE m.canal = 'Meta Ads' AND e.canal = 'Email';

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
tt AS (
  SELECT 'mar-jun' AS ventana,
    (SELECT SUM(gasto_eur) FROM gasto WHERE canal = 'TikTok Ads' AND fecha >= DATE '2026-03-01') AS gasto_eur,
    (SELECT SUM(total_amount_cents) / 100.0 FROM base WHERE canal = 'TikTok Ads' AND fecha >= DATE '2026-03-01') AS ingresos_eur
  UNION ALL
  SELECT 'ene-jun',
    (SELECT SUM(gasto_eur) FROM gasto WHERE canal = 'TikTok Ads'),
    (SELECT SUM(total_amount_cents) / 100.0 FROM base WHERE canal = 'TikTok Ads')
)
SELECT ventana, ROUND(gasto_eur, 2) AS gasto_eur, ROUND(ingresos_eur, 2) AS ingresos_eur,
  ROUND(ingresos_eur / gasto_eur, 1) AS iec
FROM tt
ORDER BY ventana DESC;

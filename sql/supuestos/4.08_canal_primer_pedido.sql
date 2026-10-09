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
primer AS (
  SELECT DISTINCT ON (customer_id) customer_id, canal AS canal_primer_pedido
  FROM base
  ORDER BY customer_id, fecha, id
),
por_pedido AS (
  SELECT canal, SUM(total_amount_cents) / 100.0 AS ingresos_eur
  FROM base
  WHERE fecha >= DATE '2026-03-01'
  GROUP BY canal
),
por_cliente AS (
  SELECT p.canal_primer_pedido AS canal, SUM(b.total_amount_cents) / 100.0 AS ingresos_eur
  FROM base b
  JOIN primer p ON p.customer_id = b.customer_id
  WHERE b.fecha >= DATE '2026-03-01'
  GROUP BY p.canal_primer_pedido
),
gasto_canal AS (
  SELECT canal, SUM(gasto_eur) AS gasto_eur
  FROM gasto
  WHERE fecha >= DATE '2026-03-01'
  GROUP BY canal
)
SELECT COALESCE(a.canal, c.canal) AS canal,
  ROUND(a.ingresos_eur, 2) AS ingresos_canal_del_pedido_eur,
  ROUND(c.ingresos_eur, 2) AS ingresos_canal_del_primer_pedido_eur,
  ROUND(g.gasto_eur, 2) AS gasto_eur,
  ROUND(a.ingresos_eur / NULLIF(g.gasto_eur, 0), 1) AS iec_canal_del_pedido,
  ROUND(c.ingresos_eur / NULLIF(g.gasto_eur, 0), 1) AS iec_canal_del_primer_pedido
FROM por_pedido a
FULL JOIN por_cliente c ON c.canal = a.canal
LEFT JOIN gasto_canal g ON g.canal = COALESCE(a.canal, c.canal)
ORDER BY iec_canal_del_pedido DESC NULLS LAST;

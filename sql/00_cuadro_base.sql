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
)
SELECT COUNT(*) AS pedidos,
  ROUND(SUM(total_amount_cents) / 100.0, 2) AS ventas_eur,
  ROUND(AVG(total_amount_cents) / 100.0, 2) AS ticket_medio_eur,
  COUNT(*) FILTER (WHERE canal IS NULL) AS sin_canal_mapeado,
  (SELECT COUNT(*) FROM public.orders
   WHERE status = 'delivered' AND NULLIF(deleted_at::text, '') IS NULL
     AND created_at::date <= DATE '2026-06-30' AND subtotal_cents < 100) AS pedidos_menores_1_eur
FROM base;

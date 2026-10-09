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
SELECT country, COUNT(*) AS pedidos, COUNT(DISTINCT customer_id) AS clientes,
  ROUND(SUM(total_amount_cents) / 100.0, 2) AS ventas_eur,
  ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER (), 1) AS pct_pedidos,
  ROUND(100.0 * SUM(total_amount_cents) / SUM(SUM(total_amount_cents)) OVER (), 1) AS pct_ventas,
  ROUND(AVG(total_amount_cents) / 100.0, 2) AS ticket_medio_eur,
  ROUND(AVG(subtotal_cents) / 100.0, 2) AS subtotal_medio_eur,
  ROUND(1.0 * COUNT(*) / COUNT(DISTINCT customer_id), 1) AS pedidos_por_cliente
FROM base
GROUP BY country
ORDER BY ventas_eur DESC;

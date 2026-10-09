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
SELECT COUNT(*) FILTER (WHERE customer_id = 177) AS pedidos_cliente_177,
  ROUND(SUM(total_amount_cents) FILTER (WHERE customer_id = 177) / 100.0, 2) AS ventas_177_eur,
  ROUND(100.0 * SUM(total_amount_cents) FILTER (WHERE customer_id = 177) / SUM(total_amount_cents), 1) AS pct_de_las_ventas,
  ROUND(SUM(total_amount_cents) / 100.0, 2) AS ventas_con_177_eur,
  ROUND(SUM(total_amount_cents) FILTER (WHERE customer_id <> 177) / 100.0, 2) AS ventas_sin_177_eur,
  ROUND(AVG(total_amount_cents) / 100.0, 2) AS ticket_con_177_eur,
  ROUND(AVG(total_amount_cents) FILTER (WHERE customer_id <> 177) / 100.0, 2) AS ticket_sin_177_eur
FROM base;

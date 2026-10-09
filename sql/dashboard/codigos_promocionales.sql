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
cod AS (
  SELECT DISTINCT x.order_id, pr.name AS codigo, pr.discount_pct
  FROM public.order_promotions x
  JOIN public.promotions pr ON pr.id = x.promotion_id
)
SELECT c.codigo, c.discount_pct,
  COUNT(*) AS pedidos,
  ROUND(SUM(b.total_amount_cents) / 100.0, 2) AS ingreso_eur,
  ROUND(100.0 * SUM(b.total_amount_cents) / (SELECT SUM(total_amount_cents) FROM base), 1) AS pct_de_las_ventas
FROM cod c
JOIN base b ON b.id = c.order_id
GROUP BY c.codigo, c.discount_pct
UNION ALL
SELECT 'Sin código', NULL, COUNT(*),
  ROUND(SUM(total_amount_cents) / 100.0, 2),
  ROUND(100.0 * SUM(total_amount_cents) / (SELECT SUM(total_amount_cents) FROM base), 1)
FROM base
WHERE id NOT IN (SELECT order_id FROM cod)
ORDER BY ingreso_eur DESC;

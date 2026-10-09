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
l AS (
  SELECT p.id, p.name, p.active, i.quantity, i.quantity * i.unit_price_cents AS importe_cents
  FROM base b
  JOIN public.order_items i ON i.order_id = b.id
  JOIN public.products p ON p.id = i.product_id
  WHERE p.id IN (2, 24)
)
SELECT id::text AS ficha, name, active, SUM(quantity) AS unidades,
  ROUND(SUM(importe_cents) / 100.0, 2) AS ingreso_lineas_eur
FROM l
GROUP BY id, name, active
UNION ALL
SELECT 'unidas', 'Sudadera (ids 2 y 24)', NULL, SUM(quantity),
  ROUND(SUM(importe_cents) / 100.0, 2)
FROM l
ORDER BY 1;

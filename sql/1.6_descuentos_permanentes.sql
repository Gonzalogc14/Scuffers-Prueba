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
  SELECT p.id, p.name, p.price_cents, i.unit_price_cents, i.quantity
  FROM base b
  JOIN public.order_items i ON i.order_id = b.id
  JOIN public.products p ON p.id = i.product_id
)
SELECT id AS product_id, name, price_cents AS precio_catalogo,
  MIN(unit_price_cents) AS precio_venta_min, MAX(unit_price_cents) AS precio_venta_max,
  ROUND(100.0 * (1 - MIN(unit_price_cents)::numeric / price_cents), 1) AS descuento_pct,
  SUM(quantity) AS unidades,
  ROUND(SUM(quantity * unit_price_cents) / 100.0, 2) AS ingreso_lineas_eur,
  ROUND(SUM(quantity * (price_cents - unit_price_cents)) / 100.0, 2) AS descuento_cedido_eur,
  ROUND(SUM(SUM(quantity * (price_cents - unit_price_cents))) OVER () / 100.0, 2) AS descuento_cedido_total_eur
FROM l
GROUP BY id, name, price_cents
HAVING SUM(quantity * (price_cents - unit_price_cents)) > 0
ORDER BY descuento_cedido_eur DESC;

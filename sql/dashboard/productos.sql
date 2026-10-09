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
lineas AS (
  SELECT CASE WHEN i.product_id = 24 THEN 2 ELSE i.product_id END AS pid,
    i.quantity, i.quantity * i.unit_price_cents AS importe_cents
  FROM base b
  JOIN public.order_items i ON i.order_id = b.id
),
ventas AS (
  SELECT pid, SUM(quantity) AS unidades, SUM(importe_cents) AS importe_cents
  FROM lineas
  GROUP BY pid
),
resenas AS (
  SELECT CASE WHEN product_id = 24 THEN 2 ELSE product_id END AS pid, customer_id, rating,
    created_at::date AS fecha, id
  FROM public.product_reviews
  WHERE created_at::date <= DATE '2026-06-30'
),
ultima AS (
  SELECT DISTINCT ON (customer_id, pid) pid, rating
  FROM resenas
  ORDER BY customer_id, pid, fecha DESC, id DESC
),
valoracion AS (
  SELECT pid, COUNT(*) AS n, ROUND(AVG(rating), 2) AS media
  FROM ultima
  GROUP BY pid
)
SELECT p.id AS product_id, p.name, p.category, v.unidades,
  ROUND(v.importe_cents / 100.0, 2) AS ingreso_lineas_eur,
  r.media AS valoracion_media, r.n AS resenas
FROM public.products p
JOIN ventas v ON v.pid = p.id
LEFT JOIN valoracion r ON r.pid = p.id
WHERE p.active
ORDER BY ingreso_lineas_eur DESC;

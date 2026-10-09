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
  SELECT p.category, p.active, i.quantity, i.quantity * i.unit_price_cents AS importe_cents
  FROM base b
  JOIN public.order_items i ON i.order_id = b.id
  JOIN public.products p ON p.id = CASE WHEN i.product_id = 24 THEN 2 ELSE i.product_id END
)
SELECT category,
  ROUND(SUM(importe_cents) FILTER (WHERE active) / 100.0, 2) AS ingreso_lineas_eur,
  ROUND(100.0 * SUM(importe_cents) FILTER (WHERE active) / SUM(SUM(importe_cents) FILTER (WHERE active)) OVER (), 1) AS pct,
  SUM(quantity) FILTER (WHERE active) AS unidades,
  ROUND(COALESCE(SUM(importe_cents) FILTER (WHERE NOT active), 0) / 100.0, 2) AS ingreso_retirados_eur
FROM lineas
GROUP BY category
ORDER BY ingreso_lineas_eur DESC NULLS LAST;

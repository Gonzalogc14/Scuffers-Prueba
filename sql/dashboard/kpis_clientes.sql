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
cli AS (
  SELECT customer_id, COUNT(*) AS pedidos FROM base GROUP BY customer_id
),
dev AS (
  SELECT COUNT(*) FILTER (WHERE status = 'refunded') AS reembolsados, COUNT(*) AS entregados_y_reembolsados
  FROM public.orders
  WHERE status IN ('delivered', 'refunded')
    AND NULLIF(deleted_at::text, '') IS NULL
    AND created_at::date BETWEEN DATE '2026-01-01' AND DATE '2026-06-30'
    AND subtotal_cents >= 100
)
SELECT (SELECT COUNT(*) FROM cli) AS clientes_activos,
  (SELECT COUNT(*) FROM cli WHERE pedidos >= 2) AS clientes_recurrentes,
  ROUND(100.0 * (SELECT COUNT(*) FROM cli WHERE pedidos >= 2) / (SELECT COUNT(*) FROM cli), 1) AS tasa_recompra_pct,
  d.reembolsados, d.entregados_y_reembolsados,
  ROUND(100.0 * d.reembolsados / d.entregados_y_reembolsados, 2) AS tasa_devolucion_pct
FROM dev d;

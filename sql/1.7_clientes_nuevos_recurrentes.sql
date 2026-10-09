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
ord AS (
  SELECT b.fecha, b.total_amount_cents,
    ROW_NUMBER() OVER (PARTITION BY b.customer_id ORDER BY b.fecha, b.id) AS n_pedido
  FROM base b
)
SELECT to_char(fecha, 'YYYY-MM') AS mes,
  COUNT(*) FILTER (WHERE n_pedido = 1) AS pedidos_clientes_nuevos,
  COUNT(*) FILTER (WHERE n_pedido > 1) AS pedidos_recurrentes,
  ROUND(100.0 * COUNT(*) FILTER (WHERE n_pedido > 1) / COUNT(*), 1) AS pct_recurrentes,
  ROUND(SUM(total_amount_cents) FILTER (WHERE n_pedido = 1) / 100.0, 2) AS ventas_nuevos_eur,
  ROUND(SUM(total_amount_cents) FILTER (WHERE n_pedido > 1) / 100.0, 2) AS ventas_recurrentes_eur
FROM ord
GROUP BY 1
ORDER BY 1;

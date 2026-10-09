WITH ped AS (
  SELECT o.id, o.status
  FROM public.orders o
  WHERE o.status IN ('delivered', 'refunded')
    AND NULLIF(o.deleted_at::text, '') IS NULL
    AND o.created_at::date BETWEEN DATE '2026-01-01' AND DATE '2026-06-30'
    AND o.subtotal_cents >= 100
),
dev AS (SELECT DISTINCT order_id FROM public.refunds)
SELECT COUNT(*) FILTER (WHERE status = 'refunded') AS reembolsados,
  COUNT(*) AS entregados_y_reembolsados,
  ROUND(100.0 * COUNT(*) FILTER (WHERE status = 'refunded') / COUNT(*), 2) AS tasa_pct,
  COUNT(*) FILTER (WHERE status = 'delivered' AND id IN (SELECT order_id FROM dev)) AS entregados_con_devolucion_parcial,
  COUNT(*) FILTER (WHERE status = 'refunded' OR id IN (SELECT order_id FROM dev)) AS pedidos_con_alguna_devolucion,
  ROUND(100.0 * COUNT(*) FILTER (WHERE status = 'refunded' OR id IN (SELECT order_id FROM dev)) / COUNT(*), 1) AS tasa_ampliada_pct
FROM ped;

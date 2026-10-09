WITH base AS (
  SELECT o.id, o.status, o.total_amount_cents, COALESCE(r.importe, 0) AS devuelto
  FROM public.orders o
  LEFT JOIN (SELECT order_id, SUM(amount_cents) AS importe FROM public.refunds GROUP BY order_id) r ON r.order_id = o.id
  WHERE NULLIF(o.deleted_at::text, '') IS NULL
    AND o.created_at::date BETWEEN DATE '2026-01-01' AND DATE '2026-06-30'
    AND o.subtotal_cents >= 100
),
res AS (
  SELECT 'A. solo delivered (criterio elegido)' AS criterio, COUNT(*) AS pedidos, ROUND(SUM(total_amount_cents) / 100.0, 2) AS ventas_eur
  FROM base WHERE status = 'delivered'
  UNION ALL
  SELECT 'B. delivered + refunded (bruto)', COUNT(*), ROUND(SUM(total_amount_cents) / 100.0, 2)
  FROM base WHERE status IN ('delivered', 'refunded')
  UNION ALL
  SELECT 'C. B menos importe devuelto', COUNT(*), ROUND((SUM(total_amount_cents) - SUM(devuelto)) / 100.0, 2)
  FROM base WHERE status IN ('delivered', 'refunded')
  UNION ALL
  SELECT 'D. todo salvo cancelled (incluye pending)', COUNT(*), ROUND(SUM(total_amount_cents) / 100.0, 2)
  FROM base WHERE status <> 'cancelled'
  UNION ALL
  SELECT 'E. todos los estados', COUNT(*), ROUND(SUM(total_amount_cents) / 100.0, 2)
  FROM base
)
SELECT criterio, pedidos, ventas_eur,
  ROUND(100.0 * (ventas_eur / (SELECT ventas_eur FROM res WHERE criterio LIKE 'A.%') - 1), 1) AS pct_frente_a_A
FROM res
ORDER BY criterio;

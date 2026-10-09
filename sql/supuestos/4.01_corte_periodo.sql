WITH ent AS (
  SELECT total_amount_cents,
    (NULLIF(deleted_at::text, '') IS NULL
     AND created_at::date BETWEEN DATE '2026-01-01' AND DATE '2026-06-30') AS en_periodo
  FROM public.orders
  WHERE status = 'delivered'
),
agg AS (
  SELECT en_periodo, COUNT(*) AS pedidos, ROUND(SUM(total_amount_cents) / 100.0, 2) AS ventas_eur
  FROM ent
  GROUP BY en_periodo
)
SELECT CASE WHEN en_periodo THEN 'A. entregados ene-jun sin eliminados (incluidos)'
            ELSE 'B. entregados eliminados o posteriores a junio (excluidos)' END AS concepto,
  pedidos, ventas_eur
FROM agg
UNION ALL
SELECT 'B sobre A (%)', NULL,
  ROUND(100.0 * (SELECT ventas_eur FROM agg WHERE NOT en_periodo) / (SELECT ventas_eur FROM agg WHERE en_periodo), 1)
ORDER BY 1;

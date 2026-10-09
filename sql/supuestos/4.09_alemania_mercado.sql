WITH ped AS (
  SELECT o.id, o.customer_id, c.country AS pais, o.total_amount_cents,
    (NULLIF(o.deleted_at::text, '') IS NULL AND o.created_at::date <= DATE '2026-06-30') AS en_periodo
  FROM public.orders o
  JOIN public.customers c ON c.id = o.customer_id
),
por_cliente AS (
  SELECT pais, customer_id, COUNT(*) AS n
  FROM ped
  WHERE en_periodo
  GROUP BY pais, customer_id
),
top7 AS (
  SELECT n FROM por_cliente WHERE pais = 'DE' ORDER BY n DESC LIMIT 7
)
SELECT 'A. ' || pais AS concepto, COUNT(DISTINCT customer_id) AS clientes, COUNT(*) AS pedidos,
  ROUND(1.0 * COUNT(*) / COUNT(DISTINCT customer_id), 1) AS pedidos_por_cliente, NULL::numeric AS pct
FROM ped
WHERE en_periodo AND pais IN ('DE', 'ES')
GROUP BY pais
UNION ALL
SELECT 'B. ' || pais || ' sobre todos los pedidos', NULL, COUNT(*), NULL,
  ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER (), 1)
FROM ped
GROUP BY pais
UNION ALL
SELECT 'B. ' || pais || ' sobre el importe total', NULL, NULL, NULL,
  ROUND(100.0 * SUM(total_amount_cents) / SUM(SUM(total_amount_cents)) OVER (), 1)
FROM ped
GROUP BY pais
UNION ALL
SELECT 'C. 7 clientes alemanes con mas pedidos sobre los pedidos de Alemania', NULL, (SELECT SUM(n) FROM top7), NULL,
  ROUND(100.0 * (SELECT SUM(n) FROM top7) / (SELECT SUM(n) FROM por_cliente WHERE pais = 'DE'), 1)
ORDER BY 1;

WITH madrid AS (
  SELECT to_char(created_at::date, 'YYYY-MM') AS mes, COUNT(*) AS pedidos
  FROM public.orders
  GROUP BY 1
),
utc AS (
  SELECT to_char(created_at_utc::timestamptz AT TIME ZONE 'UTC', 'YYYY-MM') AS mes, COUNT(*) AS pedidos
  FROM public.orders
  GROUP BY 1
)
SELECT COALESCE(m.mes, u.mes) AS concepto,
  m.pedidos AS pedidos_created_at,
  u.pedidos AS pedidos_utc,
  m.pedidos - u.pedidos AS diferencia
FROM madrid m
FULL JOIN utc u ON u.mes = m.mes
UNION ALL
SELECT 'pedidos que cambian de dia con UTC', NULL, NULL,
  COUNT(*) FILTER (WHERE created_at::date <> (created_at_utc::timestamptz AT TIME ZONE 'UTC')::date)
FROM public.orders
ORDER BY 1;

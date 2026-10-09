SELECT to_char(created_at::date, 'YYYY-MM') AS mes, status, COUNT(*) AS pedidos
FROM public.orders
WHERE NULLIF(deleted_at::text, '') IS NULL
  AND created_at::date <= DATE '2026-06-30'
  AND status = 'pending'
GROUP BY 1, 2
ORDER BY 1;

WITH ent AS (
  SELECT subtotal_cents, total_amount_cents
  FROM public.orders
  WHERE status = 'delivered'
    AND NULLIF(deleted_at::text, '') IS NULL
    AND created_at::date BETWEEN DATE '2026-01-01' AND DATE '2026-06-30'
)
SELECT COUNT(*) FILTER (WHERE subtotal_cents < 100) AS pedidos_menores_1_eur,
  ROUND(SUM(total_amount_cents) FILTER (WHERE subtotal_cents < 100) / 100.0, 2) AS ventas_de_esos_pedidos_eur,
  ROUND(SUM(total_amount_cents) FILTER (WHERE subtotal_cents >= 100) / 100.0, 2) AS ventas_sin_ellos_eur,
  ROUND(SUM(total_amount_cents) / 100.0, 2) AS ventas_con_ellos_eur,
  ROUND(AVG(total_amount_cents) FILTER (WHERE subtotal_cents >= 100) / 100.0, 2) AS ticket_sin_ellos_eur,
  ROUND(AVG(total_amount_cents) / 100.0, 2) AS ticket_con_ellos_eur
FROM ent;

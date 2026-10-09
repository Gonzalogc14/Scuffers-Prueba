WITH lineas AS (
  SELECT i.order_id, SUM(i.quantity * i.unit_price_cents) AS suma_lineas,
    COUNT(*) FILTER (WHERE p.id IS NULL) AS lineas_sin_producto
  FROM public.order_items i
  LEFT JOIN public.products p ON p.id = i.product_id
  GROUP BY i.order_id
),
promos AS (
  SELECT order_id, COUNT(*) AS codigos FROM public.order_promotions GROUP BY order_id
)
SELECT 'pedidos cuyo subtotal no coincide con la suma de sus lineas' AS comprobacion, COUNT(*) AS pedidos
FROM public.orders o JOIN lineas l ON l.order_id = o.id
WHERE o.subtotal_cents <> l.suma_lineas
UNION ALL
SELECT 'de ellos, con alguna linea sin producto en el catalogo', COUNT(*)
FROM public.orders o JOIN lineas l ON l.order_id = o.id
WHERE o.subtotal_cents <> l.suma_lineas AND l.lineas_sin_producto > 0
UNION ALL
SELECT 'lineas sin producto en el catalogo', COALESCE(SUM(lineas_sin_producto), 0) FROM lineas
UNION ALL
SELECT 'pedidos con algun codigo promocional', COUNT(*) FROM promos
UNION ALL
SELECT 'pedidos con dos codigos', COUNT(*) FROM promos WHERE codigos = 2
ORDER BY 1;

SELECT COUNT(*) FILTER (WHERE p.active) AS lineas_solo_activos,
  COUNT(*) AS lineas_todos_los_productos,
  ROUND(100.0 * (COUNT(*) - COUNT(*) FILTER (WHERE p.active)) / COUNT(*) FILTER (WHERE p.active), 0) AS pct_mas_sin_filtro,
  COUNT(DISTINCT p.id) AS referencias,
  COUNT(DISTINCT p.id) FILTER (WHERE NOT p.active) AS referencias_retiradas
FROM public.order_items i
JOIN public.products p ON p.id = i.product_id
WHERE p.category = 'Deporte';

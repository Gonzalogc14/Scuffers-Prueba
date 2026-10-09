WITH todas AS (
  SELECT id, product_id, customer_id, rating, created_at::date AS fecha
  FROM public.product_reviews
  WHERE created_at::date <= DATE '2026-06-30'
),
ultima AS (
  SELECT DISTINCT ON (customer_id, product_id) product_id, customer_id, rating
  FROM todas
  ORDER BY customer_id, product_id, fecha DESC, id DESC
),
a AS (
  SELECT product_id, COUNT(*) AS resenas_todas, ROUND(AVG(rating), 2) AS media_todas
  FROM todas GROUP BY product_id
),
b AS (
  SELECT product_id, COUNT(*) AS resenas_una_por_cliente, ROUND(AVG(rating), 2) AS media_una_por_cliente
  FROM ultima GROUP BY product_id
)
SELECT p.id AS product_id, p.name, a.resenas_todas, a.media_todas,
  b.resenas_una_por_cliente, b.media_una_por_cliente,
  ROUND(b.media_una_por_cliente - a.media_todas, 2) AS diferencia
FROM public.products p
LEFT JOIN a ON a.product_id = p.id
LEFT JOIN b ON b.product_id = p.id
ORDER BY ABS(b.media_una_por_cliente - a.media_todas) DESC NULLS LAST, p.id;

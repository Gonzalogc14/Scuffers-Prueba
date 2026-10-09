# Scuffers · Prueba técnica

> Prueba técnica de Analista de Datos e IA: revisión del primer semestre de 2026, modelado en SQL y panel interactivo para apoyar las decisiones de presupuesto.

---

<div align="justify">

## 1. Conclusiones de negocio

Todas las conclusiones parten de la misma base de ventas (sección 2): 559 pedidos entregados entre enero y junio que suman 49.447,08 €, con IVA y envío incluidos. El «ingreso de líneas» es cantidad por precio de la línea, sin IVA ni envío. Cada query se puede ejecutar sola y también está en `sql/`.

### 1.1 Junio vende un 30 % menos que abril (7.138 € frente a 10.163 €) por menos pedidos y por la caída de Ropa

**Qué dice el dato:** las ventas pasan de 10.163 € en abril (115 pedidos) a 7.138 € en junio (79 pedidos), un 30 % menos. El ticket medio apenas se mueve (88,38 € en abril y 90,36 € en junio), así que la caída viene del número de pedidos. Por categorías, Ropa baja un 52 % (de 4.109 € a 1.956 €) y Accesorios un 43 %. Deporte, que no existía en abril, suma 947 € en junio y compensa solo una parte.

**Por qué importa:** abril es el mes más alto del semestre, así que no sirve de referencia para el presupuesto de H2. Además, junio tiene 14 pedidos pendientes y ningún mes anterior pasa de 4. Si se entregaran todos con el ticket de junio, sumarían unos 1.265 € y junio quedaría en torno a 8.400 €, un 17 % por debajo de abril. Antes de dar la caída por cierta conviene ver cuántos se entregan en julio y revisar qué productos de Ropa han dejado de venderse (stock, precio o el cambio de ficha de la sudadera).

**Cómo lo he calculado:** pedidos entregados de enero a junio, sin los eliminados ni los 8 con subtotal inferior a 1 €, agrupados por el mes de `created_at`. Las ventas son `total_amount_cents`. Los 1.265 € son una estimación (14 pedidos por 90,36 €) y no un dato. El ingreso por categoría suma cantidad por precio de la línea de los productos del catálogo, activos y retirados. Las queries son, por orden, la evolución mensual, los pedidos pendientes por mes y el ingreso por categoría y mes.

```sql
WITH base AS (
  SELECT o.id, o.customer_id, o.country, o.created_at::date AS fecha,
    CASE LOWER(TRIM(o.channel))
      WHEN 'meta ads' THEN 'Meta Ads' WHEN 'instagram ads' THEN 'Meta Ads'
      WHEN 'email' THEN 'Email' WHEN 'newsletter' THEN 'Email'
      WHEN 'google ads' THEN 'Google Ads' WHEN 'tiktok ads' THEN 'TikTok Ads'
      WHEN 'organic' THEN 'Organic' WHEN 'direct' THEN 'Direct'
    END AS canal,
    o.subtotal_cents, o.shipping_cents, o.total_amount_cents
  FROM public.orders o
  WHERE o.status = 'delivered'
    AND NULLIF(o.deleted_at::text, '') IS NULL
    AND o.created_at::date BETWEEN DATE '2026-01-01' AND DATE '2026-06-30'
    AND o.subtotal_cents >= 100
)
SELECT to_char(fecha, 'YYYY-MM') AS mes,
  COUNT(*) AS pedidos,
  ROUND(SUM(total_amount_cents) / 100.0, 2) AS ventas_eur,
  ROUND(AVG(total_amount_cents) / 100.0, 2) AS ticket_medio_eur
FROM base
GROUP BY 1
ORDER BY 1;
```

```sql
SELECT to_char(created_at::date, 'YYYY-MM') AS mes, status, COUNT(*) AS pedidos
FROM public.orders
WHERE NULLIF(deleted_at::text, '') IS NULL
  AND created_at::date <= DATE '2026-06-30'
  AND status = 'pending'
GROUP BY 1, 2
ORDER BY 1;
```

```sql
WITH base AS (
  SELECT o.id, o.customer_id, o.country, o.created_at::date AS fecha,
    CASE LOWER(TRIM(o.channel))
      WHEN 'meta ads' THEN 'Meta Ads' WHEN 'instagram ads' THEN 'Meta Ads'
      WHEN 'email' THEN 'Email' WHEN 'newsletter' THEN 'Email'
      WHEN 'google ads' THEN 'Google Ads' WHEN 'tiktok ads' THEN 'TikTok Ads'
      WHEN 'organic' THEN 'Organic' WHEN 'direct' THEN 'Direct'
    END AS canal,
    o.subtotal_cents, o.shipping_cents, o.total_amount_cents
  FROM public.orders o
  WHERE o.status = 'delivered'
    AND NULLIF(o.deleted_at::text, '') IS NULL
    AND o.created_at::date BETWEEN DATE '2026-01-01' AND DATE '2026-06-30'
    AND o.subtotal_cents >= 100
),
lineas AS (
  SELECT to_char(b.fecha, 'YYYY-MM') AS mes, p.category, i.quantity * i.unit_price_cents AS importe_cents
  FROM base b
  JOIN public.order_items i ON i.order_id = b.id
  JOIN public.products p ON p.id = i.product_id
)
SELECT mes, category,
  ROUND(SUM(importe_cents) / 100.0, 2) AS ingreso_lineas_eur,
  ROUND(100.0 * SUM(importe_cents) / SUM(SUM(importe_cents)) OVER (PARTITION BY mes), 1) AS pct_del_mes
FROM lineas
GROUP BY mes, category
ORDER BY mes, category;
```

### 1.2 Alemania aporta el 50,5 % de las ventas con el 42,2 % de los pedidos y un ticket un 40 % más alto (105,89 € frente a 75,72 €)

**Qué dice el dato:** Alemania suma 236 pedidos y 24.989 € frente a los 323 pedidos y 24.458 € de España, es decir, la mitad de la facturación con el 42 % de los pedidos. Su ticket es un 40 % más alto (105,89 € frente a 75,72 €) y no se debe al IVA ni al envío, porque el subtotal medio también es mayor (86,49 € frente a 60,79 €). Además repiten más, con 6,6 pedidos por cliente frente a 3,0 en España.

**Por qué importa:** el anexo habla de Alemania como un mercado incipiente, pero ya pesa tanto como España y debería tener presupuesto y seguimiento propios. Hay un riesgo de concentración, porque esos 236 pedidos vienen de solo 36 clientes. El gasto de marketing no tiene país, así que no puedo calcular su IEC por separado. Para H2 recomiendo empezar a registrarlo.

**Cómo lo he calculado:** uso el país del pedido (`orders.country`). Los clientes son los distintos con algún pedido de ese país. El ticket medio usa `total_amount_cents` y el subtotal medio usa `subtotal_cents`.

```sql
WITH base AS (
  SELECT o.id, o.customer_id, o.country, o.created_at::date AS fecha,
    CASE LOWER(TRIM(o.channel))
      WHEN 'meta ads' THEN 'Meta Ads' WHEN 'instagram ads' THEN 'Meta Ads'
      WHEN 'email' THEN 'Email' WHEN 'newsletter' THEN 'Email'
      WHEN 'google ads' THEN 'Google Ads' WHEN 'tiktok ads' THEN 'TikTok Ads'
      WHEN 'organic' THEN 'Organic' WHEN 'direct' THEN 'Direct'
    END AS canal,
    o.subtotal_cents, o.shipping_cents, o.total_amount_cents
  FROM public.orders o
  WHERE o.status = 'delivered'
    AND NULLIF(o.deleted_at::text, '') IS NULL
    AND o.created_at::date BETWEEN DATE '2026-01-01' AND DATE '2026-06-30'
    AND o.subtotal_cents >= 100
)
SELECT country, COUNT(*) AS pedidos, COUNT(DISTINCT customer_id) AS clientes,
  ROUND(SUM(total_amount_cents) / 100.0, 2) AS ventas_eur,
  ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER (), 1) AS pct_pedidos,
  ROUND(100.0 * SUM(total_amount_cents) / SUM(SUM(total_amount_cents)) OVER (), 1) AS pct_ventas,
  ROUND(AVG(total_amount_cents) / 100.0, 2) AS ticket_medio_eur,
  ROUND(AVG(subtotal_cents) / 100.0, 2) AS subtotal_medio_eur,
  ROUND(1.0 * COUNT(*) / COUNT(DISTINCT customer_id), 1) AS pedidos_por_cliente
FROM base
GROUP BY country
ORDER BY ventas_eur DESC;
```

### 1.3 Meta Ads se lleva el 53,7 % del gasto desde marzo con el IEC más bajo (4,1), mientras que Email devuelve 15,1 con el 13,9 % del gasto

**Qué dice el dato:** de marzo a junio se invirtieron 3.220,90 € en marketing. Meta Ads (con Instagram) se lleva 1.729,14 € y atribuye 7.015,74 € de ventas, 4,1 € por cada euro. Email atribuye 6.774,30 € con 449,26 € (IEC 15,1) y Google Ads 4.801,14 € con 882,57 € (IEC 5,4). TikTok sale con 19,5, pero con solo 159,93 € de gasto (ver 1.4). Organic y Direct aportan el 35 % de los ingresos y no tienen gasto asignado.

**Por qué importa:** Meta se lleva más de la mitad del dinero y es el canal que menos devuelve, así que es el primer sitio donde mirar para H2. Esto no cambia si cada cliente se atribuye a su primer canal (ver 4.8). Aun así, no daría por hecho que Email aguanta una subida fuerte, porque parte de su IEC puede deberse a que vende a gente que ya compra (ver 1.7). Por eso 1.8 mueve el dinero de forma gradual.

**Cómo lo he calculado:** el IEC es el ingreso atribuido al canal (total de los pedidos entregados, con IVA y envío) entre el gasto del canal, del 1 de marzo al 30 de junio por el cambio en el modelo de atribución. Instagram Ads se suma a Meta Ads y Newsletter a Email. En el gasto quito las copias exactas y paso Google Ads de céntimos a euros. Organic y Direct no tienen gasto y por tanto no tienen IEC. Conviene recordar que el IEC mide ingresos y no beneficio, y que cada pedido cuenta para un solo canal.

```sql
WITH base AS (
  SELECT o.id, o.customer_id, o.country, o.created_at::date AS fecha,
    CASE LOWER(TRIM(o.channel))
      WHEN 'meta ads' THEN 'Meta Ads' WHEN 'instagram ads' THEN 'Meta Ads'
      WHEN 'email' THEN 'Email' WHEN 'newsletter' THEN 'Email'
      WHEN 'google ads' THEN 'Google Ads' WHEN 'tiktok ads' THEN 'TikTok Ads'
      WHEN 'organic' THEN 'Organic' WHEN 'direct' THEN 'Direct'
    END AS canal,
    o.subtotal_cents, o.shipping_cents, o.total_amount_cents
  FROM public.orders o
  WHERE o.status = 'delivered'
    AND NULLIF(o.deleted_at::text, '') IS NULL
    AND o.created_at::date BETWEEN DATE '2026-01-01' AND DATE '2026-06-30'
    AND o.subtotal_cents >= 100
),
gasto AS (
  SELECT "date" AS fecha,
    CASE WHEN channel = 'Instagram Ads' THEN 'Meta Ads' ELSE channel END AS canal,
    CASE WHEN currency_unit = 'EUR_CENTS' THEN spend_raw::numeric / 100 ELSE spend_raw::numeric END AS gasto_eur
  FROM (SELECT DISTINCT "date", channel, spend_raw, currency_unit FROM public.marketing_spend) m
  WHERE "date" BETWEEN DATE '2026-01-01' AND DATE '2026-06-30'
),
ingresos AS (
  SELECT canal, COUNT(*) AS pedidos, SUM(total_amount_cents) / 100.0 AS ingresos_eur
  FROM base
  WHERE fecha >= DATE '2026-03-01'
  GROUP BY canal
),
gasto_canal AS (
  SELECT canal, SUM(gasto_eur) AS gasto_eur
  FROM gasto
  WHERE fecha >= DATE '2026-03-01'
  GROUP BY canal
)
SELECT i.canal, i.pedidos,
  ROUND(i.ingresos_eur, 2) AS ingresos_eur,
  ROUND(g.gasto_eur, 2) AS gasto_eur,
  ROUND(i.ingresos_eur / NULLIF(g.gasto_eur, 0), 1) AS iec,
  ROUND(100.0 * g.gasto_eur / SUM(g.gasto_eur) OVER (), 1) AS pct_del_gasto,
  ROUND(100.0 * i.ingresos_eur / SUM(i.ingresos_eur) OVER (), 1) AS pct_de_los_ingresos
FROM ingresos i
LEFT JOIN gasto_canal g ON g.canal = i.canal
ORDER BY iec DESC NULLS LAST;
```

### 1.4 TikTok mantuvo unos 9 pedidos al mes con un 95 % menos de inversión, de 788 € a 40 € mensuales

**Qué dice el dato:** en enero y febrero TikTok gastó 1.576,77 € y atribuyó 1.396,48 € en 17 pedidos, 0,89 € por euro gastado. Desde marzo gasta unos 40 € al mes (159,93 € en total) y atribuye 3.113,06 € en 36 pedidos, 19,5 € por euro. Los pedidos pasan de 8,5 a 9 al mes pese a la caída de la inversión.

**Por qué importa:** el gasto de enero y febrero no parece haber sido necesario, así que no volvería a ese nivel. Tampoco creo que el IEC de 19,5 demuestre que escalar TikTok funcione, porque el gasto es mínimo y los pedidos no parecen depender de él. Propongo subirlo a 100 € al mes durante dos meses y ver si los pedidos crecen. La atribución cambió en marzo, así que la comparación entre antes y después es un indicio y no una prueba.

**Cómo lo he calculado:** gasto mensual de TikTok Ads (sin copias exactas) frente a los ingresos y pedidos entregados atribuidos a TikTok Ads. La reducción del 95 % compara el gasto medio mensual de enero y febrero (788,39 €) con el de marzo a junio (39,98 €).

```sql
WITH base AS (
  SELECT o.id, o.customer_id, o.country, o.created_at::date AS fecha,
    CASE LOWER(TRIM(o.channel))
      WHEN 'meta ads' THEN 'Meta Ads' WHEN 'instagram ads' THEN 'Meta Ads'
      WHEN 'email' THEN 'Email' WHEN 'newsletter' THEN 'Email'
      WHEN 'google ads' THEN 'Google Ads' WHEN 'tiktok ads' THEN 'TikTok Ads'
      WHEN 'organic' THEN 'Organic' WHEN 'direct' THEN 'Direct'
    END AS canal,
    o.subtotal_cents, o.shipping_cents, o.total_amount_cents
  FROM public.orders o
  WHERE o.status = 'delivered'
    AND NULLIF(o.deleted_at::text, '') IS NULL
    AND o.created_at::date BETWEEN DATE '2026-01-01' AND DATE '2026-06-30'
    AND o.subtotal_cents >= 100
),
gasto AS (
  SELECT "date" AS fecha,
    CASE WHEN channel = 'Instagram Ads' THEN 'Meta Ads' ELSE channel END AS canal,
    CASE WHEN currency_unit = 'EUR_CENTS' THEN spend_raw::numeric / 100 ELSE spend_raw::numeric END AS gasto_eur
  FROM (SELECT DISTINCT "date", channel, spend_raw, currency_unit FROM public.marketing_spend) m
  WHERE "date" BETWEEN DATE '2026-01-01' AND DATE '2026-06-30'
),
gasto_mes AS (
  SELECT to_char(fecha, 'YYYY-MM') AS mes, SUM(gasto_eur) AS gasto_eur
  FROM gasto WHERE canal = 'TikTok Ads' GROUP BY 1
),
ingresos_mes AS (
  SELECT to_char(fecha, 'YYYY-MM') AS mes, COUNT(*) AS pedidos, SUM(total_amount_cents) / 100.0 AS ingresos_eur
  FROM base WHERE canal = 'TikTok Ads' GROUP BY 1
)
SELECT g.mes, ROUND(g.gasto_eur, 2) AS gasto_eur, i.pedidos,
  ROUND(i.ingresos_eur, 2) AS ingresos_eur,
  ROUND(i.ingresos_eur / NULLIF(g.gasto_eur, 0), 2) AS ingresos_por_euro_gastado
FROM gasto_mes g
LEFT JOIN ingresos_mes i ON i.mes = g.mes
ORDER BY g.mes;
```

### 1.5 Deporte ya es el 16,5 % del ingreso de junio, pero el 53 % de lo que ha ingresado viene de dos fichas retiradas

**Qué dice el dato:** Deporte está en catálogo desde el 1 de mayo e ingresa 873,60 € en mayo y 946,55 € en junio (el 12,8 % y el 16,5 % del mes), mientras Ropa cae un 27 %. Pero 969,60 € de sus 1.820,15 € del semestre (el 53 %) vienen de Camiseta Técnica y Mochila Deporte, que figuran como inactivas. Con solo las dos fichas activas, Leggings Training y Botella Térmica, Deporte ingresa 850,55 €.

**Por qué importa:** producto confía en Deporte para H2, pero la parte activa vende la mitad de lo que parece. Antes de darle presupuesto hay que decidir si se reponen o se sustituyen las dos fichas retiradas. Además solo hay dos meses de historia (ver 4.7), así que la tendencia es todavía muy corta.

**Cómo lo he calculado:** ingreso de líneas de los pedidos de la base, separado por `products.active`. La evolución mensual de Deporte y Ropa sale de la tercera query de 1.1. Aquí no aplico el filtro de catálogo activo, para poder ver cuánto pesan las fichas retiradas.

```sql
WITH base AS (
  SELECT o.id, o.customer_id, o.country, o.created_at::date AS fecha,
    CASE LOWER(TRIM(o.channel))
      WHEN 'meta ads' THEN 'Meta Ads' WHEN 'instagram ads' THEN 'Meta Ads'
      WHEN 'email' THEN 'Email' WHEN 'newsletter' THEN 'Email'
      WHEN 'google ads' THEN 'Google Ads' WHEN 'tiktok ads' THEN 'TikTok Ads'
      WHEN 'organic' THEN 'Organic' WHEN 'direct' THEN 'Direct'
    END AS canal,
    o.subtotal_cents, o.shipping_cents, o.total_amount_cents
  FROM public.orders o
  WHERE o.status = 'delivered'
    AND NULLIF(o.deleted_at::text, '') IS NULL
    AND o.created_at::date BETWEEN DATE '2026-01-01' AND DATE '2026-06-30'
    AND o.subtotal_cents >= 100
),
lineas AS (
  SELECT b.fecha, p.category, p.active, i.quantity, i.quantity * i.unit_price_cents AS importe_cents
  FROM base b
  JOIN public.order_items i ON i.order_id = b.id
  JOIN public.products p ON p.id = i.product_id
)
SELECT category,
  ROUND(SUM(importe_cents) / 100.0, 2) AS ingreso_lineas_eur,
  ROUND(100.0 * SUM(importe_cents) / SUM(SUM(importe_cents)) OVER (), 1) AS pct,
  SUM(quantity) AS unidades,
  ROUND(SUM(importe_cents) FILTER (WHERE active) / 100.0, 2) AS ingreso_activos_eur,
  ROUND(SUM(importe_cents) FILTER (WHERE NOT active) / 100.0, 2) AS ingreso_retirados_eur
FROM lineas
GROUP BY category
ORDER BY ingreso_lineas_eur DESC;
```

### 1.6 Seis productos se venden siempre con un descuento fijo del 10 % al 20 %, que supone 1.607,66 € menos de ingreso (el 14,7 % del valor a precio de catálogo)

**Qué dice el dato:** Jersey Punto (−20 %), Pantalón Cargo (−10 %), Camisa Lino (−15 %), Mocasines Cuero (−20 %), Cinturón Piel (−10 %) y Botas Chelsea (−15 %) se venden por debajo del precio de catálogo en todas sus líneas. Entre los seis ingresan 9.365,64 € y han dejado de ingresar 1.607,66 €.

**Por qué importa:** un descuento que se aplica siempre ya no es una promoción, es el precio de venta. Mocasines Cuero (10 unidades) y Botas Chelsea (8) venden poco incluso con descuento, así que no parece moverlos. Pantalón Cargo es el más vendido de los seis (62 unidades) y el mejor candidato para probar el precio de catálogo: a 49,95 € le bastaría vender 56 unidades para igualar su ingreso actual de 2.787,52 €.

**Cómo lo he calculado:** líneas de los pedidos de la base con un precio inferior al de catálogo. El descuento es 1 menos el precio de la línea entre el precio de catálogo, y el importe no ingresado es la cantidad por la diferencia de precios. No tiene relación con los códigos promocionales, que no aparecen en ningún importe (ver 4.11). El 14,7 % sale de dividir 1.607,66 € entre 10.973,30 €, que es lo ingresado más lo cedido por esos seis productos.

```sql
WITH base AS (
  SELECT o.id, o.customer_id, o.country, o.created_at::date AS fecha,
    CASE LOWER(TRIM(o.channel))
      WHEN 'meta ads' THEN 'Meta Ads' WHEN 'instagram ads' THEN 'Meta Ads'
      WHEN 'email' THEN 'Email' WHEN 'newsletter' THEN 'Email'
      WHEN 'google ads' THEN 'Google Ads' WHEN 'tiktok ads' THEN 'TikTok Ads'
      WHEN 'organic' THEN 'Organic' WHEN 'direct' THEN 'Direct'
    END AS canal,
    o.subtotal_cents, o.shipping_cents, o.total_amount_cents
  FROM public.orders o
  WHERE o.status = 'delivered'
    AND NULLIF(o.deleted_at::text, '') IS NULL
    AND o.created_at::date BETWEEN DATE '2026-01-01' AND DATE '2026-06-30'
    AND o.subtotal_cents >= 100
),
l AS (
  SELECT p.id, p.name, p.price_cents, i.unit_price_cents, i.quantity
  FROM base b
  JOIN public.order_items i ON i.order_id = b.id
  JOIN public.products p ON p.id = i.product_id
)
SELECT id AS product_id, name, price_cents AS precio_catalogo,
  MIN(unit_price_cents) AS precio_venta_min, MAX(unit_price_cents) AS precio_venta_max,
  ROUND(100.0 * (1 - MIN(unit_price_cents)::numeric / price_cents), 1) AS descuento_pct,
  SUM(quantity) AS unidades,
  ROUND(SUM(quantity * unit_price_cents) / 100.0, 2) AS ingreso_lineas_eur,
  ROUND(SUM(quantity * (price_cents - unit_price_cents)) / 100.0, 2) AS descuento_cedido_eur,
  ROUND(SUM(SUM(quantity * (price_cents - unit_price_cents))) OVER () / 100.0, 2) AS descuento_cedido_total_eur
FROM l
GROUP BY id, name, price_cents
HAVING SUM(quantity * (price_cents - unit_price_cents)) > 0
ORDER BY descuento_cedido_eur DESC;
```

### 1.7 Los pedidos de clientes nuevos bajan de 29 en enero a 10 en junio y el 79 % de las ventas ya viene de clientes que repiten

**Qué dice el dato:** los primeros pedidos entregados de cada cliente bajan de 29 en enero a 10 en junio (−66 %), mientras que los de recompra se mueven entre 47 y 91 al mes. En el semestre, los clientes que repiten aportan 39.005,55 € (el 78,9 % de las ventas) y los nuevos 10.441,53 €.

**Por qué importa:** el gasto de marketing se mantuvo entre 770 € y 833 € al mes de abril a junio, así que cada pedido de cliente nuevo pasó de costar unos 32 € a unos 78 €. Si la captación sigue cayendo, las ventas dependerán cada vez más de la recompra. Parte de la subida de la recompra es mecánica, porque cada mes hay más clientes que pueden repetir, pero la caída de los nuevos no tiene esa explicación. Antes de mover dinero hacia retención (ver 1.8) convendría ver qué canales captan de verdad clientes nuevos.

**Cómo lo he calculado:** el primer pedido es el primer pedido entregado del cliente (los datos empiezan en enero, así que no hay compras anteriores) y el recurrente es cualquier pedido posterior. El coste por pedido de cliente nuevo es aproximado: gasto total del mes (segunda query) entre los primeros pedidos de ese mes (769,95 € entre 24 en abril y 776,69 € entre 10 en junio). Incluye clientes que llegan por canales sin gasto.

```sql
WITH base AS (
  SELECT o.id, o.customer_id, o.country, o.created_at::date AS fecha,
    CASE LOWER(TRIM(o.channel))
      WHEN 'meta ads' THEN 'Meta Ads' WHEN 'instagram ads' THEN 'Meta Ads'
      WHEN 'email' THEN 'Email' WHEN 'newsletter' THEN 'Email'
      WHEN 'google ads' THEN 'Google Ads' WHEN 'tiktok ads' THEN 'TikTok Ads'
      WHEN 'organic' THEN 'Organic' WHEN 'direct' THEN 'Direct'
    END AS canal,
    o.subtotal_cents, o.shipping_cents, o.total_amount_cents
  FROM public.orders o
  WHERE o.status = 'delivered'
    AND NULLIF(o.deleted_at::text, '') IS NULL
    AND o.created_at::date BETWEEN DATE '2026-01-01' AND DATE '2026-06-30'
    AND o.subtotal_cents >= 100
),
ord AS (
  SELECT b.fecha, b.total_amount_cents,
    ROW_NUMBER() OVER (PARTITION BY b.customer_id ORDER BY b.fecha, b.id) AS n_pedido
  FROM base b
)
SELECT to_char(fecha, 'YYYY-MM') AS mes,
  COUNT(*) FILTER (WHERE n_pedido = 1) AS pedidos_clientes_nuevos,
  COUNT(*) FILTER (WHERE n_pedido > 1) AS pedidos_recurrentes,
  ROUND(100.0 * COUNT(*) FILTER (WHERE n_pedido > 1) / COUNT(*), 1) AS pct_recurrentes,
  ROUND(SUM(total_amount_cents) FILTER (WHERE n_pedido = 1) / 100.0, 2) AS ventas_nuevos_eur,
  ROUND(SUM(total_amount_cents) FILTER (WHERE n_pedido > 1) / 100.0, 2) AS ventas_recurrentes_eur
FROM ord
GROUP BY 1
ORDER BY 1;
```

```sql
SELECT to_char("date", 'YYYY-MM') AS mes,
  ROUND(SUM(CASE WHEN currency_unit = 'EUR_CENTS' THEN spend_raw::numeric / 100 ELSE spend_raw::numeric END), 2) AS gasto_eur
FROM (SELECT DISTINCT "date", channel, spend_raw, currency_unit FROM public.marketing_spend) m
WHERE "date" <= DATE '2026-06-30'
GROUP BY 1
ORDER BY 1;
```

### 1.8 Para el segundo semestre propongo mover unos 650 € de Meta Ads a Email en dos fases y probar TikTok con 100 € al mes

**Qué dice el dato:** al ritmo de marzo a junio, H2 supondría unos 4.831 € de gasto, con 2.594 € para Meta Ads y 674 € para Email. Mover el 25 % del gasto de Meta (648 €) a Email casi duplicaría la inversión de Email. Si Email mantuviera su IEC medio (15,1), esos 648 € atribuirían unos 9.780 € y Meta dejaría de atribuir unos 2.630 €. El cambio compensa mientras el IEC de los euros adicionales de Email siga por encima del de Meta (4,1), es decir, por encima del 27 % de su IEC medio.

**Por qué importa:** lo propongo en dos fases porque no sé si Email puede crecer de forma proporcional. En el tercer trimestre se mueven 324 € y se mira si Email conserva un IEC superior a 4,1 y si los pedidos de clientes nuevos (ver 1.7) se mantienen. Si es así, se mueve el resto en el cuarto trimestre, y si no, se para. Además, probar TikTok con 100 € al mes durante dos meses (unos 120 € más que al ritmo actual) cuesta poco y ayuda a saber si el canal escala (ver 1.4).

**Cómo lo he calculado:** es una simulación lineal y no una previsión. El ritmo de gasto es el de marzo a junio dividido entre 4 y multiplicado por 6. El traslado es el 25 % del gasto de Meta en H2 y los ingresos son el traslado por el IEC de cada canal, con IVA y envío. El umbral es el IEC de Meta entre el de Email (4,06 / 15,08 = 27 %). Los datos de partida son los de 1.3.

```sql
WITH base AS (
  SELECT o.id, o.customer_id, o.country, o.created_at::date AS fecha,
    CASE LOWER(TRIM(o.channel))
      WHEN 'meta ads' THEN 'Meta Ads' WHEN 'instagram ads' THEN 'Meta Ads'
      WHEN 'email' THEN 'Email' WHEN 'newsletter' THEN 'Email'
      WHEN 'google ads' THEN 'Google Ads' WHEN 'tiktok ads' THEN 'TikTok Ads'
      WHEN 'organic' THEN 'Organic' WHEN 'direct' THEN 'Direct'
    END AS canal,
    o.subtotal_cents, o.shipping_cents, o.total_amount_cents
  FROM public.orders o
  WHERE o.status = 'delivered'
    AND NULLIF(o.deleted_at::text, '') IS NULL
    AND o.created_at::date BETWEEN DATE '2026-01-01' AND DATE '2026-06-30'
    AND o.subtotal_cents >= 100
),
gasto AS (
  SELECT "date" AS fecha,
    CASE WHEN channel = 'Instagram Ads' THEN 'Meta Ads' ELSE channel END AS canal,
    CASE WHEN currency_unit = 'EUR_CENTS' THEN spend_raw::numeric / 100 ELSE spend_raw::numeric END AS gasto_eur
  FROM (SELECT DISTINCT "date", channel, spend_raw, currency_unit FROM public.marketing_spend) m
  WHERE "date" BETWEEN DATE '2026-01-01' AND DATE '2026-06-30'
),
ingresos AS (
  SELECT canal, SUM(total_amount_cents) / 100.0 AS ingresos_eur
  FROM base
  WHERE fecha >= DATE '2026-03-01'
  GROUP BY canal
),
gasto_canal AS (
  SELECT canal, SUM(gasto_eur) AS gasto_eur
  FROM gasto
  WHERE fecha >= DATE '2026-03-01'
  GROUP BY canal
),
iec AS (
  SELECT i.canal, g.gasto_eur, i.ingresos_eur / g.gasto_eur AS iec
  FROM ingresos i
  JOIN gasto_canal g ON g.canal = i.canal
)
SELECT ROUND(m.gasto_eur / 4, 2) AS meta_gasto_mensual_eur,
  ROUND(m.gasto_eur / 4 * 6, 2) AS meta_gasto_h2_eur,
  ROUND(m.gasto_eur / 4 * 6 * 0.25, 2) AS traslado_eur,
  ROUND(e.gasto_eur / 4 * 6, 2) AS email_gasto_h2_eur,
  ROUND((SELECT SUM(gasto_eur) FROM gasto_canal) / 4 * 6, 2) AS gasto_total_h2_eur,
  ROUND(m.iec, 2) AS iec_meta,
  ROUND(e.iec, 2) AS iec_email,
  ROUND(100.0 * m.iec / e.iec, 1) AS iec_minimo_email_pct_del_medio,
  ROUND(m.gasto_eur / 4 * 6 * 0.25 * m.iec, 2) AS ingresos_que_deja_de_atribuir_meta_eur,
  ROUND(m.gasto_eur / 4 * 6 * 0.25 * e.iec, 2) AS ingresos_si_email_mantiene_su_iec_eur
FROM iec m, iec e
WHERE m.canal = 'Meta Ads' AND e.canal = 'Email';
```

---

## 2. Modelado de datos

El análisis se hace directamente sobre las tablas base de Supabase, sin crear esquemas ni vistas auxiliares. Descarté las vistas del sistema (`v_*`) porque sus cifras no cuadran con las tablas. Por ejemplo, la vista mensual suma 793 pedidos frente a los 767 reales y llega hasta julio.

### Base de trabajo

Parto de los 767 pedidos de la tabla `orders`. Quito los 48 de julio (quedan 719) y los 11 marcados como eliminados (`deleted_at`), con lo que quedan 708. De ellos, 567 están entregados (`status = 'delivered'`). Por último dejo fuera 8 pedidos con un subtotal inferior a 1 €, que parecen errores de captura. La base de ventas queda en **559 pedidos** y **49.447,08 €**. La query `sql/00_cuadre_base.sql` comprueba estas cifras.

### Tablas y relaciones

| Relación | Clave de cruce | Cómo se integra |
| --- | --- | --- |
| orders → customers | customer_id = id | Todos los pedidos tienen cliente. Sirve para analizar la recompra. |
| order_items → orders | order_id = id | Todas las líneas pertenecen a un pedido existente. Dan el detalle de lo vendido. |
| order_items → products | product_id = id | Se excluyen 19 líneas (ids 901 a 919) porque su producto no existe en el catálogo y su importe no está facturado. |
| order_promotions → orders | order_id | Se agrega por pedido antes de cruzar, para no duplicar ingresos en los 26 pedidos con dos códigos. |
| refunds → orders | order_id = id | Recoge las devoluciones que registra atención al cliente. |
| marketing_spend ↔ orders | canal unificado y fecha | No hay clave directa, así que se cruza por fecha y canal normalizado. |

### Criterios de filtrado e integración

* **Unidad de análisis:** el pedido. Las tablas hijas (líneas, promociones, devoluciones) se agregan por pedido antes de cruzarlas, para no duplicar importes.
* **Periodo:** pedidos creados entre el 1 de enero y el 30 de junio de 2026, según la fecha de creación en hora de Madrid.
* **Importe de venta:** `total_amount_cents`, la cifra que maneja finanzas. Incluye IVA y envío.
* **Ingreso por producto:** cantidad por precio unitario de la línea. No uso el precio de catálogo porque hay productos que siempre se venden con descuento.
* **Catálogo activo:** en el análisis de producto aplico `active = true`, como pide dirección, y mido aparte las ventas de los productos retirados.

### Transformaciones aplicadas

* **Unificación de canales:** mapeo explícito, igual en pedidos y en gasto. Instagram Ads pasa a Meta Ads y Newsletter a Email. Organic y Direct se mantienen como tráfico sin inversión.
* **Homogeneización de la inversión:** el gasto de Google Ads viene en céntimos y lo divido entre 100. Elimino 2 filas duplicadas exactas (misma fecha, canal e importe).
* **Ventana del IEC:** del 1 de marzo al 30 de junio, por el cambio en el modelo de atribución, con 3.220,90 € de gasto depurado.

---

## 3. Decisiones de presentación

El panel es un único recorrido de arriba abajo, con una barra para saltar a cada parte: ventas para dirección, canales para marketing, producto para el catálogo y promociones para ecommerce.
Arriba van las cinco cifras clave con una frase que dice cómo se han calculado (pedidos entregados, sin eliminados ni pedidos de menos de 1 €), porque es lo primero que mira dirección y tiene que entenderse sin que nadie lo explique.
Después van las ventas por mes y por país y, justo debajo, los canales con el título «Recomendación de inversión prioritaria», que es la decisión para la que se hace la reunión. Ordeno el ranking por IEC y dejo el ticket medio como una columna más, porque por ticket medio Meta Ads sería el primero y por IEC es el último (supuesto 4.10). TikTok sale en gris en el gráfico y con un aviso en ámbar en la tabla, para que nadie lo lea como un canal en el que meter más dinero.
Los gráficos parten de cero, junio sale más claro porque tiene pedidos pendientes que todavía no cuentan como venta, y cada gráfico va con su tabla para ver la cifra exacta. Al pasar el ratón, el texto se ve claro sobre el fondo oscuro.
Al principio el porcentaje de cada categoría iba en el color de acento y lo quité porque parecía una subida o una bajada. Ahora va en gris y con «del total» al lado. Los países también los cambié: aparecen como Alemania y España, no como DE y ES.
Dejé fuera a propósito la evolución de clientes nuevos y recurrentes, los descuentos permanentes y el detalle de TikTok, que se quedan en el README. La propuesta del segundo semestre sí está, pero marcada como simulación y no como previsión. Quería un panel con poco texto, que se pueda leer sin nadie al lado.

Cada cifra del panel sale de una query de `sql/dashboard/`, que la aplicación ejecuta tal cual contra Supabase, así que coincide con las del README. Varias son las mismas que las de las conclusiones y el resto (clientes y devoluciones, productos, categorías y códigos promocionales) las he añadido para cubrir lo que pide dirección.

---

## 4. Supuestos y limitaciones

Cada punto explica qué decidí, por qué y cuánto cambiaría el resultado con la opción contraria. Las queries que respaldan estas cifras están en `sql/supuestos/`.

### 4.1 Filtros de la base: periodo, pedidos eliminados y subtotales inferiores a 1 €

Dejé fuera los pedidos posteriores al 30 de junio, los 11 marcados como eliminados (`deleted_at`) y 8 pedidos entregados con un subtotal inferior a 1 €, que parecen errores de captura. Así el análisis cubre solo el semestre cerrado y el ticket medio no se distorsiona. Si hubiera incluido los dos primeros grupos, se sumarían 37 pedidos y 3.055,88 € más (un 6,2 % sobre los 49.492,66 € de pedidos entregados). Si mantuviera los 8 pedidos pequeños, las ventas solo subirían 45,58 € (+0,09 %), pero el ticket medio bajaría de 88,46 € a 87,29 €.

### 4.2 Qué estados cuentan como venta

Solo cuento los pedidos entregados (`status = 'delivered'`), para no sumar ingresos que todavía no se han consolidado, como los de pedidos cancelados o pendientes. Con todos los estados, las ventas subirían a 61.856,23 € (+25,1 %). Con el criterio bruto, que suma entregados y reembolsados, serían 53.382,67 € (+8,0 %), y 49.690,29 € (+0,5 %) si a eso se le resta lo devuelto.

### 4.3 Tratamiento del cliente 177

Mantengo al cliente 177 porque son ingresos reales, pero analizo aparte su efecto. Son 12 pedidos de compras de volumen que suman 3.370,50 € (el 6,8 % de las ventas). Si lo excluyera por considerarlo un posible mayorista, las ventas bajarían a 46.076,58 € y el ticket medio de la tienda de 88,46 € a 84,23 €.

### 4.4 Canales y moneda

Unifico los canales con un mapeo explícito y divido entre 100 el gasto de Google Ads, que es el único expresado en céntimos. Al principio agrupé los canales con coincidencia parcial de texto (`LIKE`), pero lo cambié porque unir Instagram Ads o Newsletter debe ser una decisión mía y no de un patrón de texto. Con `LIKE`, cualquier valor nuevo que contuviera «meta» habría acabado en Meta Ads. Sin la conversión de moneda, el gasto de enero a junio sería de 133.319,49 € en lugar de 6.242,10 €, y Google Ads pasaría del 20,6 % del gasto al 96,3 %, con un IEC falsamente bajo.

### 4.5 IEC de TikTok Ads

Muestro la eficiencia de TikTok desde marzo, con una advertencia. Su inversión cayó un 95 % (unos 40 € al mes) y los pedidos se mantuvieron, lo que infla el ratio porque el gasto es muy pequeño (159,93 €). Su IEC desde marzo es 19,5. Con el semestre completo (1.736,70 € de gasto) sería 2,6, pero los ingresos anteriores a marzo no son comparables por el cambio de atribución. Leído sin contexto, el primer dato sugeriría escalar el canal, y no hay evidencia de que el resultado se mantuviera con más inversión.

### 4.6 Catálogo activo y las dos fichas de la sudadera

Aplico el filtro de productos activos para evaluar el surtido, como pide dirección. Si incluyera los retirados, las líneas vendidas de Deporte subirían de 38 a 81 (+113 %), porque dos de sus cuatro referencias están retiradas aunque se siguieron vendiendo entre mayo y julio (son líneas de todo el histórico). Hay una excepción: la «Sudadera con Capucha» (id 24, retirada) y la «Sudadera Capucha» (id 2, activa) parecen el mismo artículo. La primera vendió del 4 de enero al 14 de marzo y la segunda empieza el 18 de marzo, con un precio mayor (59,95 € frente a 54,95 €). Las trato como un solo producto. Si aplicara `active = true` sin unirlas, la sudadera parecería nacida en marzo, con 30 unidades y 1.798,50 €, cuando entre las dos suman 58 unidades y 3.337,10 €. Se perdería el 46 % de su ingreso.

### 4.7 Deporte solo tiene dos meses de historia

Las cuatro referencias de Deporte se dieron de alta el 1 de mayo, aunque el anexo dice que las cuatro categorías están en catálogo desde principios de año. Por eso comparo Deporte con las demás categorías solo en mayo y junio. Con el semestre completo pesaría un 4,5 % del ingreso de líneas, frente al 14,5 % de mayo y junio, y parecería marginal solo porque le faltan meses.

### 4.8 Canal del pedido, no del cliente

El canal que uso es el del pedido, porque la base no guarda el que captó al cliente. Los clientes que más compran aparecen con hasta 9 etiquetas de canal sin unificar (el cliente 137 tiene 29 pedidos repartidos en 9), así que el IEC dice a qué canal se atribuye cada pedido y no si compensa captar clientes con él. Si asignara cada cliente al canal de su primer pedido, el IEC de Meta casi no cambiaría (de 4,1 a 4,0) y seguiría siendo el último. El de TikTok bajaría de 19,5 a 11,2 y Email pasaría a ser el primero, con 14,6. Los ingresos de Direct bajarían de 3.205 € a 263 €, lo que indica que al menos el 92 % lo generan clientes cuyo primer pedido llegó por otro canal. La conclusión sobre Meta no depende de este criterio.

### 4.9 Alemania no es un mercado incipiente

El anexo describe Alemania como un mercado incipiente, pero los datos no lo respaldan. De enero a junio, según el país del cliente (en 1.2 uso el del pedido) y con todos los estados, 28 clientes alemanes suman 297 pedidos (10,6 por cliente) frente a los 411 pedidos de 114 clientes españoles (3,6 por cliente). Sobre los 767 pedidos sin filtrar, Alemania es el 42 % de los pedidos y el 51 % del importe. Los siete clientes alemanes con más pedidos reúnen el 49 % de los del país, así que hay cierto riesgo de concentración. Con la etiqueta del anexo, Alemania sería una línea secundaria del presupuesto, y con estos datos pesa tanto como España.

### 4.10 Ticket medio por canal

Dirección propone comparar canales por su ticket medio, pero el ticket medio no dice si un canal compensa su inversión. Lo muestro como dato de contexto y ordeno el ranking por IEC. Por ticket medio, entre los canales de pago Meta Ads sería el primero (101,68 € de marzo a junio) y Google Ads el último (76,21 €). Con el IEC, Meta pasa al último puesto y TikTok Ads (19,5) queda primero.

### 4.11 Devoluciones y promociones

Calculo la tasa de devolución como pedidos reembolsados entre entregados y reembolsados, como indica dirección: 45 sobre 604, un 7,45 %. Si cuento también las 13 devoluciones parciales de pedidos entregados en el periodo, hay 58 pedidos con alguna devolución y la tasa sube al 9,6 %.

Ningún código promocional se refleja en un importe. El subtotal coincide con la suma de las líneas en todos los pedidos facturados (las 18 diferencias se explican por las 19 líneas sin producto de la sección 2). Por eso el «ingreso por código» es el total del pedido completo, y un pedido con dos códigos (hay 26) aparece bajo cada uno pero se cuenta una sola vez en el total. Si los descuentos se hubieran aplicado, el ingreso real por código sería menor, y con estos datos no se puede medir cuánto.

### 4.12 Fecha del pedido y reseñas repetidas

Uso `created_at`, que está en hora de Madrid. Con `created_at_utc` (UTC), 36 de los 767 pedidos cambiarían de día y el recuento mensual variaría como máximo en 5 pedidos (febrero: 99 frente a 104), así que la evolución mensual no depende de esta elección.

Para la valoración media cuento una sola reseña por cliente y producto, la más reciente y anterior al 30 de junio, porque 17 pares cliente-producto tienen más de una reseña y un mismo cliente pesaría varias veces. Con este criterio quedan 185 reseñas en lugar de 201. Solo cambia la media de 6 productos y como mucho 0,09 puntos (Sandalias Verano, de 4,38 a 4,29), así que no altera ninguna conclusión de producto.

</div>

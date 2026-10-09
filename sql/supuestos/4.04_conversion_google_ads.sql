WITH gasto AS (
  SELECT CASE WHEN channel = 'Instagram Ads' THEN 'Meta Ads' ELSE channel END AS canal,
    spend_raw::numeric AS sin_convertir,
    CASE WHEN currency_unit = 'EUR_CENTS' THEN spend_raw::numeric / 100 ELSE spend_raw::numeric END AS convertido
  FROM (SELECT DISTINCT "date", channel, spend_raw, currency_unit FROM public.marketing_spend) m
  WHERE "date" BETWEEN DATE '2026-01-01' AND DATE '2026-06-30'
),
por_canal AS (
  SELECT canal, SUM(convertido) AS convertido, SUM(sin_convertir) AS sin_convertir
  FROM gasto
  GROUP BY canal
)
SELECT canal,
  ROUND(convertido, 2) AS gasto_convertido_eur,
  ROUND(100.0 * convertido / SUM(convertido) OVER (), 1) AS pct_convertido,
  ROUND(sin_convertir, 2) AS gasto_sin_convertir_eur,
  ROUND(100.0 * sin_convertir / SUM(sin_convertir) OVER (), 1) AS pct_sin_convertir
FROM por_canal
UNION ALL
SELECT 'TOTAL', ROUND(SUM(convertido), 2), 100.0, ROUND(SUM(sin_convertir), 2), 100.0
FROM por_canal
ORDER BY 2;

SELECT to_char("date", 'YYYY-MM') AS mes,
  ROUND(SUM(CASE WHEN currency_unit = 'EUR_CENTS' THEN spend_raw::numeric / 100 ELSE spend_raw::numeric END), 2) AS gasto_eur
FROM (SELECT DISTINCT "date", channel, spend_raw, currency_unit FROM public.marketing_spend) m
WHERE "date" <= DATE '2026-06-30'
GROUP BY 1
ORDER BY 1;

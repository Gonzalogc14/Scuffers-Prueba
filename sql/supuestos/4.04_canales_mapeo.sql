SELECT channel AS canal_original,
  CASE LOWER(TRIM(channel))
    WHEN 'meta ads' THEN 'Meta Ads' WHEN 'instagram ads' THEN 'Meta Ads'
    WHEN 'email' THEN 'Email' WHEN 'newsletter' THEN 'Email'
    WHEN 'google ads' THEN 'Google Ads' WHEN 'tiktok ads' THEN 'TikTok Ads'
    WHEN 'organic' THEN 'Organic' WHEN 'direct' THEN 'Direct'
  END AS canal_unificado,
  (LOWER(channel) LIKE '%meta%') AS lo_habria_cogido_like_meta,
  COUNT(*) AS pedidos
FROM public.orders
GROUP BY channel
ORDER BY canal_unificado NULLS FIRST, channel;

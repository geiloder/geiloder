-- =====================
-- VIEW: Klicks pro Deal
-- =====================
CREATE OR REPLACE VIEW public.v_deal_clicks AS
SELECT
  d.id,
  d.produktname,
  d.shop,
  d.kategorie,
  d.deal_score,
  d.deal_preis,
  d.rabatt_prozent,
  d.status,
  COUNT(c.id) AS total_clicks,
  COUNT(CASE WHEN c.created_at >= NOW() - INTERVAL '24 hours' THEN 1 END) AS clicks_24h,
  COUNT(CASE WHEN c.created_at >= NOW() - INTERVAL '7 days' THEN 1 END) AS clicks_7d,
  COUNT(CASE WHEN c.created_at >= NOW() - INTERVAL '30 days' THEN 1 END) AS clicks_30d
FROM public.deals d
LEFT JOIN public.clicks c ON c.deal_id = d.id
GROUP BY d.id, d.produktname, d.shop, d.kategorie, d.deal_score, d.deal_preis, d.rabatt_prozent, d.status;

-- =====================
-- VIEW: Klicks pro Kategorie
-- =====================
CREATE OR REPLACE VIEW public.v_clicks_by_kategorie AS
SELECT
  d.kategorie,
  COUNT(c.id) AS total_clicks,
  COUNT(CASE WHEN c.created_at >= NOW() - INTERVAL '24 hours' THEN 1 END) AS clicks_24h,
  COUNT(CASE WHEN c.created_at >= NOW() - INTERVAL '7 days' THEN 1 END) AS clicks_7d,
  COUNT(DISTINCT d.id) AS deals_count
FROM public.deals d
LEFT JOIN public.clicks c ON c.deal_id = d.id
GROUP BY d.kategorie
ORDER BY total_clicks DESC;

-- =====================
-- VIEW: Klicks pro Plattform/Source
-- =====================
CREATE OR REPLACE VIEW public.v_clicks_by_source AS
SELECT
  COALESCE(c.source, 'unknown') AS source,
  COUNT(*) AS total_clicks,
  COUNT(CASE WHEN c.created_at >= NOW() - INTERVAL '24 hours' THEN 1 END) AS clicks_24h,
  COUNT(CASE WHEN c.created_at >= NOW() - INTERVAL '7 days' THEN 1 END) AS clicks_7d
FROM public.clicks c
GROUP BY c.source
ORDER BY total_clicks DESC;

-- =====================
-- VIEW: Klicks pro Tag (letzte 30 Tage)
-- =====================
CREATE OR REPLACE VIEW public.v_clicks_daily AS
SELECT
  DATE_TRUNC('day', c.created_at AT TIME ZONE 'Europe/Berlin') AS day,
  COUNT(*) AS clicks,
  COUNT(DISTINCT c.deal_id) AS deals_clicked
FROM public.clicks c
WHERE c.created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE_TRUNC('day', c.created_at AT TIME ZONE 'Europe/Berlin')
ORDER BY day DESC;

-- =====================
-- VIEW: Gesamt-Stats
-- =====================
CREATE OR REPLACE VIEW public.v_stats AS
SELECT
  (SELECT COUNT(*) FROM public.deals WHERE status IN ('approved', 'rendered', 'scheduled', 'posted')) AS active_deals,
  (SELECT COUNT(*) FROM public.deals WHERE status = 'new') AS new_deals,
  (SELECT COUNT(*) FROM public.clicks) AS total_clicks,
  (SELECT COUNT(*) FROM public.clicks WHERE created_at >= NOW() - INTERVAL '24 hours') AS clicks_today,
  (SELECT COUNT(*) FROM public.clicks WHERE created_at >= NOW() - INTERVAL '7 days') AS clicks_7d,
  (SELECT COUNT(*) FROM public.posts WHERE status = 'posted') AS total_posts;

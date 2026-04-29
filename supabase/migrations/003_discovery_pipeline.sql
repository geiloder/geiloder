-- =====================
-- DISCOVERY / NON-AFFILIATE CONTENT
-- =====================
ALTER TABLE public.deals
  ADD COLUMN IF NOT EXISTS content_type TEXT NOT NULL DEFAULT 'affiliate_deal'
    CHECK (content_type IN ('affiliate_deal', 'product_discovery')),
  ADD COLUMN IF NOT EXISTS source_name TEXT,
  ADD COLUMN IF NOT EXISTS source_url TEXT,
  ADD COLUMN IF NOT EXISTS barcode TEXT,
  ADD COLUMN IF NOT EXISTS image_license TEXT,
  ADD COLUMN IF NOT EXISTS image_rights_status TEXT,
  ADD COLUMN IF NOT EXISTS attribution_text TEXT,
  ADD COLUMN IF NOT EXISTS monetization_type TEXT NOT NULL DEFAULT 'affiliate'
    CHECK (monetization_type IN ('affiliate', 'none')),
  ADD COLUMN IF NOT EXISTS product_facts JSONB;

CREATE INDEX IF NOT EXISTS idx_deals_content_type ON public.deals(content_type);
CREATE INDEX IF NOT EXISTS idx_deals_source_name ON public.deals(source_name);
CREATE UNIQUE INDEX IF NOT EXISTS idx_deals_source_barcode
  ON public.deals(source_name, barcode)
  WHERE source_name IS NOT NULL AND barcode IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_posts_unique_deal_platform_type
  ON public.posts(deal_id, plattform, post_type);

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================
-- DEALS
-- =====================
CREATE TABLE public.deals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  external_id TEXT,
  quelle TEXT NOT NULL CHECK (quelle IN ('awin', 'adcell', 'amazon', 'manuell')),
  produktname TEXT NOT NULL,
  marke TEXT,
  shop TEXT NOT NULL,
  kategorie TEXT NOT NULL DEFAULT 'sonstige',
  alter_preis DECIMAL(10, 2),
  deal_preis DECIMAL(10, 2) NOT NULL,
  rabatt_prozent DECIMAL(5, 2),
  gutschein_code TEXT,
  verfuegbarkeit TEXT,
  produktbild_url TEXT,
  affiliate_link TEXT NOT NULL,
  landingpage_url TEXT,
  provision DECIMAL(5, 2),
  deal_score INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'new'
    CHECK (status IN ('new', 'approved', 'rejected', 'rendered', 'scheduled', 'posted', 'expired')),
  copy_data JSONB,
  slug TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  posted_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(external_id, quelle)
);

CREATE INDEX idx_deals_status ON public.deals(status);
CREATE INDEX idx_deals_kategorie ON public.deals(kategorie);
CREATE INDEX idx_deals_score ON public.deals(deal_score DESC);
CREATE INDEX idx_deals_created_at ON public.deals(created_at DESC);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER deals_updated_at
  BEFORE UPDATE ON public.deals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =====================
-- SHOPS
-- =====================
CREATE TABLE public.shops (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  domain TEXT,
  affiliate_programm TEXT,
  social_erlaubt BOOLEAN DEFAULT true,
  deeplink_erlaubt BOOLEAN DEFAULT true,
  bilder_erlaubt BOOLEAN DEFAULT true,
  provision_rate DECIMAL(5, 2),
  aktiv BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================
-- POSTS
-- =====================
CREATE TABLE public.posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  deal_id UUID NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
  plattform TEXT NOT NULL CHECK (plattform IN ('instagram', 'tiktok', 'pinterest', 'youtube')),
  post_type TEXT NOT NULL CHECK (post_type IN ('carousel', 'story', 'reel', 'pin')),
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'scheduled', 'posted', 'failed')),
  scheduled_for TIMESTAMPTZ,
  posted_at TIMESTAMPTZ,
  external_post_id TEXT,
  assets JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_posts_deal_id ON public.posts(deal_id);
CREATE INDEX idx_posts_status ON public.posts(status);

-- =====================
-- CLICKS
-- =====================
CREATE TABLE public.clicks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  deal_id UUID NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
  source TEXT,
  plattform TEXT,
  post_id UUID REFERENCES public.posts(id),
  ip_hash TEXT,
  user_agent TEXT,
  utm_campaign TEXT,
  utm_content TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_clicks_deal_id ON public.clicks(deal_id);
CREATE INDEX idx_clicks_created_at ON public.clicks(created_at DESC);

-- =====================
-- AFFILIATE PROGRAMMES
-- =====================
CREATE TABLE public.affiliate_programmes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  netzwerk TEXT NOT NULL CHECK (netzwerk IN ('awin', 'adcell', 'amazon', 'sonstige')),
  programm_name TEXT NOT NULL,
  shop TEXT,
  provision_rate DECIMAL(5, 2),
  social_erlaubt BOOLEAN DEFAULT true,
  deeplink_erlaubt BOOLEAN DEFAULT true,
  feed_url TEXT,
  feed_typ TEXT DEFAULT 'csv' CHECK (feed_typ IN ('csv', 'xml', 'api')),
  aktiv BOOLEAN DEFAULT true,
  zuletzt_importiert_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================
-- ROW LEVEL SECURITY
-- =====================
ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public can read approved deals" ON public.deals
  FOR SELECT USING (status IN ('approved', 'rendered', 'scheduled', 'posted'));

ALTER TABLE public.clicks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone can insert click" ON public.clicks
  FOR INSERT WITH CHECK (true);
CREATE POLICY "service_role can read clicks" ON public.clicks
  FOR SELECT USING (auth.role() = 'service_role');

-- Supabase Storage: Public bucket for rendered assets
INSERT INTO storage.buckets (id, name, public) VALUES ('assets', 'assets', true)
  ON CONFLICT DO NOTHING;

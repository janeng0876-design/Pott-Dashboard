-- ============================================================
-- POTT DASHBOARD — Supabase Schema
-- Paste this entire file in Supabase → SQL Editor → Run
-- ============================================================

-- 1. TABLES
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS uploads (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  filename     TEXT NOT NULL,
  row_count    INTEGER DEFAULT 0,
  uploaded_at  TIMESTAMPTZ DEFAULT now(),
  uploaded_by  UUID REFERENCES auth.users(id)
);

CREATE TABLE IF NOT EXISTS sales (
  id                        UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  upload_id                 UUID REFERENCES uploads(id) ON DELETE CASCADE,

  -- Transaction identifiers
  sales_no                  TEXT,
  date                      TIMESTAMPTZ,
  sales_type                TEXT,
  manual_receipt_no         TEXT,
  station_id                TEXT,

  -- Product details
  brand                     TEXT,
  item_code                 TEXT,
  type                      TEXT,
  model                     TEXT,
  description               TEXT,
  description_2             TEXT,
  description_3             TEXT,
  size                      TEXT,
  color                     TEXT,
  unit_of_measure           TEXT,
  is_bundle_item            BOOLEAN,
  supplier                  TEXT,
  branch                    TEXT,

  -- Pricing & financials
  cost_price                NUMERIC,
  unit_rrp                  NUMERIC,
  unit_price                NUMERIC,
  qty                       NUMERIC,
  sales_amt_before_discount NUMERIC,
  discount_amt              NUMERIC,
  discount_percent          NUMERIC,
  sales_amt_after_discount  NUMERIC,
  gst_amt                   NUMERIC,
  profit                    NUMERIC,
  min_selling_price         NUMERIC,
  min_selling_price_2       NUMERIC,
  final_collection_amt      NUMERIC,
  amt_received              NUMERIC,

  -- Compliance
  sold_below_min_price      TEXT,
  sold_below_min_price_2    TEXT,

  -- Customer
  customer                  TEXT,
  ic_no                     TEXT,
  qty_balance               NUMERIC,
  tax_code                  TEXT,
  note                      TEXT,
  remarks                   TEXT,

  -- Staff
  sales_person              TEXT,
  sales_person_2            TEXT,
  dispenser                 TEXT,

  created_at                TIMESTAMPTZ DEFAULT now()
);

-- 2. INDEXES
-- ─────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_sales_date      ON sales(date);
CREATE INDEX IF NOT EXISTS idx_sales_branch    ON sales(branch);
CREATE INDEX IF NOT EXISTS idx_sales_brand     ON sales(brand);
CREATE INDEX IF NOT EXISTS idx_sales_type      ON sales(type);
CREATE INDEX IF NOT EXISTS idx_sales_upload_id ON sales(upload_id);

-- 3. RLS POLICIES
-- ─────────────────────────────────────────────────────────────

ALTER TABLE uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales   ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth_select_uploads" ON uploads FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert_uploads" ON uploads FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_delete_uploads" ON uploads FOR DELETE TO authenticated USING (true);

CREATE POLICY "auth_select_sales"   ON sales FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert_sales"   ON sales FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_delete_sales"   ON sales FOR DELETE TO authenticated USING (true);

-- 4. RPC FUNCTIONS
-- ─────────────────────────────────────────────────────────────

-- KPI Summary
CREATE OR REPLACE FUNCTION get_kpi_summary(
  p_year         INT     DEFAULT NULL,
  p_month        INT     DEFAULT NULL,
  p_branch       TEXT    DEFAULT NULL,
  p_brand        TEXT    DEFAULT NULL,
  p_product_type TEXT    DEFAULT NULL
)
RETURNS TABLE (
  total_revenue      NUMERIC,
  total_qty          NUMERIC,
  total_profit       NUMERIC,
  total_transactions BIGINT,
  total_discount     NUMERIC
) LANGUAGE sql SECURITY DEFINER AS $$
  SELECT
    COALESCE(SUM(sales_amt_after_discount), 0),
    COALESCE(SUM(qty), 0),
    COALESCE(SUM(profit), 0),
    COUNT(DISTINCT sales_no),
    COALESCE(SUM(discount_amt), 0)
  FROM sales
  WHERE
    (p_year         IS NULL OR EXTRACT(YEAR  FROM date) = p_year)
    AND (p_month    IS NULL OR EXTRACT(MONTH FROM date) = p_month)
    AND (p_branch   IS NULL OR branch = p_branch)
    AND (p_brand    IS NULL OR brand  = p_brand)
    AND (p_product_type IS NULL OR type = p_product_type);
$$;

-- Best Sellers
CREATE OR REPLACE FUNCTION get_best_sellers(
  p_year         INT     DEFAULT NULL,
  p_month        INT     DEFAULT NULL,
  p_branch       TEXT    DEFAULT NULL,
  p_brand        TEXT    DEFAULT NULL,
  p_product_type TEXT    DEFAULT NULL,
  p_order_by     TEXT    DEFAULT 'revenue',
  p_limit        INT     DEFAULT 10
)
RETURNS TABLE (
  brand          TEXT,
  description    TEXT,
  item_code      TEXT,
  product_type   TEXT,
  total_qty      NUMERIC,
  total_revenue  NUMERIC,
  total_profit   NUMERIC
) LANGUAGE sql SECURITY DEFINER AS $$
  SELECT
    s.brand,
    s.description,
    s.item_code,
    s.type AS product_type,
    SUM(s.qty)                       AS total_qty,
    SUM(s.sales_amt_after_discount)  AS total_revenue,
    SUM(s.profit)                    AS total_profit
  FROM sales s
  WHERE
    (p_year         IS NULL OR EXTRACT(YEAR  FROM s.date) = p_year)
    AND (p_month    IS NULL OR EXTRACT(MONTH FROM s.date) = p_month)
    AND (p_branch   IS NULL OR s.branch = p_branch)
    AND (p_brand    IS NULL OR s.brand  = p_brand)
    AND (p_product_type IS NULL OR s.type = p_product_type)
    AND s.description IS NOT NULL
  GROUP BY s.brand, s.description, s.item_code, s.type
  ORDER BY
    CASE WHEN p_order_by = 'qty'     THEN SUM(s.qty) END DESC NULLS LAST,
    CASE WHEN p_order_by != 'qty'    THEN SUM(s.sales_amt_after_discount) END DESC NULLS LAST
  LIMIT p_limit;
$$;

-- Monthly Summary
CREATE OR REPLACE FUNCTION get_monthly_summary(
  p_year         INT     DEFAULT NULL,
  p_branch       TEXT    DEFAULT NULL,
  p_brand        TEXT    DEFAULT NULL,
  p_product_type TEXT    DEFAULT NULL
)
RETURNS TABLE (
  year              INT,
  month             INT,
  total_revenue     NUMERIC,
  total_qty         NUMERIC,
  total_profit      NUMERIC,
  transaction_count BIGINT
) LANGUAGE sql SECURITY DEFINER AS $$
  SELECT
    EXTRACT(YEAR  FROM date)::INT,
    EXTRACT(MONTH FROM date)::INT,
    COALESCE(SUM(sales_amt_after_discount), 0),
    COALESCE(SUM(qty), 0),
    COALESCE(SUM(profit), 0),
    COUNT(DISTINCT sales_no)
  FROM sales
  WHERE
    (p_year         IS NULL OR EXTRACT(YEAR FROM date) = p_year)
    AND (p_branch   IS NULL OR branch = p_branch)
    AND (p_brand    IS NULL OR brand  = p_brand)
    AND (p_product_type IS NULL OR type = p_product_type)
    AND date IS NOT NULL
  GROUP BY EXTRACT(YEAR FROM date), EXTRACT(MONTH FROM date)
  ORDER BY 1, 2;
$$;

-- Outlet Summary
CREATE OR REPLACE FUNCTION get_outlet_summary(
  p_year         INT     DEFAULT NULL,
  p_month        INT     DEFAULT NULL,
  p_brand        TEXT    DEFAULT NULL,
  p_product_type TEXT    DEFAULT NULL
)
RETURNS TABLE (
  branch            TEXT,
  total_revenue     NUMERIC,
  total_qty         NUMERIC,
  total_profit      NUMERIC,
  transaction_count BIGINT
) LANGUAGE sql SECURITY DEFINER AS $$
  SELECT
    branch,
    COALESCE(SUM(sales_amt_after_discount), 0),
    COALESCE(SUM(qty), 0),
    COALESCE(SUM(profit), 0),
    COUNT(DISTINCT sales_no)
  FROM sales
  WHERE
    (p_year         IS NULL OR EXTRACT(YEAR  FROM date) = p_year)
    AND (p_month    IS NULL OR EXTRACT(MONTH FROM date) = p_month)
    AND (p_brand    IS NULL OR brand  = p_brand)
    AND (p_product_type IS NULL OR type = p_product_type)
    AND branch IS NOT NULL
  GROUP BY branch
  ORDER BY SUM(sales_amt_after_discount) DESC NULLS LAST;
$$;

-- Brand Summary
CREATE OR REPLACE FUNCTION get_brand_summary(
  p_year         INT     DEFAULT NULL,
  p_month        INT     DEFAULT NULL,
  p_branch       TEXT    DEFAULT NULL,
  p_product_type TEXT    DEFAULT NULL
)
RETURNS TABLE (
  brand                TEXT,
  total_revenue        NUMERIC,
  total_qty            NUMERIC,
  total_profit         NUMERIC,
  avg_discount_percent NUMERIC,
  transaction_count    BIGINT
) LANGUAGE sql SECURITY DEFINER AS $$
  SELECT
    brand,
    COALESCE(SUM(sales_amt_after_discount), 0),
    COALESCE(SUM(qty), 0),
    COALESCE(SUM(profit), 0),
    ROUND(AVG(NULLIF(discount_percent, 0))::NUMERIC, 2),
    COUNT(DISTINCT sales_no)
  FROM sales
  WHERE
    (p_year         IS NULL OR EXTRACT(YEAR  FROM date) = p_year)
    AND (p_month    IS NULL OR EXTRACT(MONTH FROM date) = p_month)
    AND (p_branch   IS NULL OR branch = p_branch)
    AND (p_product_type IS NULL OR type = p_product_type)
    AND brand IS NOT NULL AND brand != ''
  GROUP BY brand
  ORDER BY SUM(sales_amt_after_discount) DESC NULLS LAST;
$$;

-- Filter Options (distinct values for dropdowns)
CREATE OR REPLACE FUNCTION get_filter_options()
RETURNS TABLE (
  branches      TEXT[],
  brands        TEXT[],
  product_types TEXT[],
  years         INT[]
) LANGUAGE sql SECURITY DEFINER AS $$
  SELECT
    ARRAY(SELECT DISTINCT branch FROM sales WHERE branch IS NOT NULL AND branch != '' ORDER BY branch),
    ARRAY(SELECT DISTINCT brand  FROM sales WHERE brand  IS NOT NULL AND brand  != '' ORDER BY brand),
    ARRAY(SELECT DISTINCT type   FROM sales WHERE type   IS NOT NULL AND type   != '' ORDER BY type),
    ARRAY(SELECT DISTINCT EXTRACT(YEAR FROM date)::INT FROM sales WHERE date IS NOT NULL ORDER BY 1);
$$;

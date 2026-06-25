export interface Sale {
  id: string
  upload_id: string | null
  sales_no: string | null
  date: string | null
  sales_type: string | null
  station_id: string | null
  brand: string | null
  item_code: string | null
  type: string | null
  model: string | null
  description: string | null
  description_2: string | null
  description_3: string | null
  size: string | null
  color: string | null
  unit_of_measure: string | null
  is_bundle_item: boolean | null
  supplier: string | null
  branch: string | null
  cost_price: number | null
  unit_rrp: number | null
  unit_price: number | null
  qty: number | null
  sales_amt_before_discount: number | null
  discount_amt: number | null
  discount_percent: number | null
  sales_amt_after_discount: number | null
  gst_amt: number | null
  profit: number | null
  min_selling_price: number | null
  min_selling_price_2: number | null
  final_collection_amt: number | null
  amt_received: number | null
  sold_below_min_price: string | null
  sold_below_min_price_2: string | null
  customer: string | null
  ic_no: string | null
  qty_balance: number | null
  tax_code: string | null
  note: string | null
  remarks: string | null
  sales_person: string | null
  sales_person_2: string | null
  dispenser: string | null
  created_at: string
}

export interface Upload {
  id: string
  filename: string
  row_count: number
  uploaded_at: string
  uploaded_by: string | null
}

export interface BestSeller {
  brand: string
  description: string
  item_code: string
  product_type: string
  total_qty: number
  total_revenue: number
  total_profit: number
}

export interface KpiSummary {
  total_revenue: number
  total_qty: number
  total_profit: number
  total_transactions: number
  total_discount: number
}

export interface MonthlySummary {
  year: number
  month: number
  total_revenue: number
  total_qty: number
  total_profit: number
  transaction_count: number
}

export interface OutletSummary {
  branch: string
  total_revenue: number
  total_qty: number
  total_profit: number
  transaction_count: number
}

export interface BrandSummary {
  brand: string
  total_revenue: number
  total_qty: number
  total_profit: number
  avg_discount_percent: number
  transaction_count: number
}

export interface FilterOptions {
  branches: string[]
  brands: string[]
  product_types: string[]
  years: number[]
}

export interface Filters {
  year: string
  month: string
  branch: string
  brand: string
  type: string
}

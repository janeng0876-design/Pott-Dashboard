'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { BestSeller, BrandSummary, FilterOptions, Filters } from '@/types'
import FilterBar from '@/components/filter-bar'
import BestSellersTable from '@/components/best-sellers-table'
import BarChartWidget from '@/components/bar-chart'

const DEFAULT_FILTERS: Filters = { year: '2025', month: '', branch: '', brand: '', type: '' }
const DEFAULT_OPTIONS: FilterOptions = { branches: [], brands: [], product_types: [], years: [] }

function fmt(n: number) {
  return new Intl.NumberFormat('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n)
}

export default function BrandPage() {
  const supabase = createClient()

  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS)
  const [options, setOptions] = useState<FilterOptions>(DEFAULT_OPTIONS)
  const [brands, setBrands] = useState<BrandSummary[]>([])
  const [sellers, setSellers] = useState<BestSeller[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchOptions() }, [])
  useEffect(() => { fetchData() }, [filters])

  async function fetchOptions() {
    const { data } = await supabase.rpc('get_filter_options')
    if (data?.[0]) setOptions(data[0] as FilterOptions)
  }

  async function fetchData() {
    setLoading(true)
    const params = {
      p_year:         filters.year   ? Number(filters.year)   : null,
      p_month:        filters.month  ? Number(filters.month)  : null,
      p_branch:       filters.branch || null,
      p_product_type: filters.type   || null,
    }
    const sellersParams = {
      ...params,
      p_brand:    filters.brand || null,
      p_limit:    20,
      p_order_by: 'revenue',
    }

    const [brandsRes, sellersRes] = await Promise.all([
      supabase.rpc('get_brand_summary', params),
      supabase.rpc('get_best_sellers', sellersParams),
    ])

    setBrands((brandsRes.data as BrandSummary[]) ?? [])
    setSellers((sellersRes.data as BestSeller[]) ?? [])
    setLoading(false)
  }

  const chartData = brands
    .slice(0, 10)
    .map((b) => ({ name: b.brand, value: b.total_revenue, value2: b.total_qty }))

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Brand Performance</h1>
          <p className="text-sm text-gray-500">Revenue and best sellers per brand</p>
        </div>
        <FilterBar filters={filters} options={options} onChange={setFilters} hide={['brand']} />
      </div>

      {/* Brand chart */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <h3 className="font-semibold text-gray-900 text-sm mb-4">Top 10 Brands — Revenue</h3>
        {loading ? (
          <div className="flex items-center justify-center h-[300px]">
            <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <BarChartWidget data={chartData} label="Revenue (RM)" label2="Qty Sold" color="#6366f1" color2="#14b8a6" valuePrefix="" />
        )}
      </div>

      {/* Brand table */}
      {!loading && brands.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900 text-sm">Brand Breakdown</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left">
                  <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide w-8">#</th>
                  <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Brand</th>
                  <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide text-right">Revenue (RM)</th>
                  <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide text-right">Qty Sold</th>
                  <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide text-right">Profit (RM)</th>
                  <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide text-right">Avg Discount %</th>
                  <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide text-right">Transactions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {brands.map((b, i) => (
                  <tr
                    key={i}
                    className={`hover:bg-gray-50 cursor-pointer transition-colors ${filters.brand === b.brand ? 'bg-indigo-50' : ''}`}
                    onClick={() => setFilters((f) => ({ ...f, brand: f.brand === b.brand ? '' : b.brand }))}
                  >
                    <td className="px-4 py-3 text-gray-400 font-medium">{i + 1}</td>
                    <td className="px-4 py-3 font-semibold text-gray-900">{b.brand}</td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-900">{fmt(b.total_revenue)}</td>
                    <td className="px-4 py-3 text-right text-gray-700">{b.total_qty.toLocaleString()}</td>
                    <td className={`px-4 py-3 text-right font-medium ${b.total_profit >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                      {fmt(b.total_profit)}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-600">
                      {b.avg_discount_percent != null ? `${Number(b.avg_discount_percent).toFixed(1)}%` : '—'}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-600">{b.transaction_count.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-gray-400 px-5 py-2">Click a row to filter best sellers by that brand</p>
        </div>
      )}

      {/* Best sellers */}
      <BestSellersTable
        data={sellers}
        loading={loading}
        title={filters.brand ? `Best Sellers — ${filters.brand}` : 'Best Sellers (All Brands)'}
      />
    </div>
  )
}

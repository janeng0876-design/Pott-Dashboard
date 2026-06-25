'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { BestSeller, FilterOptions, Filters, KpiSummary } from '@/types'
import KpiCards from '@/components/kpi-cards'
import BestSellersTable from '@/components/best-sellers-table'
import FilterBar from '@/components/filter-bar'
import BarChartWidget from '@/components/bar-chart'

const DEFAULT_FILTERS: Filters = { year: '', month: '', branch: '', brand: '', type: '' }
const DEFAULT_KPI: KpiSummary = { total_revenue: 0, total_qty: 0, total_profit: 0, total_transactions: 0, total_discount: 0 }
const DEFAULT_OPTIONS: FilterOptions = { branches: [], brands: [], product_types: [], years: [] }

export default function DashboardPage() {
  const supabase = createClient()

  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS)
  const [options, setOptions] = useState<FilterOptions>(DEFAULT_OPTIONS)
  const [kpi, setKpi] = useState<KpiSummary>(DEFAULT_KPI)
  const [sellers, setSellers] = useState<BestSeller[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchOptions()
  }, [])

  useEffect(() => {
    fetchData()
  }, [filters])

  async function fetchOptions() {
    const { data, error } = await supabase.rpc('get_filter_options')
    if (error) console.error('get_filter_options error:', error.message)
    if (data?.[0]) setOptions(data[0] as FilterOptions)
  }

  async function fetchData() {
    setLoading(true)
    const params = {
      p_year:         filters.year   ? Number(filters.year)   : null,
      p_month:        filters.month  ? Number(filters.month)  : null,
      p_branch:       filters.branch || null,
      p_brand:        filters.brand  || null,
      p_product_type: filters.type   || null,
    }

    const [kpiRes, sellersRes] = await Promise.all([
      supabase.rpc('get_kpi_summary', params),
      supabase.rpc('get_best_sellers', { ...params, p_limit: 20, p_order_by: 'revenue' }),
    ])

    if (kpiRes.error) console.error('get_kpi_summary error:', kpiRes.error.message)
    if (sellersRes.error) console.error('get_best_sellers error:', sellersRes.error.message)
    if (kpiRes.data?.[0]) setKpi(kpiRes.data[0] as KpiSummary)
    setSellers((sellersRes.data as BestSeller[]) ?? [])
    setLoading(false)
  }

  // Top 7 brands for chart
  const brandChart = sellers
    .reduce<{ name: string; value: number }[]>((acc, row) => {
      const existing = acc.find((a) => a.name === row.brand)
      if (existing) existing.value += row.total_revenue
      else if (row.brand) acc.push({ name: row.brand, value: row.total_revenue })
      return acc
    }, [])
    .sort((a, b) => b.value - a.value)
    .slice(0, 7)

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Sales Dashboard</h1>
          <p className="text-sm text-gray-500">Overview of all outlets and brands</p>
        </div>
        <FilterBar filters={filters} options={options} onChange={setFilters} />
      </div>

      {/* KPI Cards */}
      <KpiCards data={loading ? DEFAULT_KPI : kpi} />

      {/* Charts */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <h3 className="font-semibold text-gray-900 text-sm mb-4">Revenue by Brand</h3>
        {loading ? (
          <div className="flex items-center justify-center h-[300px]">
            <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <BarChartWidget data={brandChart} label="Revenue (RM)" valuePrefix="RM " />
        )}
      </div>

      {/* Best sellers table */}
      <BestSellersTable data={sellers} loading={loading} title="Top 20 Best Sellers" />
    </div>
  )
}

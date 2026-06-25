'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { BestSeller, FilterOptions, Filters, OutletSummary } from '@/types'
import FilterBar from '@/components/filter-bar'
import BestSellersTable from '@/components/best-sellers-table'
import BarChartWidget from '@/components/bar-chart'

const DEFAULT_FILTERS: Filters = { year: '2025', month: '', branch: '', brand: '', type: '' }
const DEFAULT_OPTIONS: FilterOptions = { branches: [], brands: [], product_types: [], years: [] }

function fmt(n: number) {
  return new Intl.NumberFormat('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n)
}

export default function OutletPage() {
  const supabase = createClient()

  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS)
  const [options, setOptions] = useState<FilterOptions>(DEFAULT_OPTIONS)
  const [outlets, setOutlets] = useState<OutletSummary[]>([])
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
      p_brand:        filters.brand  || null,
      p_product_type: filters.type   || null,
    }
    const sellersParams = {
      ...params,
      p_branch:  filters.branch || null,
      p_limit:   20,
      p_order_by: 'revenue',
    }

    const [outletRes, sellersRes] = await Promise.all([
      supabase.rpc('get_outlet_summary', params),
      supabase.rpc('get_best_sellers', sellersParams),
    ])

    setOutlets((outletRes.data as OutletSummary[]) ?? [])
    setSellers((sellersRes.data as BestSeller[]) ?? [])
    setLoading(false)
  }

  const chartData = outlets.map((o) => ({ name: o.branch, value: o.total_revenue, value2: o.total_profit }))

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Outlet Performance</h1>
          <p className="text-sm text-gray-500">Revenue and best sellers per branch</p>
        </div>
        <FilterBar filters={filters} options={options} onChange={setFilters} hide={['branch']} />
      </div>

      {/* Outlet chart */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <h3 className="font-semibold text-gray-900 text-sm mb-4">Revenue vs Profit by Outlet</h3>
        {loading ? (
          <div className="flex items-center justify-center h-[300px]">
            <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <BarChartWidget data={chartData} label="Revenue" label2="Profit" valuePrefix="RM " />
        )}
      </div>

      {/* Outlet table */}
      {!loading && outlets.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900 text-sm">Outlet Breakdown</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left">
                  <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide w-8">#</th>
                  <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Branch</th>
                  <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide text-right">Revenue (RM)</th>
                  <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide text-right">Qty Sold</th>
                  <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide text-right">Profit (RM)</th>
                  <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide text-right">Transactions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {outlets.map((o, i) => (
                  <tr
                    key={i}
                    className={`hover:bg-gray-50 cursor-pointer transition-colors ${filters.branch === o.branch ? 'bg-indigo-50' : ''}`}
                    onClick={() => setFilters((f) => ({ ...f, branch: f.branch === o.branch ? '' : o.branch }))}
                  >
                    <td className="px-4 py-3 text-gray-400 font-medium">{i + 1}</td>
                    <td className="px-4 py-3 font-semibold text-gray-900">{o.branch}</td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-900">{fmt(o.total_revenue)}</td>
                    <td className="px-4 py-3 text-right text-gray-700">{o.total_qty.toLocaleString()}</td>
                    <td className={`px-4 py-3 text-right font-medium ${o.total_profit >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                      {fmt(o.total_profit)}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-600">{o.transaction_count.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-gray-400 px-5 py-2">Click a row to filter best sellers by that branch</p>
        </div>
      )}

      {/* Best sellers */}
      <BestSellersTable
        data={sellers}
        loading={loading}
        title={filters.branch ? `Best Sellers — ${filters.branch}` : 'Best Sellers (All Outlets)'}
      />
    </div>
  )
}

'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { BestSeller, FilterOptions, Filters, MonthlySummary } from '@/types'
import FilterBar from '@/components/filter-bar'
import BestSellersTable from '@/components/best-sellers-table'
import LineChartWidget from '@/components/line-chart'

const MONTH_NAMES = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const DEFAULT_FILTERS: Filters = { year: '2025', month: '', branch: '', brand: '', type: '' }
const DEFAULT_OPTIONS: FilterOptions = { branches: [], brands: [], product_types: [], years: [] }

function fmt(n: number) {
  return new Intl.NumberFormat('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n)
}

export default function MonthlyPage() {
  const supabase = createClient()

  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS)
  const [options, setOptions] = useState<FilterOptions>(DEFAULT_OPTIONS)
  const [monthly, setMonthly] = useState<MonthlySummary[]>([])
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
    const baseParams = {
      p_year:         filters.year   ? Number(filters.year)   : null,
      p_branch:       filters.branch || null,
      p_brand:        filters.brand  || null,
      p_product_type: filters.type   || null,
    }

    const [monthlyRes, sellersRes] = await Promise.all([
      supabase.rpc('get_monthly_summary', baseParams),
      supabase.rpc('get_best_sellers', {
        ...baseParams,
        p_month: filters.month ? Number(filters.month) : null,
        p_limit: 20,
        p_order_by: 'revenue',
      }),
    ])

    setMonthly((monthlyRes.data as MonthlySummary[]) ?? [])
    setSellers((sellersRes.data as BestSeller[]) ?? [])
    setLoading(false)
  }

  const chartData = monthly.map((m) => ({
    name: `${MONTH_NAMES[m.month]} ${m.year}`,
    revenue: m.total_revenue,
    qty: m.total_qty,
  }))

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Monthly Sales</h1>
          <p className="text-sm text-gray-500">Revenue and best sellers by month</p>
        </div>
        <FilterBar filters={filters} options={options} onChange={setFilters} hide={['month']} />
      </div>

      {/* Monthly trend chart */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <h3 className="font-semibold text-gray-900 text-sm mb-4">Monthly Revenue Trend</h3>
        {loading ? (
          <div className="flex items-center justify-center h-[300px]">
            <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <LineChartWidget data={chartData} />
        )}
      </div>

      {/* Monthly summary table */}
      {!loading && monthly.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900 text-sm">Monthly Breakdown</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left">
                  <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Month</th>
                  <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide text-right">Revenue (RM)</th>
                  <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide text-right">Qty Sold</th>
                  <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide text-right">Profit (RM)</th>
                  <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide text-right">Transactions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {monthly.map((m, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {MONTH_NAMES[m.month]} {m.year}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-900">{fmt(m.total_revenue)}</td>
                    <td className="px-4 py-3 text-right text-gray-700">{m.total_qty.toLocaleString()}</td>
                    <td className={`px-4 py-3 text-right font-medium ${m.total_profit >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                      {fmt(m.total_profit)}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-600">{m.transaction_count.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Best sellers (filtered by selected month if any) */}
      <BestSellersTable
        data={sellers}
        loading={loading}
        title={filters.month ? `Best Sellers — ${MONTH_NAMES[Number(filters.month)]}` : 'Best Sellers (All Months)'}
      />
    </div>
  )
}

'use client'

import { BestSeller } from '@/types'
import { useState } from 'react'

function fmt(n: number) {
  return new Intl.NumberFormat('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n)
}

interface Props {
  data: BestSeller[]
  loading?: boolean
  title?: string
}

export default function BestSellersTable({ data, loading, title = 'Best Sellers' }: Props) {
  const [sortBy, setSortBy] = useState<'revenue' | 'qty'>('revenue')

  const sorted = [...data].sort((a, b) =>
    sortBy === 'revenue' ? b.total_revenue - a.total_revenue : b.total_qty - a.total_qty
  )

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <h3 className="font-semibold text-gray-900 text-sm">{title}</h3>
        <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5">
          <button
            onClick={() => setSortBy('revenue')}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
              sortBy === 'revenue' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            By Revenue
          </button>
          <button
            onClick={() => setSortBy('qty')}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
              sortBy === 'qty' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            By Qty
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : sorted.length === 0 ? (
        <div className="flex items-center justify-center h-40 text-gray-400 text-sm">No data found</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left">
                <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide w-8">#</th>
                <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Product</th>
                <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Brand</th>
                <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Type</th>
                <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide text-right">Qty</th>
                <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide text-right">Revenue (RM)</th>
                <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide text-right">Profit (RM)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {sorted.map((row, i) => (
                <tr key={i} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-gray-400 font-medium">{i + 1}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900 truncate max-w-xs">{row.description || '—'}</p>
                    <p className="text-xs text-gray-400">{row.item_code || ''}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{row.brand || '—'}</td>
                  <td className="px-4 py-3">
                    <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700">
                      {row.product_type || '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-gray-900">
                    {new Intl.NumberFormat('en-MY').format(row.total_qty)}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-gray-900">{fmt(row.total_revenue)}</td>
                  <td className={`px-4 py-3 text-right font-medium ${row.total_profit >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                    {fmt(row.total_profit)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

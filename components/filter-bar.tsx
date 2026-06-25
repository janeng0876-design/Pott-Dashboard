'use client'

import { FilterOptions, Filters } from '@/types'

const MONTHS = [
  { value: '', label: 'All Months' },
  { value: '1', label: 'January' }, { value: '2', label: 'February' },
  { value: '3', label: 'March' },   { value: '4', label: 'April' },
  { value: '5', label: 'May' },     { value: '6', label: 'June' },
  { value: '7', label: 'July' },    { value: '8', label: 'August' },
  { value: '9', label: 'September' },{ value: '10', label: 'October' },
  { value: '11', label: 'November' },{ value: '12', label: 'December' },
]

interface Props {
  filters: Filters
  options: FilterOptions
  onChange: (f: Filters) => void
  hide?: ('month' | 'branch' | 'brand' | 'type')[]
}

export default function FilterBar({ filters, options, onChange, hide = [] }: Props) {
  function set(key: keyof Filters, value: string) {
    onChange({ ...filters, [key]: value })
  }

  const selectClass =
    'h-9 pl-3 pr-8 rounded-lg border border-gray-200 bg-white text-sm text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent'

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Year */}
      <select value={filters.year} onChange={(e) => set('year', e.target.value)} className={selectClass}>
        <option value="">All Years</option>
        {options.years.map((y) => (
          <option key={y} value={String(y)}>{y}</option>
        ))}
      </select>

      {/* Month */}
      {!hide.includes('month') && (
        <select value={filters.month} onChange={(e) => set('month', e.target.value)} className={selectClass}>
          {MONTHS.map((m) => (
            <option key={m.value} value={m.value}>{m.label}</option>
          ))}
        </select>
      )}

      {/* Branch */}
      {!hide.includes('branch') && (
        <select value={filters.branch} onChange={(e) => set('branch', e.target.value)} className={selectClass}>
          <option value="">All Outlets</option>
          {options.branches.map((b) => (
            <option key={b} value={b}>{b}</option>
          ))}
        </select>
      )}

      {/* Brand */}
      {!hide.includes('brand') && (
        <select value={filters.brand} onChange={(e) => set('brand', e.target.value)} className={selectClass}>
          <option value="">All Brands</option>
          {options.brands.map((b) => (
            <option key={b} value={b}>{b}</option>
          ))}
        </select>
      )}

      {/* Type */}
      {!hide.includes('type') && (
        <select value={filters.type} onChange={(e) => set('type', e.target.value)} className={selectClass}>
          <option value="">All Types</option>
          {options.product_types.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      )}
    </div>
  )
}

'use client'

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'

interface DataPoint {
  name: string
  value: number
  value2?: number
}

interface Props {
  data: DataPoint[]
  label?: string
  label2?: string
  color?: string
  color2?: string
  valuePrefix?: string
}

function formatK(value: number) {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`
  return String(Math.round(value))
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload, label, prefix }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-sm">
      <p className="font-semibold text-gray-900 mb-1">{label}</p>
      {payload.map((p: { color: string; name: string; value: number }, i: number) => (
        <p key={i} style={{ color: p.color }}>
          {p.name}: {prefix ?? ''}{new Intl.NumberFormat('en-MY', { minimumFractionDigits: 2 }).format(p.value)}
        </p>
      ))}
    </div>
  )
}

export default function BarChartWidget({
  data,
  label = 'Revenue',
  label2,
  color = '#6366f1',
  color2 = '#14b8a6',
  valuePrefix = 'RM ',
}: Props) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 4, right: 16, left: 8, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
        <YAxis tickFormatter={formatK} tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={52} />
        <Tooltip content={<CustomTooltip prefix={valuePrefix} />} />
        <Bar dataKey="value" name={label} fill={color} radius={[4, 4, 0, 0]} />
        {label2 && <Bar dataKey="value2" name={label2} fill={color2} radius={[4, 4, 0, 0]} />}
      </BarChart>
    </ResponsiveContainer>
  )
}

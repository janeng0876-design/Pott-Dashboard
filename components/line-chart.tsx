'use client'

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'

interface DataPoint {
  name: string
  revenue: number
  qty?: number
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-sm">
      <p className="font-semibold text-gray-900 mb-1">{label}</p>
      {payload.map((p: { color: string; name: string; value: number }, i: number) => (
        <p key={i} style={{ color: p.color }}>
          {p.name}: {p.name === 'Revenue' ? 'RM ' : ''}
          {new Intl.NumberFormat('en-MY', { minimumFractionDigits: p.name === 'Revenue' ? 2 : 0 }).format(p.value)}
        </p>
      ))}
    </div>
  )
}

function formatK(value: number) {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`
  return String(Math.round(value))
}

export default function LineChartWidget({ data }: { data: DataPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data} margin={{ top: 4, right: 16, left: 8, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
        <YAxis tickFormatter={formatK} tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={52} />
        <Tooltip content={<CustomTooltip />} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Line
          type="monotone"
          dataKey="revenue"
          name="Revenue"
          stroke="#6366f1"
          strokeWidth={2}
          dot={{ r: 4, fill: '#6366f1' }}
          activeDot={{ r: 6 }}
        />
        {data.some((d) => d.qty !== undefined) && (
          <Line
            type="monotone"
            dataKey="qty"
            name="Qty"
            stroke="#14b8a6"
            strokeWidth={2}
            dot={{ r: 4, fill: '#14b8a6' }}
            activeDot={{ r: 6 }}
          />
        )}
      </LineChart>
    </ResponsiveContainer>
  )
}

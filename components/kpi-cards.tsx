import { KpiSummary } from '@/types'
import { TrendingUp, Package, DollarSign, Receipt, Percent } from 'lucide-react'

function fmt(n: number) {
  return new Intl.NumberFormat('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n)
}
function fmtInt(n: number) {
  return new Intl.NumberFormat('en-MY').format(Math.round(n))
}

interface CardProps {
  label: string
  value: string
  sub?: string
  icon: React.ElementType
  color: string
}

function Card({ label, value, sub, icon: Icon, color }: CardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
        </div>
        <div className={`p-2.5 rounded-xl ${color}`}>
          <Icon size={18} className="text-white" />
        </div>
      </div>
    </div>
  )
}

export default function KpiCards({ data }: { data: KpiSummary }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
      <Card label="Revenue" value={`RM ${fmt(data.total_revenue)}`} icon={TrendingUp} color="bg-indigo-500" />
      <Card label="Qty Sold" value={fmtInt(data.total_qty)} sub="units" icon={Package} color="bg-teal-500" />
      <Card label="Profit" value={`RM ${fmt(data.total_profit)}`} icon={DollarSign} color="bg-emerald-500" />
      <Card label="Transactions" value={fmtInt(data.total_transactions)} icon={Receipt} color="bg-violet-500" />
      <Card label="Discount Given" value={`RM ${fmt(data.total_discount)}`} icon={Percent} color="bg-rose-500" />
    </div>
  )
}

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import { format, parseISO } from 'date-fns'

interface MonthlyBarChartProps {
  data: { month: string; income: number; expense: number }[]
}

export default function MonthlyBarChart({ data }: MonthlyBarChartProps) {
  const formatted = data.map(d => ({
    ...d,
    label: format(parseISO(d.month + '-01'), 'MMM yy'),
  }))

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={formatted} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="label" tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 12 }} tickFormatter={v => `৳${v.toLocaleString()}`} width={70} />
        <Tooltip formatter={(v: number) => `৳${v.toLocaleString()}`} />
        <Legend />
        <Bar dataKey="income" name="Income" fill="#22c55e" radius={[3, 3, 0, 0]} />
        <Bar dataKey="expense" name="Expense" fill="#ef4444" radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

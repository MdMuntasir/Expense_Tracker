import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts'

interface CategoryBarChartProps {
  data: { category: string; color: string; amount: number }[]
}

export default function CategoryBarChart({ data }: CategoryBarChartProps) {
  if (!data.length) {
    return (
      <div className="flex items-center justify-center h-40 text-gray-400 text-sm">
        No expenses this month
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
        <XAxis type="number" tick={{ fontSize: 12 }} tickFormatter={v => `৳${v.toLocaleString()}`} width={70} />
        <YAxis dataKey="category" type="category" tick={{ fontSize: 12 }} width={100} />
        <Tooltip formatter={(v: number) => `৳${v.toLocaleString()}`} />
        <Bar dataKey="amount" name="Amount" radius={[0, 3, 3, 0]}>
          {data.map((entry, i) => (
            <Cell key={i} fill={entry.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

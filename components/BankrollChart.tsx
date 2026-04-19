'use client'

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'
import { BankrollDataPoint } from '@/types'

function getGradientOffset(data: BankrollDataPoint[]) {
  const values = data.map((d) => d.bankroll)
  const max = Math.max(...values)
  const min = Math.min(...values)
  if (max <= 1000) return 1
  if (min >= 1000) return 0
  return (max - 1000) / (max - min)
}

const CustomTooltip = ({ active, payload, label }: {
  active?: boolean
  payload?: Array<{ value: number }>
  label?: string
}) => {
  if (!active || !payload?.length) return null
  const val = payload[0].value
  return (
    <div className="bg-[#0d0d1a] border border-[#1a1a2e] rounded px-3 py-2 text-xs">
      <p className="text-[#4b5563] mb-1">{label}</p>
      <p className={`font-bold tabular-nums ${val >= 1000 ? 'text-green-400' : 'text-red-400'}`}>
        ${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </p>
    </div>
  )
}

export default function BankrollChart({ data }: { data: BankrollDataPoint[] }) {
  const offset = getGradientOffset(data)
  const values = data.map((d) => d.bankroll)
  const minVal = Math.min(...values)
  const maxVal = Math.max(...values)
  const padding = (maxVal - minVal) * 0.15
  const domainMin = Math.floor(minVal - padding)
  const domainMax = Math.ceil(maxVal + padding)

  return (
    <div className="bg-[#0d0d1a] border border-[#1a1a2e] rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-[10px] font-bold tracking-[0.3em] uppercase text-[#4b5563]">
          Bankroll History — 14 Day Challenge
        </h2>
        <div className="flex items-center gap-3 text-[10px] text-[#4b5563]">
          <span className="flex items-center gap-1">
            <span className="inline-block w-2 h-2 rounded-full bg-green-500" />
            Above $1000
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-2 h-2 rounded-full bg-red-500" />
            Below $1000
          </span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="bankrollLine" x1="0" y1="0" x2="0" y2="1">
              <stop offset={offset} stopColor="#22c55e" />
              <stop offset={offset} stopColor="#ef4444" />
            </linearGradient>
            <linearGradient id="bankrollFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset={offset} stopColor="#22c55e" stopOpacity={0.15} />
              <stop offset={offset} stopColor="#ef4444" stopOpacity={0.15} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1a1a2e" vertical={false} />
          <XAxis
            dataKey="date"
            stroke="#1a1a2e"
            tick={{ fill: '#4b5563', fontSize: 10, fontFamily: 'monospace' }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke="#1a1a2e"
            tick={{ fill: '#4b5563', fontSize: 10, fontFamily: 'monospace' }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => `$${v}`}
            domain={[domainMin, domainMax]}
            width={60}
          />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine
            y={1000}
            stroke="#334155"
            strokeDasharray="4 4"
            label={{ value: '$1000', fill: '#475569', fontSize: 10, fontFamily: 'monospace', position: 'insideTopLeft' }}
          />
          <Area
            type="monotone"
            dataKey="bankroll"
            stroke="url(#bankrollLine)"
            strokeWidth={2}
            fill="url(#bankrollFill)"
            dot={false}
            activeDot={{ r: 4, stroke: '#1a1a2e', strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

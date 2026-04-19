'use client'

import { DashboardData } from '@/types'

function StatCard({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
      <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">{label}</p>
      <p className={`text-2xl font-bold ${color || 'text-white'}`}>{value}</p>
      {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
    </div>
  )
}

export default function StatsRow({ data }: { data: DashboardData }) {
  const totalBets = data.wins + data.losses
  const bestStrategy = data.strategies.length > 0
    ? [...data.strategies].sort((a, b) => b.roi - a.roi)[0]
    : null
  const bestSport = data.bets.length > 0
    ? (() => {
        const bySpot = data.bets.reduce((acc, b) => {
          if (!acc[b.sport]) acc[b.sport] = { profit: 0, bets: 0 }
          acc[b.sport].profit += b.pnl
          acc[b.sport].bets++
          return acc
        }, {} as Record<string, { profit: number; bets: number }>)
        return Object.entries(bySpot).sort((a, b) => b[1].profit - a[1].profit)[0]?.[0] || '—'
      })()
    : '—'

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      <StatCard
        label="Total Bets"
        value={totalBets.toString()}
        sub={`${data.wins}W / ${data.losses}L`}
      />
      <StatCard
        label="Win Rate"
        value={`${data.winRate.toFixed(1)}%`}
        color={data.winRate >= 60 ? 'text-green-400' : data.winRate >= 50 ? 'text-yellow-400' : 'text-red-400'}
      />
      <StatCard
        label="Net Profit"
        value={`${data.netProfit >= 0 ? '+' : ''}$${data.netProfit.toFixed(2)}`}
        color={data.netProfit >= 0 ? 'text-green-400' : 'text-red-400'}
      />
      <StatCard
        label="ROI"
        value={`${data.roi >= 0 ? '+' : ''}${data.roi.toFixed(1)}%`}
        color={data.roi >= 0 ? 'text-green-400' : 'text-red-400'}
      />
      <StatCard
        label="Best Strategy"
        value={bestStrategy ? bestStrategy.strategy : '—'}
        sub={bestStrategy ? `${bestStrategy.roi.toFixed(1)}% ROI` : undefined}
        color="text-yellow-400"
      />
      <StatCard
        label="Best Sport"
        value={bestSport}
        color="text-blue-400"
      />
    </div>
  )
}

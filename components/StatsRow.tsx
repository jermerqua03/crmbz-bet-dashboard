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
  const openPlays = data.propRecommendations?.length ?? 0

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      <StatCard
        label="Bankroll"
        value={`$${data.currentBankroll.toFixed(0)}`}
        sub={`Start $${data.startingBankroll.toFixed(0)}`}
        color={data.currentBankroll >= data.startingBankroll ? 'text-green-400' : 'text-red-400'}
      />
      <StatCard
        label="Record"
        value={`${data.wins}-${data.losses}`}
        sub={totalBets > 0 ? `${data.winRate.toFixed(1)}% win` : 'no graded bets'}
        color={data.winRate >= 55 ? 'text-green-400' : data.winRate >= 50 ? 'text-yellow-400' : totalBets ? 'text-red-400' : 'text-gray-400'}
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
        value={bestStrategy && bestStrategy.bets > 0 ? bestStrategy.strategy : '—'}
        sub={bestStrategy && bestStrategy.bets > 0 ? `${bestStrategy.roi.toFixed(1)}% ROI` : undefined}
        color="text-yellow-400"
      />
      <StatCard
        label="Open Plays"
        value={openPlays.toString()}
        sub={data.currentWeek ? `Week ${data.currentWeek}` : undefined}
        color="text-blue-400"
      />
    </div>
  )
}

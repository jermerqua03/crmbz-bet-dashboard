import { DashboardData } from '@/types'

function fmt(n: number) {
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export default function Header({ data }: { data: DashboardData }) {
  const { currentBankroll, startingBankroll, roi, daysRemaining } = data
  const isUp = currentBankroll >= startingBankroll
  const netChange = currentBankroll - startingBankroll

  return (
    <header className="border-b border-[#1a1a2e] bg-[#0d0d1a] px-4 py-3">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        {/* Title */}
        <div className="flex items-center gap-3">
          <span className="text-[#3b82f6] text-xs font-bold tracking-[0.3em] uppercase">
            [SIM]
          </span>
          <h1 className="text-white font-bold tracking-widest text-sm uppercase">
            BET DASHBOARD
          </h1>
          <span className="hidden sm:inline text-[#1a1a2e]">|</span>
          <span className="hidden sm:inline text-[#4b5563] text-xs tracking-widest">
            SPORTS BETTING TRACKER
          </span>
        </div>

        {/* Stats */}
        <div className="flex flex-wrap items-center gap-4 sm:gap-6">
          {/* Bankroll */}
          <div className="flex items-baseline gap-2">
            <span className="text-[#4b5563] text-[10px] uppercase tracking-widest">Bankroll</span>
            <span className={`text-xl font-bold tabular-nums ${isUp ? 'text-green-400' : 'text-red-400'}`}>
              ${fmt(currentBankroll)}
            </span>
            <span className={`text-xs tabular-nums ${isUp ? 'text-green-500' : 'text-red-500'}`}>
              {isUp ? '+' : ''}{fmt(netChange)}
            </span>
          </div>

          <div className="w-px h-6 bg-[#1a1a2e] hidden sm:block" />

          {/* ROI */}
          <div className="flex items-baseline gap-2">
            <span className="text-[#4b5563] text-[10px] uppercase tracking-widest">ROI</span>
            <span className={`text-lg font-bold tabular-nums ${roi >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {roi >= 0 ? '+' : ''}{roi.toFixed(2)}%
            </span>
          </div>

          <div className="w-px h-6 bg-[#1a1a2e] hidden sm:block" />

          {/* Days */}
          <div className="flex items-baseline gap-2">
            <span className="text-[#4b5563] text-[10px] uppercase tracking-widest">Days Left</span>
            <span className="text-lg font-bold text-[#3b82f6] tabular-nums">
              {daysRemaining}
            </span>
          </div>
        </div>
      </div>
    </header>
  )
}

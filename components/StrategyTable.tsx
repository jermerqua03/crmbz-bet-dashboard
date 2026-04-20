import { StrategyPerformance } from '@/types'

const STRATEGY_ICONS: Record<string, string> = {
  'High Probability': '🎯',
  'Value Hunting':    '🔍',
  'Parlay':           '🔗',
}

function roiColor(roi: number) {
  if (roi > 0)  return { text: 'text-green-400', bg: 'bg-green-400', border: 'border-green-900/60', card: 'bg-green-950/10' }
  if (roi < 0)  return { text: 'text-red-400',   bg: 'bg-red-500',   border: 'border-red-900/60',   card: 'bg-red-950/10'  }
  return         { text: 'text-slate-400',        bg: 'bg-slate-600', border: 'border-slate-800',    card: 'bg-[#080810]'   }
}

function winRateColor(wr: number) {
  if (wr >= 60) return 'bg-green-500'
  if (wr >= 40) return 'bg-yellow-500'
  return 'bg-red-500'
}

export default function StrategyTable({ strategies }: { strategies: StrategyPerformance[] }) {
  const sorted = [...strategies].sort((a, b) => b.roi - a.roi)
  const maxAbsRoi = Math.max(...strategies.map(s => Math.abs(s.roi)), 1)

  return (
    <div className="bg-[#0d0d1a] border border-[#1a1a2e] rounded-lg p-4">
      <h2 className="text-[10px] font-bold tracking-[0.3em] uppercase text-[#4b5563] mb-4">
        Strategy Performance
      </h2>

      <div className="flex flex-col gap-3">
        {sorted.map((s) => {
          const c = roiColor(s.roi)
          const icon = STRATEGY_ICONS[s.strategy] || '📊'
          const roiBarWidth = Math.min((Math.abs(s.roi) / maxAbsRoi) * 100, 100)

          return (
            <div
              key={s.strategy}
              className={`rounded-xl border ${c.border} ${c.card} px-4 pt-4 pb-3 flex flex-col gap-3`}
            >
              {/* ── Header row ── */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-base leading-none">{icon}</span>
                  <span className="text-sm font-bold text-slate-200 tracking-wide">{s.strategy}</span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#1a1a2e] text-slate-500 tabular-nums">
                  {s.bets} bet{s.bets !== 1 ? 's' : ''}
                </span>
              </div>

              {/* ── Hero numbers ── */}
              <div className="flex items-end justify-between gap-4">
                {/* ROI */}
                <div>
                  <div className="text-[10px] text-slate-600 uppercase tracking-widest mb-0.5">ROI</div>
                  <div className={`text-3xl font-black tabular-nums leading-none ${c.text}`}>
                    {s.roi > 0 ? '+' : ''}{s.roi.toFixed(1)}%
                  </div>
                </div>

                {/* P&L */}
                <div className="text-right">
                  <div className="text-[10px] text-slate-600 uppercase tracking-widest mb-0.5">P&L</div>
                  <div className={`text-xl font-bold tabular-nums leading-none ${c.text}`}>
                    {s.pnl > 0 ? '+$' : s.pnl < 0 ? '-$' : '$'}
                    {Math.abs(s.pnl).toFixed(2)}
                  </div>
                </div>

                {/* Wagered */}
                <div className="text-right">
                  <div className="text-[10px] text-slate-600 uppercase tracking-widest mb-0.5">Wagered</div>
                  <div className="text-xl font-bold tabular-nums leading-none text-slate-400">
                    ${s.wagered.toFixed(0)}
                  </div>
                </div>
              </div>

              {/* ── ROI bar ── */}
              <div>
                <div className="flex justify-between text-[9px] text-slate-600 mb-1 uppercase tracking-widest">
                  <span>ROI vs best</span>
                  <span>{s.roi > 0 ? '+' : ''}{s.roi.toFixed(1)}%</span>
                </div>
                <div className="h-1.5 w-full bg-[#1a1a2e] rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${c.bg}`}
                    style={{ width: `${roiBarWidth}%` }}
                  />
                </div>
              </div>

              {/* ── Win rate ── */}
              <div>
                <div className="flex justify-between text-[9px] text-slate-600 mb-1 uppercase tracking-widest">
                  <span>Win rate</span>
                  <span className={s.winRate >= 60 ? 'text-green-400' : s.winRate > 0 ? 'text-yellow-400' : 'text-slate-600'}>
                    {s.winRate.toFixed(0)}%
                  </span>
                </div>
                <div className="h-1.5 w-full bg-[#1a1a2e] rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${winRateColor(s.winRate)}`}
                    style={{ width: `${Math.max(s.winRate, 0)}%` }}
                  />
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

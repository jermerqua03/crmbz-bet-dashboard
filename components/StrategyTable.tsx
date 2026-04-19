import { StrategyPerformance } from '@/types'

function fmt(n: number, prefix = '$') {
  return `${prefix}${Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function PnlCell({ value }: { value: number }) {
  if (value > 0) return <span className="text-green-400 tabular-nums">+{fmt(value)}</span>
  if (value < 0) return <span className="text-red-400 tabular-nums">-{fmt(Math.abs(value))}</span>
  return <span className="text-[#4b5563] tabular-nums">{fmt(0)}</span>
}

function RoiCell({ value }: { value: number }) {
  const color = value > 0 ? 'text-green-400' : value < 0 ? 'text-red-400' : 'text-[#4b5563]'
  return (
    <span className={`${color} tabular-nums font-bold`}>
      {value > 0 ? '+' : ''}{value.toFixed(1)}%
    </span>
  )
}

export default function StrategyTable({ strategies }: { strategies: StrategyPerformance[] }) {
  const sorted = [...strategies].sort((a, b) => b.roi - a.roi)

  return (
    <div className="bg-[#0d0d1a] border border-[#1a1a2e] rounded-lg p-4">
      <h2 className="text-[10px] font-bold tracking-[0.3em] uppercase text-[#4b5563] mb-4">
        Strategy Performance
      </h2>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-[#1a1a2e]">
              {['Strategy', 'Bets', 'Win Rate', 'Wagered', 'P&L', 'ROI'].map((h) => (
                <th
                  key={h}
                  className="text-left pb-2 pr-4 text-[10px] font-bold tracking-widest uppercase text-[#334155] whitespace-nowrap"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((s, i) => (
              <tr
                key={s.strategy}
                className={`border-b border-[#0f0f1f] hover:bg-[#111124] transition-colors ${
                  i === 0 ? 'bg-[#0f1a0f]' : ''
                }`}
              >
                <td className="py-2.5 pr-4 font-bold text-slate-200 whitespace-nowrap">{s.strategy}</td>
                <td className="py-2.5 pr-4 text-slate-400 tabular-nums">{s.bets}</td>
                <td className="py-2.5 pr-4 tabular-nums">
                  <span className={s.winRate >= 60 ? 'text-green-400' : 'text-red-400'}>
                    {s.winRate.toFixed(1)}%
                  </span>
                </td>
                <td className="py-2.5 pr-4 text-slate-400 tabular-nums">{fmt(s.wagered)}</td>
                <td className="py-2.5 pr-4"><PnlCell value={s.pnl} /></td>
                <td className="py-2.5"><RoiCell value={s.roi} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

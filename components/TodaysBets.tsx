import { Bet } from '@/types'

function ResultBadge({ result }: { result: Bet['result'] }) {
  const map = {
    WIN: 'bg-green-900/40 text-green-400 border-green-800',
    LOSS: 'bg-red-900/40 text-red-400 border-red-800',
    PENDING: 'bg-yellow-900/40 text-yellow-400 border-yellow-800',
  }
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${map[result]} tracking-widest`}>
      {result}
    </span>
  )
}

function PnlCell({ result, pnl }: { result: Bet['result']; pnl: number }) {
  if (result === 'PENDING') return <span className="text-yellow-400 tabular-nums">—</span>
  if (pnl > 0) return <span className="text-green-400 tabular-nums font-bold">+${pnl.toFixed(2)}</span>
  return <span className="text-red-400 tabular-nums font-bold">-${Math.abs(pnl).toFixed(2)}</span>
}

export default function TodaysBets({ bets }: { bets: Bet[] }) {
  const today = new Date().toISOString().split('T')[0]
  const todayBets = bets.filter((b) => b.date === today).length > 0
    ? bets.filter((b) => b.date === today)
    : bets.slice(-3)

  return (
    <div className="bg-[#0d0d1a] border border-[#1a1a2e] rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-[10px] font-bold tracking-[0.3em] uppercase text-[#4b5563]">
          Today&apos;s Bets
        </h2>
        <span className="text-[10px] text-[#334155] tabular-nums">
          {todayBets.length} bet{todayBets.length !== 1 ? 's' : ''}
        </span>
      </div>
      {todayBets.length === 0 ? (
        <p className="text-[#334155] text-xs text-center py-6">No bets placed today.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-[#1a1a2e]">
                {['Sport', 'Description', 'Odds', 'Stake', 'TrueP', 'Edge', 'Result'].map((h) => (
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
              {todayBets.map((bet) => (
                <tr
                  key={bet.id}
                  className={`border-b border-[#0f0f1f] hover:bg-[#111124] transition-colors ${
                    bet.result === 'WIN'
                      ? 'bg-green-950/20'
                      : bet.result === 'LOSS'
                      ? 'bg-red-950/20'
                      : ''
                  }`}
                >
                  <td className="py-2.5 pr-4">
                    <span className="text-[10px] font-bold text-[#3b82f6] tracking-wider">{bet.sport}</span>
                  </td>
                  <td className="py-2.5 pr-4 text-slate-200 whitespace-nowrap">{bet.description}</td>
                  <td className="py-2.5 pr-4 tabular-nums">
                    <span className={parseFloat(bet.odds) > 0 ? 'text-green-400' : 'text-slate-400'}>
                      {bet.odds}
                    </span>
                  </td>
                  <td className="py-2.5 pr-4 text-slate-400 tabular-nums">${bet.stake.toFixed(2)}</td>
                  <td className="py-2.5 pr-4 text-slate-400 tabular-nums">
                    {(bet.trueProb * 100).toFixed(0)}%
                  </td>
                  <td className="py-2.5 pr-4 tabular-nums">
                    <span className={bet.edge >= 0 ? 'text-green-400' : 'text-red-400'}>
                      {bet.edge >= 0 ? '+' : ''}{bet.edge.toFixed(1)}%
                    </span>
                  </td>
                  <td className="py-2.5">
                    <div className="flex items-center gap-2">
                      <ResultBadge result={bet.result} />
                      <PnlCell result={bet.result} pnl={bet.pnl} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

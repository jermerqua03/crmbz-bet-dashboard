'use client'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Bet } from '@/types'
import { ESPNGame } from '@/lib/espn'
import { matchBetToGame } from '@/lib/matchBet'
import LiveGameInfo from './LiveGameInfo'

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

function useLiveGames(sports: string[]) {
  const [games, setGames] = useState<ESPNGame[]>([])
  const sportsKey = sports.join(',')
  const sportsKeyRef = useRef(sportsKey)
  sportsKeyRef.current = sportsKey

  useEffect(() => {
    if (!sportsKeyRef.current) return

    async function fetch_() {
      try {
        const res = await fetch(`/api/live-games?sports=${sportsKeyRef.current}`)
        if (res.ok) setGames(await res.json())
      } catch { /* ignore */ }
    }

    fetch_()
    const id = setInterval(fetch_, 30_000)
    return () => clearInterval(id)
  }, [sportsKey])

  return games
}

export default function TodaysBets({ bets }: { bets: Bet[] }) {
  const today = new Date().toISOString().split('T')[0]
  const todayBets = bets.filter((b) => b.date === today).length > 0
    ? bets.filter((b) => b.date === today)
    : bets.slice(-3)

  // Collect unique sports from pending bets for targeted fetching
  const pendingSports = useMemo(() =>
    Array.from(new Set(todayBets.filter(b => b.result === 'PENDING').map(b => b.sport))),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [todayBets.map(b => `${b.id}${b.result}`).join()]
  )

  const liveGames = useLiveGames(pendingSports)

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
        <div className="space-y-3">
          {todayBets.map((bet) => {
            const { game, playerStat, resolvedResult, resolvedPnl } = bet.result === 'PENDING'
              ? matchBetToGame(bet.description, liveGames, bet.stake, bet.odds)
              : { game: null, playerStat: null, resolvedResult: null, resolvedPnl: null }

            // Use resolved data when game is FINAL, otherwise fall back to JSON
            const displayResult = resolvedResult ?? bet.result
            const displayPnl = resolvedPnl ?? bet.pnl
            const isFinalResolved = !!resolvedResult

            return (
              <div
                key={bet.id}
                className={`rounded-lg border px-3 py-3 ${
                  displayResult === 'WIN'
                    ? 'border-green-900/40 bg-green-950/10'
                    : displayResult === 'LOSS'
                    ? 'border-red-900/40 bg-red-950/10'
                    : game?.status === 'in'
                    ? 'border-red-900/30 bg-[#0f0a0a]'
                    : 'border-[#1a1a2e] bg-[#080810]'
                }`}
              >
                {/* Top row: sport + description + result */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2 min-w-0">
                    <span className="text-[10px] font-bold text-[#3b82f6] tracking-wider shrink-0 mt-0.5">
                      {bet.sport}
                    </span>
                    <span className="text-slate-200 text-xs leading-snug">{bet.description}</span>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <ResultBadge result={displayResult} />
                    {isFinalResolved && <span className="text-[9px] text-gray-600">via ESPN</span>}
                    <PnlCell result={displayResult} pnl={displayPnl} />
                  </div>
                </div>

                {/* Second row: odds / stake / edge */}
                <div className="flex gap-4 mt-1.5 text-[10px] text-[#4b5563]">
                  <span>
                    <span className="text-[#334155] mr-1">ODDS</span>
                    <span className={parseFloat(bet.odds) > 0 ? 'text-green-400' : 'text-slate-400'}>
                      {bet.odds}
                    </span>
                  </span>
                  <span>
                    <span className="text-[#334155] mr-1">STAKE</span>
                    <span className="text-slate-400">${bet.stake}</span>
                  </span>
                  <span>
                    <span className="text-[#334155] mr-1">EDGE</span>
                    <span className={bet.edge >= 0 ? 'text-green-400' : 'text-red-400'}>
                      {bet.edge >= 0 ? '+' : ''}{bet.edge.toFixed(1)}%
                    </span>
                  </span>
                  <span>
                    <span className="text-[#334155] mr-1">TRUE P</span>
                    <span className="text-slate-400">{(bet.trueProb * 100).toFixed(0)}%</span>
                  </span>
                </div>

                {/* Live game info */}
                {game && (
                  <LiveGameInfo
                    game={game}
                    playerStat={playerStat}
                    compact={false}
                  />
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

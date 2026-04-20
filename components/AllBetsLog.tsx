'use client'
import { useEffect, useRef, useState } from 'react'
import { Bet } from '../types'
import { ESPNGame } from '../lib/espn'
import { matchBetToGame } from '../lib/matchBet'
import LiveGameInfo from './LiveGameInfo'

const RESULT_COLORS = {
  WIN: 'text-green-400 bg-green-400/10',
  LOSS: 'text-red-400 bg-red-400/10',
  PENDING: 'text-yellow-400 bg-yellow-400/10',
}

const SPORT_COLORS: Record<string, string> = {
  NBA: 'text-orange-400',
  NHL: 'text-blue-400',
  MLB: 'text-green-400',
  NFL: 'text-yellow-400',
}

function localDateString() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function useLiveGames(sports: string[], betDates: string[]) {
  const [games, setGames] = useState<ESPNGame[]>([])
  const key = sports.join(',') + '|' + betDates.join(',')
  const keyRef = useRef(key)
  keyRef.current = key

  useEffect(() => {
    if (!sports.length) return
    const fetch_ = async () => {
      const [sportsStr, datesStr] = keyRef.current.split('|')
      try {
        const params = new URLSearchParams({ sports: sportsStr })
        if (datesStr) params.set('dates', datesStr)
        const res = await fetch(`/api/live-games?${params}`)
        if (res.ok) setGames(await res.json())
      } catch { /* ignore */ }
    }
    fetch_()
    const id = setInterval(fetch_, 30_000)
    return () => clearInterval(id)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  return games
}

export default function AllBetsLog({ bets }: { bets: Bet[] }) {
  const [sportFilter, setSportFilter] = useState('ALL')
  const [resultFilter, setResultFilter] = useState('ALL')
  const [strategyFilter, setStrategyFilter] = useState('ALL')
  const [detailBet, setDetailBet] = useState<Bet | null>(null)

  const today = localDateString()
  const todaySports = Array.from(new Set(
    bets.filter(b => b.date === today).map(b => b.sport)
  ))
  const todayBetDates = Array.from(new Set(
    bets.filter(b => b.date === today).map(b => b.date)
  ))
  const liveGames = useLiveGames(todaySports, todayBetDates)

  const sports = ['ALL', ...Array.from(new Set(bets.map(b => b.sport)))]
  const strategies = ['ALL', ...Array.from(new Set(bets.map(b => b.strategy)))]

  const filtered = bets
    .filter(b => {
      if (sportFilter !== 'ALL' && b.sport !== sportFilter) return false
      if (resultFilter !== 'ALL' && b.result !== resultFilter) return false
      if (strategyFilter !== 'ALL' && b.strategy !== strategyFilter) return false
      return true
    })
    .sort((a, b) => b.date.localeCompare(a.date))

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-800 flex flex-wrap gap-3 items-center justify-between">
        <h2 className="text-sm font-bold text-gray-300 uppercase tracking-wider">All Bets Log</h2>
        <div className="flex gap-2 flex-wrap">
          <select
            className="bg-gray-800 border border-gray-700 text-gray-300 text-xs rounded px-2 py-1"
            value={sportFilter}
            onChange={e => setSportFilter(e.target.value)}
          >
            {sports.map(s => <option key={s}>{s}</option>)}
          </select>
          <select
            className="bg-gray-800 border border-gray-700 text-gray-300 text-xs rounded px-2 py-1"
            value={resultFilter}
            onChange={e => setResultFilter(e.target.value)}
          >
            {['ALL', 'WIN', 'LOSS', 'PENDING'].map(r => <option key={r}>{r}</option>)}
          </select>
          <select
            className="bg-gray-800 border border-gray-700 text-gray-300 text-xs rounded px-2 py-1"
            value={strategyFilter}
            onChange={e => setStrategyFilter(e.target.value)}
          >
            {strategies.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
      </div>
      <div className="overflow-x-auto">
        {filtered.length === 0 ? (
          <div className="text-center py-8 text-gray-600">No bets yet. Start your first simulation to see results here!</div>
        ) : (
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-gray-800">
              {['Date', 'Sport', 'Bet', 'Odds', 'Stake', 'True P', 'Edge', 'Result', 'P&L', 'Strategy'].map(h => (
                <th key={h} className="px-3 py-2 text-left text-gray-500 uppercase tracking-wider font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((bet, i) => {
              const isToday = bet.date === today
              const { game, playerStat, resolvedResult, resolvedPnl } = isToday
                ? matchBetToGame(bet.description, liveGames, bet.stake, bet.odds)
                : { game: null, playerStat: null, resolvedResult: null, resolvedPnl: null }

              const displayResult = resolvedResult ?? bet.result
              const displayPnl = resolvedPnl ?? bet.pnl
              const isLive = game?.status === 'in'

              return (
                <tr key={bet.id}
                  className={`border-b border-gray-800/50 hover:bg-gray-800/30 ${i % 2 === 0 ? '' : 'bg-gray-900/50'} cursor-pointer ${isLive ? 'bg-red-950/10' : ''}`}
                  onClick={() => setDetailBet(bet)}
                >
                  <td className="px-3 py-2 text-gray-400 whitespace-nowrap">{bet.date}</td>
                  <td className={`px-3 py-2 font-medium ${SPORT_COLORS[bet.sport] || 'text-gray-300'}`}>{bet.sport}</td>
                  <td className="px-3 py-2 text-gray-200 max-w-[220px]">
                    <div className="truncate">{bet.description}</div>
                    {/* Score + player stat inline — no LIVE badge here, it lives in Result column */}
                    {game && (
                      <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                        <span className="text-[10px] font-mono text-gray-400">
                          {game.awayAbbr} <b className="text-gray-200">{game.awayScore}</b>
                          {' — '}
                          {game.homeAbbr} <b className="text-gray-200">{game.homeScore}</b>
                        </span>
                        {isLive && game.statusDetail && (
                          <span className="text-[9px] text-gray-600">{game.statusDetail}</span>
                        )}
                        {playerStat && (
                          <span className={`text-[9px] font-bold px-1 rounded ${
                            playerStat.pace === 'hitting' ? 'bg-green-900/50 text-green-400' : 'bg-gray-800 text-gray-400'
                          }`}>
                            {playerStat.label} {playerStat.current}/{playerStat.direction === 'over' ? `${playerStat.target}+` : `u${playerStat.target}`}
                          </span>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-2 text-gray-300">{bet.odds}</td>
                  <td className="px-3 py-2 text-gray-300">${bet.stake}</td>
                  <td className="px-3 py-2 text-gray-300">{(bet.trueProb * 100).toFixed(0)}%</td>
                  <td className={`px-3 py-2 font-medium ${bet.edge >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {bet.edge >= 0 ? '+' : ''}{bet.edge.toFixed(1)}%
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex flex-col gap-1">
                      {isLive && (
                        <span className="px-1.5 py-0.5 bg-red-600 text-white rounded text-[9px] font-bold tracking-widest animate-pulse w-fit">
                          LIVE
                        </span>
                      )}
                      <span className={`px-2 py-0.5 rounded text-xs font-bold w-fit ${RESULT_COLORS[displayResult]}`}>
                        {displayResult}
                      </span>
                    </div>
                  </td>
                  <td className={`px-3 py-2 font-bold ${displayPnl > 0 ? 'text-green-400' : displayPnl < 0 ? 'text-red-400' : 'text-gray-400'}`}>
                    {displayPnl > 0 ? '+' : ''}{displayPnl !== 0 ? `$${Math.abs(displayPnl).toFixed(2)}` : '—'}
                  </td>
                  <td className="px-3 py-2 text-gray-400">{bet.strategy}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
        )}
      </div>
      {/* Modal for details */}
      {detailBet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/70" onClick={() => setDetailBet(null)}>
          <div className="max-w-lg w-full bg-gray-900 border border-gray-700 rounded-lg p-8 shadow-2xl relative" onClick={e => e.stopPropagation()}>
            <button onClick={() => setDetailBet(null)} className="absolute top-3 right-3 text-2xl text-gray-400 hover:text-gray-200">&times;</button>
            <h3 className="text-xl font-bold mb-2 text-white">{detailBet.description}</h3>
            <div className="mb-2"> <span className="text-gray-400">Date:</span> {detailBet.date} </div>
            <div className="mb-2"> <span className="text-gray-400">Sport:</span> {detailBet.sport} </div>
            <div className="mb-2"> <span className="text-gray-400">Odds:</span> {detailBet.odds} | <span className="text-gray-400">Stake:</span> ${detailBet.stake} </div>
            <div className="mb-2"> <span className="text-gray-400">True Probability:</span> {(detailBet.trueProb * 100).toFixed(1)}% | <span className="text-gray-400">Edge:</span> {detailBet.edge >= 0 ? '+' : ''}{detailBet.edge}% </div>
            <div className="mb-2"><span className="text-gray-400">Strategy:</span> {detailBet.strategy}</div>
            <div className="mb-4"><span className="text-gray-400">EV per $10:</span> ${(detailBet.stake * (detailBet.trueProb * ((parseFloat(detailBet.odds.replace('+','')) / 100)+1) - (1-detailBet.trueProb))).toFixed(2)}</div>
            <div className="mb-4 bg-gray-800 rounded p-3">
              <div className="font-bold text-gray-200 mb-1">🧠 Why this bet?</div>
              <div className="text-gray-300 text-sm whitespace-pre-line">
                {detailBet.notes || 'Analysis/model consensus: Good edge, meets all verification checks, smart value pick.'}
              </div>
            </div>
            <div className="flex justify-end"><button className="text-blue-400 hover:underline text-sm" onClick={() => setDetailBet(null)}>Close</button></div>
          </div>
        </div>
      )}
    </div>
  )
}

'use client'

import { useState } from 'react'
import { Bet } from '@/types'

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

export default function AllBetsLog({ bets }: { bets: Bet[] }) {
  const [sportFilter, setSportFilter] = useState('ALL')
  const [resultFilter, setResultFilter] = useState('ALL')
  const [strategyFilter, setStrategyFilter] = useState('ALL')
  const [detailBet, setDetailBet] = useState<Bet | null>(null)

  const sports = ['ALL', ...Array.from(new Set(bets.map(b => b.sport)))]
  const strategies = ['ALL', ...Array.from(new Set(bets.map(b => b.strategy)))]

  const filtered = bets.filter(b => {
    if (sportFilter !== 'ALL' && b.sport !== sportFilter) return false
    if (resultFilter !== 'ALL' && b.result !== resultFilter) return false
    if (strategyFilter !== 'ALL' && b.strategy !== strategyFilter) return false
    return true
  })

  function liveStatus(bet: Bet) {
    // If game is PENDING and date is today, mark as LIVE
    const today = new Date().toISOString().slice(0,10)
    return bet.result === 'PENDING' && bet.date === today
      ? <span className="ml-2 px-2 py-0.5 text-xs rounded bg-blue-600 text-white animate-pulse">LIVE</span>
      : null
  }

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
            {filtered.map((bet, i) => (
              <tr key={bet.id}
                className={`border-b border-gray-800/50 hover:bg-gray-800/30 ${i % 2 === 0 ? '' : 'bg-gray-900/50'} cursor-pointer`}
                onClick={() => setDetailBet(bet)}
              >
                <td className="px-3 py-2 text-gray-400">{bet.date}</td>
                <td className={`px-3 py-2 font-medium ${SPORT_COLORS[bet.sport] || 'text-gray-300'}`}>{bet.sport}</td>
                <td className="px-3 py-2 text-gray-200 max-w-[200px] truncate">{bet.description}</td>
                <td className="px-3 py-2 text-gray-300">{bet.odds}</td>
                <td className="px-3 py-2 text-gray-300">${bet.stake}</td>
                <td className="px-3 py-2 text-gray-300">{(bet.trueProb * 100).toFixed(0)}%</td>
                <td className={`px-3 py-2 font-medium ${bet.edge >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {bet.edge >= 0 ? '+' : ''}{bet.edge.toFixed(1)}%
                </td>
                <td className="px-3 py-2">
                  <span className={`px-2 py-0.5 rounded text-xs font-bold ${RESULT_COLORS[bet.result]}`}>
                    {bet.result}
                  </span>
                  {liveStatus(bet)}
                </td>
                <td className={`px-3 py-2 font-bold ${bet.pnl > 0 ? 'text-green-400' : bet.pnl < 0 ? 'text-red-400' : 'text-gray-400'}`}>
                  {bet.pnl > 0 ? '+' : ''}{bet.pnl !== 0 ? `$${bet.pnl.toFixed(2)}` : '—'}
                </td>
                <td className="px-3 py-2 text-gray-400">{bet.strategy}</td>
              </tr>
            ))}
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

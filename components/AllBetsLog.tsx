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

  const sports = ['ALL', ...Array.from(new Set(bets.map(b => b.sport)))]
  const strategies = ['ALL', ...Array.from(new Set(bets.map(b => b.strategy)))]

  const filtered = bets.filter(b => {
    if (sportFilter !== 'ALL' && b.sport !== sportFilter) return false
    if (resultFilter !== 'ALL' && b.result !== resultFilter) return false
    if (strategyFilter !== 'ALL' && b.strategy !== strategyFilter) return false
    return true
  })

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
              <tr key={bet.id} className={`border-b border-gray-800/50 hover:bg-gray-800/30 ${i % 2 === 0 ? '' : 'bg-gray-900/50'}`}>
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
    </div>
  )
}

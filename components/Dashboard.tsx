'use client'
import { useEffect, useMemo, useRef, useState } from 'react'
import { DashboardData } from '../types'
import { ESPNGame } from '../lib/espn'
import { computeLiveStats } from '../lib/computeStats'
import Header from './Header'
import BankrollChart from './BankrollChart'
import StrategyTable from './StrategyTable'
import TodaysBets from './TodaysBets'
import AllBetsLog from './AllBetsLog'
import StatsRow from './StatsRow'

function localDateString() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// Single live-games poll at the Dashboard level — shared by all children
function useLiveGames(sports: string[], betDates: string[]) {
  const [games, setGames] = useState<ESPNGame[]>([])
  const key = sports.join(',') + '|' + betDates.join(',')
  const keyRef = useRef(key)
  keyRef.current = key

  useEffect(() => {
    if (!sports.length) return
    async function fetch_() {
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

export default function Dashboard({ data }: { data: DashboardData }) {
  const today = localDateString()

  const todaySports = useMemo(() =>
    Array.from(new Set(data.bets.filter(b => b.date === today).map(b => b.sport))),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data.bets.map(b => b.id).join(), today]
  )
  const todayDates = useMemo(() =>
    Array.from(new Set(data.bets.filter(b => b.date === today).map(b => b.date))),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data.bets.map(b => b.id).join(), today]
  )

  // One shared live-games fetch for the whole dashboard
  const liveGames = useLiveGames(todaySports, todayDates)

  // Recompute all aggregate stats from live-resolved bets
  const liveStats = useMemo(
    () => computeLiveStats(data.bets, liveGames, data.startingBankroll),
    [data.bets, liveGames, data.startingBankroll]
  )

  // Merge live stats back into the data shape so child components get accurate numbers
  const computedData: DashboardData = useMemo(() => ({
    ...data,
    wins:            liveStats.wins,
    losses:          liveStats.losses,
    winRate:         liveStats.winRate,
    netProfit:       liveStats.netProfit,
    roi:             liveStats.roi,
    currentBankroll: liveStats.currentBankroll,
    strategies:      liveStats.strategies,
  }), [data, liveStats])

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 font-mono">
      <Header data={computedData} />
      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        <StatsRow data={computedData} />
        <BankrollChart data={data.bankrollHistory} />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <TodaysBets bets={data.bets} liveGames={liveGames} />
          <StrategyTable strategies={computedData.strategies} />
        </div>
        <AllBetsLog bets={data.bets} liveGames={liveGames} />
      </main>
    </div>
  )
}

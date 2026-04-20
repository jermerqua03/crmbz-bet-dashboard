'use client'
import { DashboardData } from '../types'
import Header from './Header'
import BankrollChart from './BankrollChart'
import StrategyTable from './StrategyTable'
import TodaysBets from './TodaysBets'
import AllBetsLog from './AllBetsLog'
import StatsRow from './StatsRow'

export default function Dashboard({ data }: { data: DashboardData }) {
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 font-mono">
      <Header data={data} />
      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        <StatsRow data={data} />
        <BankrollChart data={data.bankrollHistory} />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <TodaysBets bets={data.bets} />
          <StrategyTable strategies={data.strategies} />
        </div>
        <AllBetsLog bets={data.bets} />
      </main>
    </div>
  )
}

'use client'

import { useEffect, useState } from 'react'
import Dashboard from '@/components/Dashboard'
import { DashboardData } from '@/types'

export default function Home() {
  const [data, setData] = useState<DashboardData | null>(null)

  useEffect(() => {
    fetch('/dashboard-data.json', { cache: 'no-store' })
      .then((res) => res.json())
      .then(setData)
      .catch(() => setData({
        currentBankroll: 1000, startingBankroll: 1000, netProfit: 0, roi: 0, wins: 0, losses: 0, winRate: 0, daysRemaining: 14,
        bankrollHistory: [], strategies: [], bets: [], todaysBets: []
      }))
  }, [])

  if (!data) {
    return <div className="min-h-screen bg-gray-950 text-gray-100 flex items-center justify-center">Loading bets...</div>
  }

  return <Dashboard data={data} />
}

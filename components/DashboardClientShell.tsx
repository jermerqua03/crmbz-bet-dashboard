'use client'
import { useEffect, useState } from 'react'
import Dashboard from '../components/Dashboard'
import { DashboardData } from '../types'

const FALLBACK: DashboardData = {
  currentBankroll: 1000, startingBankroll: 1000, netProfit: 0, roi: 0,
  wins: 0, losses: 0, winRate: 0, daysRemaining: 0,
  season: '2026', currentWeek: 1,
  bankrollHistory: [], strategies: [], bets: [], todaysBets: [],
  injuryReports: [], propRecommendations: [],
}

export default function DashboardClientShell() {
  const [data, setData] = useState<DashboardData | null>(null)
  useEffect(() => {
    // Reads from Postgres via the server route (falls back to the static JSON if the API is down).
    fetch('/api/dashboard', { cache: 'no-store' })
      .then(res => res.json())
      .then(setData)
      .catch(() =>
        fetch('/dashboard-data.json', { cache: 'no-store' })
          .then(res => res.json())
          .then(setData)
          .catch(() => setData(FALLBACK)),
      )
  }, [])
  if (!data) {
    return <div className="min-h-screen bg-gray-950 text-gray-100 flex items-center justify-center">Loading…</div>
  }
  return <Dashboard data={data} />
}

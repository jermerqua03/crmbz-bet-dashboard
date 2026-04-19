// Loads dashboard data on both server and client (Next.js friendly).
// If on Vercel, fetches /dashboard-data.json from public. Otherwise, reads from local file for development.
import fs from 'fs'

export async function getData() {
  if (typeof window !== 'undefined') {
    // Client fetch (browser, vercel):
    const res = await fetch('/dashboard-data.json')
    return await res.json()
  }
  try {
    const raw = fs.readFileSync('public/dashboard-data.json', 'utf8')
    return JSON.parse(raw)
  } catch {
    return {
      currentBankroll: 1000, startingBankroll: 1000, netProfit: 0, roi: 0, wins: 0, losses: 0, winRate: 0, daysRemaining: 14,
      bankrollHistory: [], strategies: [], bets: [], todaysBets: []
    }
  }
}

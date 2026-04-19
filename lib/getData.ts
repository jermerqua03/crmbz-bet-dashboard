import fs from 'fs'
import { DashboardData } from '@/types'

const EMPTY_DATA: DashboardData = {
  currentBankroll: 1000,
  startingBankroll: 1000,
  netProfit: 0,
  roi: 0,
  wins: 0,
  losses: 0,
  winRate: 0,
  daysRemaining: 14,
  bankrollHistory: [],
  strategies: [],
  bets: [],
  todaysBets: [],
}

export async function getData(): Promise<DashboardData> {
  try {
    const raw = fs.readFileSync('/Users/jermerqua02/.openclaw/workspace/gamble-sim/dashboard-data.json', 'utf8')
    const data = JSON.parse(raw)
    // Only show data from April 18 onward
    data.bets = (data.bets || []).filter((b:any) => new Date(b.date) >= new Date('2026-04-18'))
    data.todaysBets = (data.todaysBets || []).filter((b:any) => new Date(b.date) >= new Date('2026-04-18'))
    data.bankrollHistory = (data.bankrollHistory || []).filter((b:any) => new Date(b.date) >= new Date('2026-04-18'))
    return data
  } catch {
    return EMPTY_DATA
  }
}

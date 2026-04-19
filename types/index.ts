export interface Bet {
  id: string
  date: string
  sport: string
  description: string
  odds: string
  stake: number
  trueProb: number
  edge: number
  result: 'WIN' | 'LOSS' | 'PENDING'
  pnl: number
  strategy: string
  notes?: string
  model?: string
  reasoning?: string
}

export interface StrategyPerformance {
  strategy: string
  bets: number
  winRate: number
  wagered: number
  pnl: number
  roi: number
}

export interface BankrollDataPoint {
  date: string
  bankroll: number
}

export interface DashboardData {
  currentBankroll: number
  startingBankroll: number
  netProfit: number
  roi: number
  wins: number
  losses: number
  winRate: number
  daysRemaining: number
  bankrollHistory: BankrollDataPoint[]
  strategies: StrategyPerformance[]
  bets: Bet[]
  todaysBets: Bet[]
}

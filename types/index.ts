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

// ---- NFL football additions ----

// One rung of a FanDuel alternate-line ladder for a prop.
export interface AltLine {
  line: number        // e.g. 6.5 receptions, 74.5 yards
  odds: string        // FanDuel American odds at this line, e.g. "+110"
  hitProb: number     // model probability of the recommended side hitting at this line (0..1)
  edge: number        // model edge vs. implied prob, in percentage points
}

// A single player-prop recommendation for the week.
export interface PropRec {
  id: string
  week: number
  gameDate: string        // YYYY-MM-DD
  kickoff?: string        // e.g. "Sun 1:00 PM ET"
  player: string
  team: string            // abbr, e.g. "CIN"
  opponent: string        // abbr, e.g. "CLE"
  position: string        // QB / RB / WR / TE
  market: string          // human label, e.g. "Receiving Yards"
  marketKey?: string      // odds-api key, e.g. "player_reception_yds"
  side: 'OVER' | 'UNDER'
  line: number            // recommended primary line
  odds: string            // FanDuel odds at the recommended line
  projection: number      // model projected stat value
  hitProb: number         // model P(recommended side hits) at the primary line (0..1)
  edge: number            // percentage points at the primary line
  tier: 1 | 2 | 3
  confidence: 'HIGH' | 'MEDIUM' | 'LOW'
  matchup: string         // short matchup rationale (opp defense rank, pace, etc.)
  reasoning?: string      // longer explanation
  altLines?: AltLine[]    // adjustable ladder of alternate lines
  injuryFlag?: string     // note if a related injury affects this prop
  updatedAt?: string
}

export type InjuryStatus = 'OUT' | 'IR' | 'DOUBTFUL' | 'QUESTIONABLE' | 'PROBABLE' | 'ACTIVE'

// A player injury / status note with betting impact.
export interface InjuryReport {
  id: string
  player: string
  team: string            // abbr
  position: string
  status: InjuryStatus
  detail: string          // the news / description
  propImpact?: string     // how this shifts props (who benefits, which markets)
  source?: string         // e.g. "ESPN", "beat reporter"
  updatedAt: string
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
  lastUpdated?: string
  // football/season context
  season?: string
  currentWeek?: number
  bankrollHistory: BankrollDataPoint[]
  strategies: StrategyPerformance[]
  bets: Bet[]
  todaysBets: Bet[]
  // NFL additions (optional so older data still parses)
  injuryReports?: InjuryReport[]
  propRecommendations?: PropRec[]
}

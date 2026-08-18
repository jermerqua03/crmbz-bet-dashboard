// Server-only: builds the DashboardData payload from Postgres (via Prisma).
// Consumed by the /api/dashboard route; the client fetches that route.
import { prisma } from './prisma'
import type {
  DashboardData,
  Bet,
  PropRec,
  InjuryReport,
  AltLine,
  StrategyPerformance,
} from '@/types'

function localDateString(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const EMPTY: DashboardData = {
  currentBankroll: 1000, startingBankroll: 1000, netProfit: 0, roi: 0,
  wins: 0, losses: 0, winRate: 0, daysRemaining: 0,
  season: '2026', currentWeek: 1,
  bankrollHistory: [], strategies: [], bets: [], todaysBets: [],
  injuryReports: [], propRecommendations: [],
}

export async function getData(): Promise<DashboardData> {
  try {
    const [app, recRows, injuryRows, betRows, bankRows] = await Promise.all([
      prisma.appState.findFirst(),
      prisma.recommendation.findMany(),
      prisma.injury.findMany(),
      prisma.bet.findMany({ orderBy: { date: 'asc' } }),
      prisma.bankrollPoint.findMany({ orderBy: { date: 'asc' } }),
    ])

    const startingBankroll = app?.startingBankroll ?? 1000
    const currentWeek = app?.currentWeek ?? 1

    const recs: PropRec[] = recRows
      .filter((r) => r.week === currentWeek)
      .map((r) => ({
        id: r.id,
        week: r.week,
        gameDate: r.gameDate ?? '',
        kickoff: r.kickoff ?? undefined,
        player: r.player,
        team: r.team,
        opponent: r.opponent,
        position: r.position,
        market: r.market,
        marketKey: r.marketKey ?? undefined,
        side: (r.side === 'UNDER' ? 'UNDER' : 'OVER'),
        line: r.line,
        odds: r.odds,
        projection: r.projection,
        hitProb: r.hitProb,
        edge: r.edge,
        tier: (r.tier === 3 ? 3 : r.tier === 2 ? 2 : 1),
        confidence: (r.confidence as PropRec['confidence']) ?? 'MEDIUM',
        matchup: r.matchup,
        reasoning: r.reasoning ?? undefined,
        altLines: (r.altLines as unknown as AltLine[] | null) ?? undefined,
        injuryFlag: r.injuryFlag ?? undefined,
        updatedAt: r.updatedAt.toISOString(),
      }))

    const SEVERITY: Record<string, number> = { OUT: 0, IR: 1, DOUBTFUL: 2, QUESTIONABLE: 3, PROBABLE: 4, ACTIVE: 5 }
    const injuryReports: InjuryReport[] = injuryRows
      .map((i) => ({
        id: i.id,
        player: i.player,
        team: i.team,
        position: i.position,
        status: i.status as InjuryReport['status'],
        detail: i.detail,
        propImpact: i.propImpact ?? undefined,
        source: i.source ?? undefined,
        updatedAt: i.updatedAt.toISOString(),
      }))
      // Most severe first, then most recent; cap the panel to a readable set.
      .sort((a, b) =>
        (SEVERITY[a.status] ?? 9) - (SEVERITY[b.status] ?? 9) ||
        b.updatedAt.localeCompare(a.updatedAt),
      )
      .slice(0, 40)

    const bets: Bet[] = betRows.map((b) => ({
      id: b.id,
      date: b.date,
      sport: b.sport,
      description: b.description,
      odds: b.odds,
      stake: b.stake,
      trueProb: b.trueProb,
      edge: b.edge,
      result: (b.result as Bet['result']) ?? 'PENDING',
      pnl: b.pnl,
      strategy: b.strategy,
      notes: b.notes ?? undefined,
    }))

    // Aggregate stats from resolved bets
    const resolved = bets.filter((b) => b.result === 'WIN' || b.result === 'LOSS')
    const wins = resolved.filter((b) => b.result === 'WIN').length
    const losses = resolved.filter((b) => b.result === 'LOSS').length
    const netProfit = bets.reduce((s, b) => s + (b.pnl || 0), 0)
    const currentBankroll = startingBankroll + netProfit
    const wagered = bets.reduce((s, b) => s + (b.stake || 0), 0)
    const winRate = wins + losses > 0 ? (wins / (wins + losses)) * 100 : 0
    const roi = wagered > 0 ? (netProfit / wagered) * 100 : 0

    // Strategy breakdown
    const byStrategy = new Map<string, { bets: number; wins: number; losses: number; wagered: number; pnl: number }>()
    for (const b of bets) {
      const s = byStrategy.get(b.strategy) ?? { bets: 0, wins: 0, losses: 0, wagered: 0, pnl: 0 }
      s.bets++
      s.wagered += b.stake || 0
      s.pnl += b.pnl || 0
      if (b.result === 'WIN') s.wins++
      if (b.result === 'LOSS') s.losses++
      byStrategy.set(b.strategy, s)
    }
    const strategies: StrategyPerformance[] = Array.from(byStrategy.entries()).map(([strategy, s]) => ({
      strategy,
      bets: s.bets,
      winRate: s.wins + s.losses > 0 ? (s.wins / (s.wins + s.losses)) * 100 : 0,
      wagered: s.wagered,
      pnl: s.pnl,
      roi: s.wagered > 0 ? (s.pnl / s.wagered) * 100 : 0,
    }))

    const bankrollHistory = bankRows.map((p) => ({ date: p.date, bankroll: p.bankroll }))
    if (bankrollHistory.length === 0) {
      bankrollHistory.push({ date: localDateString(), bankroll: currentBankroll })
    }

    const today = localDateString()

    return {
      currentBankroll,
      startingBankroll,
      netProfit,
      roi,
      wins,
      losses,
      winRate,
      daysRemaining: 0,
      lastUpdated: app?.updatedAt?.toISOString(),
      season: app?.season ?? '2026',
      currentWeek,
      bankrollHistory,
      strategies,
      bets,
      todaysBets: bets.filter((b) => b.date === today),
      injuryReports,
      propRecommendations: recs,
    }
  } catch (err) {
    console.error('getData() failed, returning empty dashboard:', err)
    return EMPTY
  }
}

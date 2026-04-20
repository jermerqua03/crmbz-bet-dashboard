import { Bet, StrategyPerformance } from '../types'
import { ESPNGame } from './espn'
import { matchBetToGame } from './matchBet'

export interface LiveStats {
  wins: number
  losses: number
  winRate: number
  netProfit: number
  roi: number
  currentBankroll: number
  strategies: StrategyPerformance[]
}

export function computeLiveStats(
  bets: Bet[],
  liveGames: ESPNGame[],
  startingBankroll: number,
): LiveStats {
  let wins = 0, losses = 0, totalPnl = 0, totalWagered = 0

  const sMap = new Map<string, {
    bets: number; resolved: number; wins: number; wagered: number; pnl: number
  }>()

  for (const bet of bets) {
    const { resolvedResult, resolvedPnl } = matchBetToGame(bet.description, liveGames, bet.stake, bet.odds)
    const effectiveResult = resolvedResult ?? bet.result
    const effectivePnl   = resolvedResult != null ? (resolvedPnl ?? 0) : bet.pnl

    if (!sMap.has(bet.strategy)) sMap.set(bet.strategy, { bets: 0, resolved: 0, wins: 0, wagered: 0, pnl: 0 })
    const s = sMap.get(bet.strategy)!
    s.bets++
    s.wagered += bet.stake

    if (effectiveResult === 'WIN') {
      wins++; s.wins++; s.resolved++
      totalPnl += effectivePnl; s.pnl += effectivePnl
    } else if (effectiveResult === 'LOSS') {
      losses++; s.resolved++
      totalPnl += effectivePnl; s.pnl += effectivePnl
    }
    totalWagered += bet.stake
  }

  const resolved = wins + losses
  const winRate = resolved > 0 ? (wins / resolved) * 100 : 0
  const roi     = totalWagered > 0 ? (totalPnl / totalWagered) * 100 : 0

  const strategies: StrategyPerformance[] = Array.from(sMap.entries()).map(([strategy, s]) => ({
    strategy,
    bets:    s.bets,
    winRate: s.resolved > 0 ? (s.wins / s.resolved) * 100 : 0,
    wagered: s.wagered,
    pnl:     s.pnl,
    roi:     s.wagered > 0 ? (s.pnl / s.wagered) * 100 : 0,
  }))

  return {
    wins,
    losses,
    winRate,
    netProfit: totalPnl,
    roi,
    currentBankroll: startingBankroll + totalPnl,
    strategies,
  }
}

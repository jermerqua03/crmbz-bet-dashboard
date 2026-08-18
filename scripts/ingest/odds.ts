// Ingest FanDuel NFL player props into PropLine (with alternate-line ladders).
// Scrapes only the current week's games. Player props post ~game week; before then this
// logs 0 props (core markets only) — the plumbing is live and captures them once posted.
import { PrismaClient } from '@prisma/client'
import {
  fetchNflGames,
  fetchEventSelections,
  classifyNflMarket,
  playerFromSelection,
} from '../../lib/fanduel'

type Rung = { line: number; odds: number; alt: boolean }
type Entry = {
  player: string
  marketKey: string
  market: string
  gameDate: string
  overs: Rung[]
  standard: { line: number; odds: number } | null
  tdOdds: number | null
}

export async function ingestOdds(prisma: PrismaClient): Promise<void> {
  const app = await prisma.appState.findFirst()
  const week = app?.currentWeek ?? 1

  // Current week's game dates (from the schedule we already ingest).
  const games = await prisma.game.findMany({ where: { week } })
  const weekDates = new Set(games.map((g) => g.gameDate))
  if (weekDates.size === 0) {
    console.log('[odds] no scheduled games for current week yet; skipping.')
    return
  }

  const fdGames = await fetchNflGames()
  const targets = fdGames.filter((g) => weekDates.has((g.openDate || '').slice(0, 10)))
  console.log(`[odds] week ${week}: ${targets.length} FanDuel games match the schedule.`)

  const entries = new Map<string, Entry>()
  let gamesWithProps = 0

  for (const g of targets) {
    let sels
    try {
      sels = await fetchEventSelections(g.eventId)
    } catch (e) {
      console.error(`[odds] event ${g.eventId} fetch failed:`, (e as Error).message)
      continue
    }
    let propsHere = 0
    for (const s of sels) {
      const cls = classifyNflMarket(s.marketName)
      if (!cls) continue
      const player = playerFromSelection(s)
      if (!player) continue
      const base = cls.marketKey.replace('_alternate', '')
      const isAlt = cls.marketKey.endsWith('_alternate')
      const key = `${player}||${base}`
      const entry: Entry =
        entries.get(key) ??
        { player, marketKey: base, market: cls.market, gameDate: (g.openDate || '').slice(0, 10), overs: [], standard: null, tdOdds: null }

      if (base === 'player_anytime_td') {
        if (s.americanOdds != null) entry.tdOdds = s.americanOdds
      } else {
        const side = /under/i.test(s.runnerName) ? 'UNDER' : 'OVER'
        if (side === 'OVER' && s.line != null && s.americanOdds != null) {
          entry.overs.push({ line: s.line, odds: s.americanOdds, alt: isAlt })
          if (!isAlt) entry.standard = { line: s.line, odds: s.americanOdds }
        }
      }
      entries.set(key, entry)
      propsHere++
    }
    if (propsHere > 0) gamesWithProps++
  }

  // Persist: replace this week's snapshot.
  await prisma.propLine.deleteMany({ where: { week } })
  let stored = 0
  for (const e of entries.values()) {
    if (e.marketKey === 'player_anytime_td') {
      if (e.tdOdds == null) continue
      await prisma.propLine.create({
        data: {
          week, gameDate: e.gameDate, player: e.player, market: e.market, marketKey: e.marketKey,
          book: 'fanduel', side: 'YES', line: 0.5, odds: fmtOdds(e.tdOdds), altLines: undefined,
        },
      })
      stored++
      continue
    }
    // Dedupe overs by line, sort ascending → the alt ladder.
    const byLine = new Map<number, number>()
    for (const r of e.overs) if (!byLine.has(r.line)) byLine.set(r.line, r.odds)
    const ladder = [...byLine.entries()].sort((a, b) => a[0] - b[0]).map(([line, odds]) => ({ line, odds: fmtOdds(odds) }))
    if (ladder.length === 0) continue
    const primary = e.standard ?? { line: ladder[Math.floor(ladder.length / 2)].line, odds: 0 }
    const primaryOdds = e.standard ? fmtOdds(e.standard.odds) : ladder[Math.floor(ladder.length / 2)].odds
    await prisma.propLine.create({
      data: {
        week, gameDate: e.gameDate, player: e.player, market: e.market, marketKey: e.marketKey,
        book: 'fanduel', side: 'OVER', line: primary.line, odds: primaryOdds, altLines: ladder,
      },
    })
    stored++
  }

  console.log(`[odds] stored ${stored} player-prop lines from ${gamesWithProps}/${targets.length} games.` +
    (stored === 0 ? ' (player props not posted yet — expected until game week)' : ''))
}

function fmtOdds(a: number): string {
  return a > 0 ? `+${a}` : `${a}`
}

if (require.main === module) {
  const prisma = new PrismaClient()
  ingestOdds(prisma)
    .catch((e) => { console.error(e); process.exit(1) })
    .finally(() => prisma.$disconnect())
}

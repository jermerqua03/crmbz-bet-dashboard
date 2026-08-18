// Seeds Postgres from public/dashboard-data.json (the Phase 1 seed content).
// Idempotent: clears + reinserts recommendations/injuries, upserts app state & bankroll.
// Run: DATABASE_URL=... npx tsx prisma/seed.ts
import { PrismaClient } from '@prisma/client'
import { readFileSync } from 'fs'
import { join } from 'path'

const prisma = new PrismaClient()

async function main() {
  const raw = JSON.parse(
    readFileSync(join(process.cwd(), 'public', 'dashboard-data.json'), 'utf-8'),
  )

  // App state (singleton)
  await prisma.appState.upsert({
    where: { id: 1 },
    update: {
      season: raw.season ?? '2026',
      currentWeek: raw.currentWeek ?? 1,
      startingBankroll: raw.startingBankroll ?? 1000,
    },
    create: {
      id: 1,
      season: raw.season ?? '2026',
      currentWeek: raw.currentWeek ?? 1,
      startingBankroll: raw.startingBankroll ?? 1000,
    },
  })

  // Bankroll history
  for (const p of raw.bankrollHistory ?? []) {
    await prisma.bankrollPoint.upsert({
      where: { date: p.date },
      update: { bankroll: p.bankroll },
      create: { date: p.date, bankroll: p.bankroll },
    })
  }

  // Recommendations (replace the current-week seed set)
  await prisma.recommendation.deleteMany({})
  for (const r of raw.propRecommendations ?? []) {
    await prisma.recommendation.create({
      data: {
        week: r.week ?? raw.currentWeek ?? 1,
        gameDate: r.gameDate ?? null,
        kickoff: r.kickoff ?? null,
        player: r.player,
        team: r.team,
        opponent: r.opponent,
        position: r.position,
        market: r.market,
        marketKey: r.marketKey ?? null,
        side: r.side ?? 'OVER',
        line: r.line,
        odds: r.odds,
        projection: r.projection,
        hitProb: r.hitProb,
        edge: r.edge,
        tier: r.tier ?? 1,
        confidence: r.confidence ?? 'MEDIUM',
        matchup: r.matchup ?? '',
        reasoning: r.reasoning ?? null,
        altLines: r.altLines ?? undefined,
        injuryFlag: r.injuryFlag ?? null,
      },
    })
  }

  // Injuries (replace)
  await prisma.injury.deleteMany({})
  for (const i of raw.injuryReports ?? []) {
    await prisma.injury.create({
      data: {
        player: i.player,
        team: i.team,
        position: i.position,
        status: i.status,
        detail: i.detail,
        propImpact: i.propImpact ?? null,
        source: i.source ?? null,
        updatedAt: i.updatedAt ? new Date(i.updatedAt) : new Date(),
      },
    })
  }

  const counts = {
    recommendations: await prisma.recommendation.count(),
    injuries: await prisma.injury.count(),
    bankrollPoints: await prisma.bankrollPoint.count(),
  }
  console.log('Seed complete:', counts)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())

// Ingest the current week's NFL schedule from ESPN into the Game table.
import { PrismaClient } from '@prisma/client'
import { fetchSchedule } from '../../lib/espn-nfl'

export async function ingestSchedule(prisma: PrismaClient): Promise<void> {
  const app = await prisma.appState.findFirst()
  const season = app?.season ?? String(new Date().getFullYear())
  const week = app?.currentWeek ?? 1

  const games = await fetchSchedule(season, week)
  for (const g of games) {
    await prisma.game.upsert({
      where: { espnId: g.espnId },
      update: {
        season: g.season, week: g.week, gameDate: g.gameDate, kickoff: g.kickoff,
        homeAbbr: g.homeAbbr, awayAbbr: g.awayAbbr, status: g.status,
      },
      create: {
        espnId: g.espnId, season: g.season, week: g.week, gameDate: g.gameDate,
        kickoff: g.kickoff, homeAbbr: g.homeAbbr, awayAbbr: g.awayAbbr, status: g.status,
      },
    })
  }
  console.log(`Schedule ingested: ${games.length} games for ${season} week ${week}.`)
}

if (require.main === module) {
  const prisma = new PrismaClient()
  ingestSchedule(prisma)
    .catch((e) => { console.error(e); process.exit(1) })
    .finally(() => prisma.$disconnect())
}

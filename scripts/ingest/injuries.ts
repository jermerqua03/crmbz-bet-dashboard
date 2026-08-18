// Ingest current NFL injuries from ESPN into the Injury table.
// Focuses on skill positions (QB/RB/WR/TE) with a bettable status. Idempotent: replaces the set.
import { PrismaClient } from '@prisma/client'
import { fetchInjuries, mapInjuryStatus } from '../../lib/espn-nfl'

const SKILL = new Set(['QB', 'RB', 'WR', 'TE'])

// Lightweight heuristic prop-impact note (LLM enrichment can replace this later).
function propImpact(player: string, team: string, pos: string, status: string): string | null {
  if (status === 'QUESTIONABLE') {
    return `Monitor — if ${player} is limited or sits, ${team} ${pos} snaps/targets redistribute.`
  }
  const who =
    pos === 'WR' || pos === 'TE' ? 'target share'
    : pos === 'RB' ? 'carries & pass-down work'
    : pos === 'QB' ? 'the whole passing game'
    : 'usage'
  return `${player} ${status} — ${who} shifts to teammates; look at replacement ${team} ${pos} props.`
}

export async function ingestInjuries(prisma: PrismaClient): Promise<void> {
  const raw = await fetchInjuries()
  const mapped = raw
    .map((r) => ({ ...r, status: mapInjuryStatus(r.statusRaw) }))
    .filter((r) => r.status && SKILL.has(r.position) && r.teamAbbr && r.player)

  await prisma.injury.deleteMany({})
  for (const r of mapped) {
    await prisma.injury.create({
      data: {
        player: r.player,
        team: r.teamAbbr,
        position: r.position,
        status: r.status as string,
        detail: r.detail.slice(0, 500),
        propImpact: propImpact(r.player, r.teamAbbr, r.position, r.status as string),
        source: 'ESPN',
        updatedAt: new Date(r.date),
      },
    })
  }
  const byStatus = mapped.reduce((acc: Record<string, number>, r) => {
    acc[r.status as string] = (acc[r.status as string] || 0) + 1
    return acc
  }, {})
  console.log(`Injuries ingested: ${mapped.length} skill-position (of ${raw.length} league-wide).`, byStatus)
}

if (require.main === module) {
  const prisma = new PrismaClient()
  ingestInjuries(prisma)
    .catch((e) => { console.error(e); process.exit(1) })
    .finally(() => prisma.$disconnect())
}

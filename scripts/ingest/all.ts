// Runs all ingest jobs in sequence against one Prisma connection.
// This is the command the Railway cron service executes on a schedule.
import { PrismaClient } from '@prisma/client'
import { ingestSchedule } from './schedule'
import { ingestInjuries } from './injuries'
import { ingestOdds } from './odds'

async function main() {
  const prisma = new PrismaClient()
  const started = new Date().toISOString()
  console.log(`[ingest] start ${started}`)
  for (const [name, fn] of [
    ['schedule', ingestSchedule],
    ['injuries', ingestInjuries],
    ['odds', ingestOdds],
  ] as const) {
    try {
      await fn(prisma)
    } catch (e) {
      console.error(`[ingest] ${name} failed:`, (e as Error).message)
    }
  }
  await prisma.$disconnect()
  console.log('[ingest] done')
}

main()

// Runs all ingest jobs in sequence against one Prisma connection.
// This is the command the Railway cron service executes on a schedule.
import { PrismaClient } from '@prisma/client'
import { ingestSchedule } from './schedule'
import { ingestInjuries } from './injuries'

async function main() {
  const prisma = new PrismaClient()
  const started = new Date().toISOString()
  console.log(`[ingest] start ${started}`)
  try {
    await ingestSchedule(prisma)
  } catch (e) {
    console.error('[ingest] schedule failed:', (e as Error).message)
  }
  try {
    await ingestInjuries(prisma)
  } catch (e) {
    console.error('[ingest] injuries failed:', (e as Error).message)
  }
  await prisma.$disconnect()
  console.log('[ingest] done')
}

main()

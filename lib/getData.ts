import fs from 'fs'
import { DashboardData } from '@/types'
import { FALLBACK_DATA } from './fallbackData'

export async function getData(): Promise<DashboardData> {
  try {
    const raw = fs.readFileSync(
      '/Users/jermerqua02/.openclaw/workspace/gamble-sim/dashboard-data.json',
      'utf8'
    )
    return JSON.parse(raw) as DashboardData
  } catch {
    return FALLBACK_DATA
  }
}

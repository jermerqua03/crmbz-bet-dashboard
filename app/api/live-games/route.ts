import { NextRequest, NextResponse } from 'next/server'
import { fetchLiveGamesForSports } from '@/lib/espn'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const sportsParam = req.nextUrl.searchParams.get('sports') || ''
  const sports = sportsParam
    ? sportsParam.split(',').map(s => s.trim().toUpperCase())
    : ['NBA', 'MLB', 'NFL', 'NHL']

  try {
    const games = await fetchLiveGamesForSports(sports)
    return NextResponse.json(games, {
      headers: { 'Cache-Control': 'no-store' },
    })
  } catch {
    return NextResponse.json([])
  }
}

export const SPORT_PATHS: Record<string, string> = {
  NBA: 'basketball/nba',
  MLB: 'baseball/mlb',
  NFL: 'football/nfl',
  NHL: 'hockey/nhl',
}

export interface ESPNPlayerStat {
  name: string      // "N. Jokic"
  fullName: string  // "Nikola Jokic"
  stats: Record<string, string> // { "reb": "11", "pts": "24", ... }
}

export interface ESPNGame {
  id: string
  sport: string
  status: 'pre' | 'in' | 'post'
  statusDetail: string  // "Q3 4:12", "Final", "7:30 PM ET"
  period: number
  clock: string
  homeTeam: string     // "Denver Nuggets"
  homeAbbr: string     // "DEN"
  homeScore: number
  awayTeam: string
  awayAbbr: string
  awayScore: number
  playerStats: ESPNPlayerStat[]
}

export async function fetchLiveGamesForSports(sports: string[]): Promise<ESPNGame[]> {
  const results = await Promise.allSettled(
    sports.filter(s => SPORT_PATHS[s]).map(s => fetchScoreboard(s))
  )
  return results.flatMap(r => r.status === 'fulfilled' ? r.value : [])
}

async function fetchScoreboard(sport: string): Promise<ESPNGame[]> {
  const path = SPORT_PATHS[sport]
  const res = await fetch(
    `https://site.api.espn.com/apis/site/v2/sports/${path}/scoreboard`,
    { cache: 'no-store' }
  )
  if (!res.ok) return []

  const data = await res.json()
  const events: any[] = data.events || []
  const games: ESPNGame[] = []

  for (const event of events) {
    const comp = event.competitions?.[0]
    if (!comp) continue

    const statusType = event.status?.type
    const state: 'pre' | 'in' | 'post' = statusType?.state || 'pre'

    const home = comp.competitors?.find((c: any) => c.homeAway === 'home')
    const away = comp.competitors?.find((c: any) => c.homeAway === 'away')
    if (!home || !away) continue

    const game: ESPNGame = {
      id: event.id,
      sport,
      status: state,
      statusDetail: statusType?.shortDetail || statusType?.description || '',
      period: event.status?.period || 0,
      clock: event.status?.displayClock || '',
      homeTeam: home.team?.displayName || home.team?.name || '',
      homeAbbr: home.team?.abbreviation || '',
      homeScore: parseInt(home.score || '0', 10),
      awayTeam: away.team?.displayName || away.team?.name || '',
      awayAbbr: away.team?.abbreviation || '',
      awayScore: parseInt(away.score || '0', 10),
      playerStats: [],
    }

    // Fetch box scores for live AND finished games (needed for prop resolution)
    if (state === 'in' || state === 'post') {
      game.playerStats = await fetchBoxScoreStats(path, event.id).catch(() => [])
    }

    games.push(game)
  }

  return games
}

async function fetchBoxScoreStats(path: string, eventId: string): Promise<ESPNPlayerStat[]> {
  const res = await fetch(
    `https://site.api.espn.com/apis/site/v2/sports/${path}/summary?event=${eventId}`,
    { cache: 'no-store' }
  )
  if (!res.ok) return []

  const data = await res.json()
  const players: ESPNPlayerStat[] = []

  for (const teamSection of data.boxscore?.players || []) {
    for (const statGroup of teamSection.statistics || []) {
      const keys: string[] = (statGroup.keys || []).map((k: string) => k.toLowerCase())
      for (const entry of statGroup.athletes || []) {
        const athlete = entry.athlete
        if (!athlete) continue

        const statRecord: Record<string, string> = {}
        ;(entry.stats || []).forEach((val: string, i: number) => {
          if (keys[i]) statRecord[keys[i]] = val
        })

        players.push({
          name: athlete.shortName || athlete.displayName || '',
          fullName: athlete.displayName || athlete.shortName || '',
          stats: statRecord,
        })
      }
    }
  }

  return players
}

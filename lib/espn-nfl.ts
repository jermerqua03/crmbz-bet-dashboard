// ESPN NFL fetchers (public API, no key). Used by ingest scripts and, later, the projection engine.

const BASE = 'https://site.api.espn.com/apis/site/v2/sports/football/nfl'

export type EspnInjury = {
  espnId: string
  player: string
  position: string
  teamAbbr: string
  statusRaw: string
  detail: string
  longComment: string
  date: string
}

function positionOf(athlete: any): string {
  const p = athlete?.position
  if (!p) return '?'
  if (typeof p === 'string') return p
  return p.abbreviation || p.name || '?'
}

// All current NFL injuries across the league, flattened per player.
export async function fetchInjuries(): Promise<EspnInjury[]> {
  const res = await fetch(`${BASE}/injuries`, { cache: 'no-store' })
  if (!res.ok) throw new Error(`ESPN injuries HTTP ${res.status}`)
  const data = await res.json()
  const out: EspnInjury[] = []
  for (const team of data.injuries || []) {
    for (const it of team.injuries || []) {
      const ath = it.athlete || {}
      out.push({
        espnId: String(it.id ?? ath.id ?? `${ath.displayName}-${it.date}`),
        player: ath.displayName || `${ath.firstName ?? ''} ${ath.lastName ?? ''}`.trim(),
        position: positionOf(ath),
        teamAbbr: ath.team?.abbreviation || '',
        statusRaw: it.status || ath.status?.name || 'Unknown',
        detail: it.shortComment || it.longComment || '',
        longComment: it.longComment || '',
        date: it.date || new Date().toISOString(),
      })
    }
  }
  return out
}

export type EspnGame = {
  espnId: string
  season: string
  week: number
  gameDate: string
  kickoff: string
  homeAbbr: string
  awayAbbr: string
  status: string
}

// Schedule for a given season/week (seasontype 2 = regular season).
export async function fetchSchedule(seasonYear: string, week: number, seasontype = 2): Promise<EspnGame[]> {
  const url = `${BASE}/scoreboard?seasontype=${seasontype}&week=${week}&dates=${seasonYear}`
  const res = await fetch(url, { cache: 'no-store' })
  if (!res.ok) throw new Error(`ESPN scoreboard HTTP ${res.status}`)
  const data = await res.json()
  const games: EspnGame[] = []
  for (const ev of data.events || []) {
    const comp = ev.competitions?.[0]
    if (!comp) continue
    const home = comp.competitors?.find((c: any) => c.homeAway === 'home')
    const away = comp.competitors?.find((c: any) => c.homeAway === 'away')
    if (!home || !away) continue
    games.push({
      espnId: String(ev.id),
      season: String(data.season?.year ?? seasonYear),
      week: data.week?.number ?? week,
      gameDate: (ev.date || '').slice(0, 10),
      kickoff: ev.date || '',
      homeAbbr: home.team?.abbreviation || '',
      awayAbbr: away.team?.abbreviation || '',
      status: ev.status?.type?.state || 'pre',
    })
  }
  return games
}

// Map ESPN's status vocabulary to our InjuryStatus enum. Returns null to skip (e.g. Active).
export function mapInjuryStatus(raw: string): 'OUT' | 'IR' | 'DOUBTFUL' | 'QUESTIONABLE' | null {
  const s = raw.toLowerCase()
  if (s.includes('injured reserve') || s === 'ir') return 'IR'
  if (s.includes('suspension')) return 'OUT'
  if (s.includes('out')) return 'OUT'
  if (s.includes('doubtful')) return 'DOUBTFUL'
  if (s.includes('questionable')) return 'QUESTIONABLE'
  return null // Active / Probable / Unknown -> not surfaced
}

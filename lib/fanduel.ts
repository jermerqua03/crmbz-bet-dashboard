// FanDuel (Tennessee) sportsbook reader — unofficial public JSON API.
// Cracks the odds source for NFL player props (incl. alternate-line ladders).
// Player props only post ~game week; until then this returns core markets only.

const AK = 'FhMFpcPWXMeyZxOx'
const TN_BASE = 'https://sbapi.tn.sportsbook.fanduel.com/api'
const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36'

async function fdGet(path: string): Promise<any> {
  const url = `${TN_BASE}/${path}${path.includes('?') ? '&' : '?'}_ak=${AK}&timezone=America%2FNew_York`
  const res = await fetch(url, {
    headers: { 'User-Agent': UA, Accept: 'application/json' },
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(`FanDuel HTTP ${res.status} for ${path}`)
  return res.json()
}

export type FdGame = { eventId: string; name: string; openDate: string; away: string; home: string }

// Upcoming NFL games with their FanDuel eventIds.
export async function fetchNflGames(): Promise<FdGame[]> {
  const data = await fdGet('content-managed-page?page=CUSTOM&customPageId=nfl')
  const events = data?.attachments?.events ?? {}
  const games: FdGame[] = []
  for (const e of Object.values<any>(events)) {
    const name: string = e.name ?? ''
    if (!name.includes('@')) continue // skip futures/specials
    const [away, home] = name.split('@').map((s) => s.trim())
    games.push({ eventId: String(e.eventId), name, openDate: e.openDate ?? '', away, home })
  }
  return games
}

export type FdSelection = {
  marketType: string
  marketName: string
  runnerName: string
  isPlayer: boolean
  line: number | null
  americanOdds: number | null
}

// Generic player-prop extractor — works for any sport (validated on live data).
export async function fetchEventSelections(eventId: string): Promise<FdSelection[]> {
  const data = await fdGet(`event-page?eventId=${eventId}`)
  const markets = data?.attachments?.markets ?? {}
  const out: FdSelection[] = []
  for (const m of Object.values<any>(markets)) {
    for (const r of m.runners ?? []) {
      const odds = r?.winRunnerOdds?.americanDisplayOdds?.americanOdds
      out.push({
        marketType: m.marketType ?? '',
        marketName: m.marketName ?? '',
        runnerName: r.runnerName ?? '',
        isPlayer: !!r.isPlayerSelection,
        line: typeof r.handicap === 'number' ? r.handicap : null,
        americanOdds: typeof odds === 'number' ? odds : null,
      })
    }
  }
  return out
}

// Map a FanDuel NFL market name to our canonical marketKey (null = not a prop we track).
export function classifyNflMarket(marketName: string): { marketKey: string; market: string } | null {
  const n = marketName.toLowerCase()
  const alt = /alt(ernate)?/.test(n)
  const tag = (base: string, label: string) => ({ marketKey: alt ? `${base}_alternate` : base, market: label })
  if (/pass(ing)? yards/.test(n)) return tag('player_pass_yds', 'Passing Yards')
  if (/rush(ing)? yards/.test(n)) return tag('player_rush_yds', 'Rushing Yards')
  if (/receiving yards/.test(n)) return tag('player_reception_yds', 'Receiving Yards')
  if (/receptions/.test(n)) return tag('player_receptions', 'Receptions')
  if (/pass(ing)? touchdowns|pass tds/.test(n)) return tag('player_pass_tds', 'Passing TDs')
  if (/rush(ing)? \+ rec(eiving)? yards|rush.*rec.*yards/.test(n)) return tag('player_rush_reception_yds', 'Rush + Rec Yards')
  if (/anytime touchdown|any time touchdown|anytime td/.test(n)) return { marketKey: 'player_anytime_td', market: 'Anytime TD' }
  if (/pass(ing)? attempts/.test(n)) return tag('player_pass_attempts', 'Pass Attempts')
  if (/rush(ing)? attempts|carries/.test(n)) return tag('player_rush_attempts', 'Rush Attempts')
  return null
}

// Extract the player name from a FanDuel prop market/runner.
// FanDuel names props like "Josh Allen - Passing Yards" (player in marketName),
// or the player is the runnerName for markets like "Anytime Touchdown Scorer".
export function playerFromSelection(s: FdSelection): string | null {
  if (s.marketName.includes(' - ')) return s.marketName.split(' - ')[0].trim()
  if (s.isPlayer && s.runnerName && !/^(over|under|yes|no)$/i.test(s.runnerName)) return s.runnerName.trim()
  return null
}

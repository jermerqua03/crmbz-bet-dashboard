import { ESPNGame } from './espn'

// Maps stat keywords in bet descriptions → ESPN box score stat keys
const STAT_PATTERNS: [RegExp, string, string][] = [
  // pattern, espnKey, displayLabel
  [/\bpts?\b|\bpoints?\b/i,        'pts',  'PTS'],
  [/\breb(ounds?)?\b|\btrb\b/i,    'reb',  'REB'],
  [/\bast\b|\bassists?\b/i,        'ast',  'AST'],
  [/\b3pm\b|\b3-?pt\b|\bthrees?\b|\btreys?\b/i, '3pt', '3PM'],
  [/\bstl\b|\bsteals?\b/i,         'stl',  'STL'],
  [/\bblk\b|\bblocks?\b/i,         'blk',  'BLK'],
  [/\bto\b|\bturnovers?\b/i,       'to',   'TO'],
  // MLB
  [/\bk'?s?\b|\bstrikeouts?\b|\bso\b/i, 'so', 'K'],
  [/\bhr\b|\bhome.?runs?\b/i,      'hr',   'HR'],
  [/\brbi\b/i,                     'rbi',  'RBI'],
  [/\bhits?\b/i,                   'h',    'H'],
  // NHL
  [/\bgoals?\b/i,                  'g',    'G'],
  [/\bassists?\b/i,                'a',    'A'],
]

// Common words that are NOT team or player names
const SKIP_WORDS = new Set([
  'over', 'under', 'win', 'wins', 'ml', 'moneyline', 'spread',
  'and', 'the', 'at', 'vs', 'or', 'on', 'in', 'a', 'an',
  '+', '-', 'game', 'total',
])

export interface LiveMatchResult {
  game: ESPNGame | null
  playerStat: {
    label: string
    current: number
    target: number
    direction: 'over' | 'under'
    pace: 'hitting' | 'missing' | 'unknown'
  } | null
}

export function matchBetToGame(description: string, games: ESPNGame[]): LiveMatchResult {
  if (!games.length) return { game: null, playerStat: null }

  // Try player prop match first (more specific)
  const propParse = parsePropBet(description)
  if (propParse) {
    const { playerName, direction, target, statKey, statLabel } = propParse
    for (const game of games) {
      const player = findPlayer(playerName, game.playerStats)
      if (player) {
        const rawVal = player.stats[statKey] ?? player.stats[statKey.toLowerCase()]
        const current = rawVal ? parseFloat(rawVal) : NaN
        return {
          game,
          playerStat: isNaN(current) ? null : {
            label: statLabel,
            current,
            target,
            direction,
            pace: direction === 'over' ? (current >= target ? 'hitting' : 'missing') : (current <= target ? 'hitting' : 'missing'),
          },
        }
      }
    }
  }

  // Fall back to team name match (for ML, spread, game-winner bets)
  const teamGame = findGameByTeam(description, games)
  return { game: teamGame, playerStat: null }
}

// ─── helpers ─────────────────────────────────────────────────────────────────

interface PropParse {
  playerName: string
  direction: 'over' | 'under'
  target: number
  statKey: string
  statLabel: string
}

function parsePropBet(description: string): PropParse | null {
  // "[Player Name] Over/Under X.X [StatType]"
  const m = description.match(
    /^(.+?)\s+(over|under|o|u)\s+([\d.]+)\s+(.+)$/i
  )
  if (!m) return null

  const [, playerPart, dirWord, threshStr, statPart] = m
  const direction: 'over' | 'under' = dirWord.toLowerCase().startsWith('o') ? 'over' : 'under'
  const target = parseFloat(threshStr)
  if (isNaN(target)) return null

  // Resolve stat
  for (const [pattern, key, label] of STAT_PATTERNS) {
    if (pattern.test(statPart)) {
      return { playerName: playerPart.trim(), direction, target, statKey: key, statLabel: label }
    }
  }

  return null
}

function findPlayer(name: string, playerStats: ESPNGame['playerStats']) {
  const needle = name.toLowerCase()
  // Try exact last-name match first, then broader substring
  for (const p of playerStats) {
    const full = p.fullName.toLowerCase()
    const lastName = full.split(' ').pop() || ''
    if (lastName === needle || full === needle) return p
  }
  for (const p of playerStats) {
    const full = p.fullName.toLowerCase()
    const short = p.name.toLowerCase()
    if (full.includes(needle) || short.includes(needle) || needle.includes(full.split(' ').pop() || '~~~')) return p
  }
  return null
}

function findGameByTeam(description: string, games: ESPNGame[]): ESPNGame | null {
  const words = description
    .split(/\s+/)
    .map(w => w.replace(/[^a-zA-Z]/g, '').toLowerCase())
    .filter(w => w.length > 2 && !SKIP_WORDS.has(w))

  for (const game of games) {
    const teamTokens = [
      ...game.homeTeam.toLowerCase().split(/\s+/),
      ...game.awayTeam.toLowerCase().split(/\s+/),
      game.homeAbbr.toLowerCase(),
      game.awayAbbr.toLowerCase(),
    ]
    for (const word of words) {
      if (teamTokens.some(t => t === word || t.startsWith(word) || word.startsWith(t))) {
        return game
      }
    }
  }

  return null
}

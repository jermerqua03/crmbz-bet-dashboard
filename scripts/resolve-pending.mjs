#!/usr/bin/env node
// resolve-pending.mjs
// Reads dashboard-data.json, resolves any PENDING bets via ESPN APIs,
// recalculates all aggregate stats, and writes back.
// SAFETY: never removes bets, only updates PENDING result/pnl fields.

import { readFileSync, writeFileSync } from 'fs'

const DATA_FILE = process.argv[2]
if (!DATA_FILE) { console.error('Usage: resolve-pending.mjs <path-to-dashboard-data.json>'); process.exit(1) }

const SPORT_PATHS = {
  NBA: 'basketball/nba',
  MLB: 'baseball/mlb',
  NFL: 'football/nfl',
  NHL: 'hockey/nhl',
}

const ESPN_KEY_ALIASES = {
  points: 'pts', rebounds: 'reb', assists: 'ast', steals: 'stl',
  blocks: 'blk', turnovers: 'to', minutes: 'min',
  strikeouts: 'so', homeruns: 'hr', runs: 'r', hits: 'h', rbis: 'rbi', walks: 'bb',
  goals: 'g', plusminus: '+/-',
}
const ESPN_COMPOUND_KEYS = {
  'threepointfieldgoalsmade-threepointfieldgoalsattempted': '3pm',
  'fieldgoalsmade-fieldgoalsattempted': 'fgm',
  'freethrowsmade-freethrowsattempted': 'ftm',
}

const STAT_PATTERNS = [
  [/\bpts?\b|\bpoints?\b/i, 'pts'], [/\breb(ounds?)?\b|\btrb\b/i, 'reb'],
  [/\bast\b|\bassists?\b/i, 'ast'], [/\b3pm\b|\b3-?pt\b|\bthrees?\b/i, '3pt'],
  [/\bstl\b|\bsteals?\b/i, 'stl'], [/\bblk\b|\bblocks?\b/i, 'blk'],
  [/\bto\b|\bturnovers?\b/i, 'to'],
  [/\bk'?s?\b|\bstrikeouts?\b|\bso\b/i, 'so'], [/\bhr\b|\bhome.?runs?\b/i, 'hr'],
  [/\brbi\b/i, 'rbi'], [/\bhits?\b/i, 'h'],
  [/\bgoals?\b/i, 'g'], [/\bassists?\b/i, 'a'],
]

const SKIP_WORDS = new Set([
  'over','under','win','wins','ml','moneyline','spread',
  'and','the','at','vs','or','on','in','a','an','+','-','game','total',
])

// ── ESPN fetch helpers ──────────────────────────────────────────────────────

async function fetchScoreboard(sport, dateStr) {
  const path = SPORT_PATHS[sport]
  if (!path) return []
  const url = `https://site.api.espn.com/apis/site/v2/sports/${path}/scoreboard?dates=${dateStr}`
  try {
    const res = await fetch(url)
    if (!res.ok) return []
    const data = await res.json()
    const games = []
    for (const event of data.events || []) {
      const comp = event.competitions?.[0]
      if (!comp) continue
      const st = event.status?.type
      const state = st?.state || 'pre'
      const home = comp.competitors?.find(c => c.homeAway === 'home')
      const away = comp.competitors?.find(c => c.homeAway === 'away')
      if (!home || !away) continue
      const game = {
        id: event.id, sport, status: state,
        homeTeam: home.team?.displayName || '', homeAbbr: home.team?.abbreviation || '',
        homeScore: parseInt(home.score || '0', 10),
        awayTeam: away.team?.displayName || '', awayAbbr: away.team?.abbreviation || '',
        awayScore: parseInt(away.score || '0', 10),
        playerStats: [],
      }
      if (state === 'in' || state === 'post') {
        game.playerStats = await fetchBoxScore(path, event.id).catch(() => [])
      }
      games.push(game)
    }
    return games
  } catch { return [] }
}

async function fetchBoxScore(path, eventId) {
  const res = await fetch(`https://site.api.espn.com/apis/site/v2/sports/${path}/summary?event=${eventId}`)
  if (!res.ok) return []
  const data = await res.json()
  const players = []
  for (const teamSection of data.boxscore?.players || []) {
    for (const statGroup of teamSection.statistics || []) {
      const rawKeys = statGroup.keys || []
      for (const entry of statGroup.athletes || []) {
        const athlete = entry.athlete
        if (!athlete) continue
        const stats = {}
        ;(entry.stats || []).forEach((val, i) => {
          const rawKey = rawKeys[i]
          if (!rawKey) return
          const k = rawKey.toLowerCase()
          stats[k] = val
          if (ESPN_KEY_ALIASES[k]) stats[ESPN_KEY_ALIASES[k]] = val
          if (ESPN_COMPOUND_KEYS[k]) stats[ESPN_COMPOUND_KEYS[k]] = val.split('-')[0] || '0'
        })
        players.push({ name: athlete.shortName || '', fullName: athlete.displayName || '', stats })
      }
    }
  }
  return players
}

// ── Bet matching helpers (mirrors matchBet.ts logic) ────────────────────────

function findPlayer(name, playerStats) {
  const needle = name.toLowerCase()
  for (const p of playerStats) {
    const full = p.fullName.toLowerCase()
    const last = full.split(' ').pop() || ''
    if (last === needle || full === needle) return p
  }
  for (const p of playerStats) {
    const full = p.fullName.toLowerCase()
    const short = p.name.toLowerCase()
    if (full.includes(needle) || short.includes(needle) || needle.includes(full.split(' ').pop() || '~~~')) return p
  }
  if (needle.length >= 4) {
    const prefix = needle.substring(0, 4)
    for (const p of playerStats) {
      const last = (p.fullName.toLowerCase().split(' ').pop() || '')
      if (last.startsWith(prefix)) return p
    }
  }
  return null
}

function findGameByTeam(desc, games) {
  const words = desc.split(/\s+/).map(w => w.replace(/[^a-zA-Z]/g, '').toLowerCase()).filter(w => w.length > 2 && !SKIP_WORDS.has(w))
  for (const game of games) {
    const tokens = [...game.homeTeam.toLowerCase().split(/\s+/), ...game.awayTeam.toLowerCase().split(/\s+/), game.homeAbbr.toLowerCase(), game.awayAbbr.toLowerCase()]
    for (const word of words) {
      if (tokens.some(t => t === word || t.startsWith(word) || word.startsWith(t))) return game
    }
  }
  return null
}

function resolveTeamOutcome(desc, game) {
  const words = desc.split(/\s+/).map(w => w.replace(/[^a-zA-Z]/g, '').toLowerCase()).filter(w => w.length > 2 && !SKIP_WORDS.has(w))
  const homeTokens = [...game.homeTeam.toLowerCase().split(/\s+/), game.homeAbbr.toLowerCase()]
  const awayTokens = [...game.awayTeam.toLowerCase().split(/\s+/), game.awayAbbr.toLowerCase()]
  let side = null
  for (const word of words) {
    if (homeTokens.some(t => t === word || t.startsWith(word) || word.startsWith(t))) { side = 'home'; break }
    if (awayTokens.some(t => t === word || t.startsWith(word) || word.startsWith(t))) { side = 'away'; break }
  }
  if (!side) return null
  const won = side === 'home' ? game.homeScore > game.awayScore : game.awayScore > game.homeScore
  return won ? 'WIN' : 'LOSS'
}

function parsePropBet(desc) {
  const m = desc.match(/^(.+?)\s+(over|under|o|u)\s+([\d.]+)(?:\s+(.+))?$/i)
  if (!m) return null
  const [, playerPart, dirWord, threshStr, rawStatPart = ''] = m
  const direction = dirWord.toLowerCase().startsWith('o') ? 'over' : 'under'
  const target = parseFloat(threshStr)
  if (isNaN(target)) return null
  const statPart = rawStatPart.replace(/\bparlay\b/gi, '').trim()
  for (const [pattern, key] of STAT_PATTERNS) {
    if (pattern.test(statPart)) return { playerName: playerPart.trim(), direction, target, statKey: key }
  }
  if (!statPart) return { playerName: playerPart.trim(), direction, target, statKey: 'pts' }
  return null
}

function calcPnl(result, stake, oddsStr) {
  if (result === 'LOSS') return -stake
  const odds = parseFloat(oddsStr.replace('+', ''))
  if (odds >= 0) return parseFloat((stake * (odds / 100)).toFixed(2))
  return parseFloat((stake * (100 / Math.abs(odds))).toFixed(2))
}

function resolveSingleBet(desc, games, stake, odds) {
  // Parlay
  const isParlay = /\bparlay\b/i.test(desc) || (desc.includes(' + ') && !parsePropBet(desc))
  if (isParlay) {
    const cleaned = desc.replace(/\s*\bparlay\b\s*/i, ' ').trim()
    const legs = cleaned.split(/\s+\+\s+/)
    const legResults = []
    for (const leg of legs) {
      const prop = parsePropBet(leg.trim())
      if (prop) {
        let found = false
        for (const game of games) {
          const player = findPlayer(prop.playerName, game.playerStats)
          if (player && game.status === 'post') {
            const val = parseFloat(player.stats[prop.statKey] ?? player.stats[prop.statKey.toLowerCase()] ?? 'NaN')
            if (!isNaN(val)) {
              const hit = prop.direction === 'over' ? val >= prop.target : val <= prop.target
              legResults.push(hit ? 'WIN' : 'LOSS')
              found = true; break
            }
          }
        }
        if (!found) legResults.push('UNKNOWN')
      } else {
        const teamGame = findGameByTeam(leg.trim(), games)
        if (teamGame && teamGame.status === 'post') {
          legResults.push(resolveTeamOutcome(leg.trim(), teamGame) ?? 'UNKNOWN')
        } else {
          legResults.push('UNKNOWN')
        }
      }
    }
    if (legResults.some(r => r === 'UNKNOWN')) return null // not all legs resolved
    if (legResults.every(r => r === 'WIN')) return { result: 'WIN', pnl: calcPnl('WIN', stake, odds) }
    return { result: 'LOSS', pnl: calcPnl('LOSS', stake, odds) }
  }

  // Single prop
  const prop = parsePropBet(desc)
  if (prop) {
    for (const game of games) {
      if (game.status !== 'post') continue
      const player = findPlayer(prop.playerName, game.playerStats)
      if (player) {
        const val = parseFloat(player.stats[prop.statKey] ?? player.stats[prop.statKey.toLowerCase()] ?? 'NaN')
        if (!isNaN(val)) {
          const hit = prop.direction === 'over' ? val >= prop.target : val <= prop.target
          const result = hit ? 'WIN' : 'LOSS'
          return { result, pnl: calcPnl(result, stake, odds) }
        }
      }
    }
    return null
  }

  // Team ML
  const teamGame = findGameByTeam(desc, games)
  if (teamGame && teamGame.status === 'post') {
    const result = resolveTeamOutcome(desc, teamGame)
    if (result) return { result, pnl: calcPnl(result, stake, odds) }
  }
  return null
}

// ── Main ────────────────────────────────────────────────────────────────────

async function main() {
  const raw = readFileSync(DATA_FILE, 'utf-8')
  const data = JSON.parse(raw)

  // Safety: snapshot existing bet count
  const origBetCount = data.bets?.length ?? 0

  const pendingBets = (data.bets || []).filter(b => b.result === 'PENDING')
  if (pendingBets.length === 0) {
    console.log('No PENDING bets to resolve.')
    return
  }

  // Collect unique dates and sports from pending bets
  const dates = [...new Set(pendingBets.map(b => b.date))]
  const sports = [...new Set(pendingBets.map(b => b.sport))]

  console.log(`Resolving ${pendingBets.length} PENDING bet(s) across ${dates.join(', ')}...`)

  // Fetch all relevant games
  const allGames = []
  for (const sport of sports) {
    for (const date of dates) {
      const games = await fetchScoreboard(sport, date.replace(/-/g, ''))
      allGames.push(...games)
    }
  }

  // Also fetch today's games in case dates are off by timezone
  const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  for (const sport of sports) {
    const games = await fetchScoreboard(sport, todayStr)
    allGames.push(...games)
  }

  // Dedupe by game id
  const seen = new Set()
  const games = allGames.filter(g => seen.has(g.id) ? false : (seen.add(g.id), true))

  let resolved = 0
  for (const bet of data.bets) {
    if (bet.result !== 'PENDING') continue
    const outcome = resolveSingleBet(bet.description, games, bet.stake, bet.odds)
    if (outcome) {
      bet.result = outcome.result
      bet.pnl = outcome.pnl
      resolved++
      console.log(`  ${bet.description}: ${outcome.result} (${outcome.pnl >= 0 ? '+' : ''}${outcome.pnl})`)
    }
  }

  // Safety check: never lose bets
  if (data.bets.length < origBetCount) {
    console.error('SAFETY: bet count decreased! Aborting write.')
    process.exit(1)
  }

  // Recalculate aggregate stats from full bets array
  let wins = 0, losses = 0, totalPnl = 0, totalWagered = 0
  const sMap = new Map()
  for (const bet of data.bets) {
    totalWagered += bet.stake
    if (!sMap.has(bet.strategy)) sMap.set(bet.strategy, { bets: 0, resolved: 0, wins: 0, wagered: 0, pnl: 0 })
    const s = sMap.get(bet.strategy)
    s.bets++; s.wagered += bet.stake
    if (bet.result === 'WIN') { wins++; s.wins++; s.resolved++; totalPnl += bet.pnl; s.pnl += bet.pnl }
    else if (bet.result === 'LOSS') { losses++; s.resolved++; totalPnl += bet.pnl; s.pnl += bet.pnl }
  }

  data.wins = wins
  data.losses = losses
  data.winRate = (wins + losses) > 0 ? parseFloat(((wins / (wins + losses)) * 100).toFixed(1)) : 0
  data.netProfit = parseFloat(totalPnl.toFixed(2))
  data.roi = totalWagered > 0 ? parseFloat(((totalPnl / totalWagered) * 100).toFixed(1)) : 0
  data.currentBankroll = parseFloat((data.startingBankroll + totalPnl).toFixed(2))
  data.lastUpdated = new Date().toISOString()

  // Update strategies
  data.strategies = Array.from(sMap.entries()).map(([strategy, s]) => ({
    strategy, bets: s.bets,
    winRate: s.resolved > 0 ? parseFloat(((s.wins / s.resolved) * 100).toFixed(1)) : 0,
    wagered: s.wagered, pnl: parseFloat(s.pnl.toFixed(2)),
    roi: s.wagered > 0 ? parseFloat(((s.pnl / s.wagered) * 100).toFixed(1)) : 0,
  }))

  // Update bankrollHistory — add today if not already there
  const today = new Date().toISOString().slice(0, 10)
  const history = data.bankrollHistory || []
  const todayEntry = history.find(h => h.date === today)
  if (todayEntry) {
    todayEntry.bankroll = data.currentBankroll
  } else {
    history.push({ date: today, bankroll: data.currentBankroll })
  }
  data.bankrollHistory = history

  // Update todaysBets
  data.todaysBets = data.bets.filter(b => b.date === today)

  writeFileSync(DATA_FILE, JSON.stringify(data, null, 2) + '\n')
  console.log(`Resolved ${resolved}/${pendingBets.length} pending bets. Bankroll: $${data.currentBankroll}`)
}

main().catch(e => { console.error(e); process.exit(1) })

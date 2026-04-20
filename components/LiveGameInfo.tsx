'use client'
import { ESPNGame } from '@/lib/espn'

interface PlayerStatProps {
  label: string
  current: number
  target: number
  direction: 'over' | 'under'
  pace: 'hitting' | 'missing' | 'unknown'
}

interface Props {
  game: ESPNGame
  playerStat?: PlayerStatProps | null
  playerStats?: PlayerStatProps[]
  compact?: boolean  // true = AllBetsLog inline, false = TodaysBets expanded
}

export default function LiveGameInfo({ game, playerStat, playerStats, compact = false }: Props) {
  // Use playerStats array if provided, otherwise fall back to single playerStat
  const stats = playerStats && playerStats.length > 0 ? playerStats : (playerStat ? [playerStat] : [])
  const isLive = game.status === 'in'
  const isFinal = game.status === 'post'

  const scoreStr = `${game.awayAbbr} ${game.awayScore} — ${game.homeAbbr} ${game.homeScore}`

  if (compact) {
    return (
      <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
        {isLive && (
          <span className="px-1.5 py-0.5 bg-red-600 text-white rounded text-[9px] font-bold tracking-wider animate-pulse">
            LIVE
          </span>
        )}
        {isFinal && (
          <span className="px-1.5 py-0.5 bg-gray-700 text-gray-400 rounded text-[9px] font-bold tracking-wider">
            FINAL
          </span>
        )}
        <span className="text-[10px] font-mono text-gray-300">
          {game.awayAbbr} <b>{game.awayScore}</b> — {game.homeAbbr} <b>{game.homeScore}</b>
        </span>
        {isLive && game.statusDetail && (
          <span className="text-[9px] text-gray-500">{game.statusDetail}</span>
        )}
        {stats.map((s, i) => (
          <span key={i} className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
            s.pace === 'hitting'
              ? 'bg-green-900/60 text-green-400'
              : 'bg-gray-800 text-gray-400'
          }`}>
            {s.label} {s.current}
            <span className="text-gray-500 ml-0.5">
              / {s.direction === 'over' ? `${s.target}+` : `u${s.target}`}
            </span>
          </span>
        ))}
      </div>
    )
  }

  // Expanded view for TodaysBets
  return (
    <div className={`mt-2 rounded-md border px-3 py-2 text-xs ${
      isLive
        ? 'border-red-800/60 bg-red-950/20'
        : isFinal
        ? 'border-gray-800 bg-gray-900/40'
        : 'border-gray-800 bg-gray-900/20'
    }`}>
      <div className="flex items-center gap-2 flex-wrap">
        {isLive && (
          <span className="px-2 py-0.5 bg-red-600 text-white rounded text-[10px] font-bold tracking-widest animate-pulse">
            LIVE
          </span>
        )}
        {isFinal && (
          <span className="px-2 py-0.5 bg-gray-700 text-gray-400 rounded text-[10px] font-bold tracking-wider">
            FINAL
          </span>
        )}
        {!isLive && !isFinal && (
          <span className="px-2 py-0.5 bg-gray-800 text-gray-500 rounded text-[10px] font-bold">
            UPCOMING
          </span>
        )}

        <span className="font-mono text-white text-sm font-bold">
          {game.awayAbbr} {game.awayScore} — {game.homeAbbr} {game.homeScore}
        </span>

        {(isLive || isFinal) && game.statusDetail && (
          <span className="text-gray-400 text-[10px]">{game.statusDetail}</span>
        )}
      </div>

      {stats.map((s, i) => (
        <div key={i} className={`mt-1.5 flex items-center gap-2 text-[11px] font-mono font-bold ${
          s.pace === 'hitting' ? 'text-green-400' : 'text-gray-300'
        }`}>
          <span>{s.label}: {s.current}</span>
          <span className="text-gray-500 font-normal">
            {s.direction === 'over' ? `need >${s.target}` : `need <${s.target}`}
          </span>
          {s.pace === 'hitting' && isLive && (
            <span className="text-green-500 text-[9px] font-normal">✓ on pace</span>
          )}
          {s.pace === 'missing' && isLive && (
            <span className="text-red-400 text-[9px] font-normal">✗ needs more</span>
          )}
        </div>
      ))}

      {!playerStat && !isLive && !isFinal && (
        <div className="mt-0.5 text-[10px] text-gray-600">{game.statusDetail}</div>
      )}
    </div>
  )
}

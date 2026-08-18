'use client'
import { useState } from 'react'
import { PropRec, AltLine } from '@/types'

const TIER_LABEL: Record<number, string> = { 1: 'T1 · Core', 2: 'T2 · Value', 3: 'T3 · Parlay' }

function tierClasses(tier: number) {
  switch (tier) {
    case 1: return 'bg-emerald-900/40 text-emerald-300 border-emerald-800'
    case 2: return 'bg-sky-900/40 text-sky-300 border-sky-800'
    default: return 'bg-purple-900/40 text-purple-300 border-purple-800'
  }
}

function confidenceClasses(c: string) {
  if (c === 'HIGH') return 'text-emerald-400'
  if (c === 'MEDIUM') return 'text-yellow-400'
  return 'text-orange-400'
}

function edgeColor(edge: number) {
  if (edge >= 8) return 'text-emerald-400'
  if (edge >= 3) return 'text-yellow-400'
  if (edge >= 0) return 'text-slate-300'
  return 'text-red-400'
}

// A single recommendation card with an adjustable alt-line ladder.
function PropCard({ rec }: { rec: PropRec }) {
  // The recommended line is the default "selected" rung. Users can adjust across
  // the FanDuel alternate-line ladder and watch odds + our edge recompute.
  const ladder: AltLine[] = rec.altLines && rec.altLines.length
    ? rec.altLines
    : [{ line: rec.line, odds: rec.odds, hitProb: rec.hitProb, edge: rec.edge }]

  const defaultIdx = Math.max(
    0,
    ladder.findIndex((l) => l.line === rec.line),
  )
  const [selIdx, setSelIdx] = useState(defaultIdx === -1 ? 0 : defaultIdx)
  const sel = ladder[selIdx]
  const adjusted = sel.line !== rec.line

  return (
    <div className="rounded-lg border border-[#1a1a2e] bg-[#0d0d1a] p-4">
      {/* Header: matchup + tier */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-white truncate">{rec.player}</span>
            <span className="text-[10px] font-bold text-[#3b82f6] tracking-wider">{rec.position}</span>
          </div>
          <div className="text-[11px] text-[#64748b] mt-0.5">
            {rec.team} vs {rec.opponent}
            {rec.kickoff ? <span className="text-[#334155]"> · {rec.kickoff}</span> : null}
          </div>
        </div>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border tracking-widest ${tierClasses(rec.tier)}`}>
          {TIER_LABEL[rec.tier]}
        </span>
      </div>

      {/* The pick */}
      <div className="mt-3 flex items-baseline justify-between">
        <div className="text-slate-100 text-sm">
          <span className="text-[#94a3b8]">{rec.market}</span>{' '}
          <span className={`font-bold ${rec.side === 'OVER' ? 'text-emerald-400' : 'text-red-400'}`}>
            {rec.side === 'OVER' ? 'Over' : 'Under'} {sel.line}
          </span>{' '}
          <span className="text-slate-400 tabular-nums">{sel.odds}</span>
          {adjusted && <span className="ml-1 text-[9px] text-yellow-500 uppercase tracking-wider">adjusted</span>}
        </div>
        <div className="text-right">
          <div className={`text-lg font-bold tabular-nums ${edgeColor(sel.edge)}`}>
            {sel.edge >= 0 ? '+' : ''}{sel.edge.toFixed(1)}%
          </div>
          <div className="text-[9px] text-[#334155] uppercase tracking-wider">edge</div>
        </div>
      </div>

      {/* Model line: projection vs line + hit prob + confidence */}
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-[#4b5563]">
        <span><span className="text-[#334155] mr-1">PROJ</span><span className="text-slate-300 tabular-nums">{rec.projection}</span></span>
        <span><span className="text-[#334155] mr-1">HIT P</span><span className="text-slate-300 tabular-nums">{(sel.hitProb * 100).toFixed(0)}%</span></span>
        <span><span className="text-[#334155] mr-1">CONF</span><span className={`font-bold ${confidenceClasses(rec.confidence)}`}>{rec.confidence}</span></span>
      </div>

      {/* Adjustable alt-line ladder */}
      {ladder.length > 1 && (
        <div className="mt-3">
          <div className="text-[9px] text-[#334155] uppercase tracking-[0.2em] mb-1.5">Adjust line — FanDuel alt lines</div>
          <div className="flex flex-wrap gap-1.5">
            {ladder.map((l, i) => {
              const active = i === selIdx
              return (
                <button
                  key={l.line}
                  onClick={() => setSelIdx(i)}
                  className={`px-2 py-1 rounded border text-[10px] tabular-nums transition-colors ${
                    active
                      ? 'border-[#3b82f6] bg-[#3b82f6]/15 text-white'
                      : 'border-[#1a1a2e] bg-[#080810] text-[#64748b] hover:border-[#334155]'
                  }`}
                  title={`Hit ${(l.hitProb * 100).toFixed(0)}% · Edge ${l.edge >= 0 ? '+' : ''}${l.edge.toFixed(1)}%`}
                >
                  <span className="font-bold">{l.line}</span>
                  <span className={`ml-1 ${parseFloat(l.odds) > 0 ? 'text-emerald-400' : 'text-slate-400'}`}>{l.odds}</span>
                  <span className={`ml-1 ${edgeColor(l.edge)}`}>{l.edge >= 0 ? '+' : ''}{l.edge.toFixed(0)}%</span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Matchup rationale */}
      {rec.matchup && (
        <p className="mt-3 text-[11px] leading-snug text-[#8a94a6] border-t border-[#141422] pt-2">
          <span className="text-[#475569] uppercase tracking-wider text-[9px] mr-1">Matchup</span>
          {rec.matchup}
        </p>
      )}

      {/* Injury flag */}
      {rec.injuryFlag && (
        <p className="mt-1.5 text-[11px] leading-snug text-amber-300/90">
          <span className="mr-1">⚠</span>{rec.injuryFlag}
        </p>
      )}
    </div>
  )
}

export default function PropRecommendations({ recs, week }: { recs: PropRec[]; week?: number }) {
  const sorted = [...recs].sort((a, b) => a.tier - b.tier || b.edge - a.edge)

  return (
    <div className="bg-[#0a0a14] border border-[#1a1a2e] rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-[10px] font-bold tracking-[0.3em] uppercase text-[#4b5563]">
          🏈 Best Prop Plays{week ? ` · Week ${week}` : ''}
        </h2>
        <span className="text-[10px] text-[#334155] tabular-nums">
          {sorted.length} play{sorted.length !== 1 ? 's' : ''}
        </span>
      </div>

      {sorted.length === 0 ? (
        <p className="text-[#334155] text-xs text-center py-8">
          No recommendations yet — the analyzer runs weekly once lines are posted.
        </p>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
          {sorted.map((rec) => <PropCard key={rec.id} rec={rec} />)}
        </div>
      )}
    </div>
  )
}

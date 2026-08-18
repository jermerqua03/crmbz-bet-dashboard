'use client'
import { InjuryReport, InjuryStatus } from '@/types'

const STATUS_ORDER: Record<InjuryStatus, number> = {
  OUT: 0, IR: 1, DOUBTFUL: 2, QUESTIONABLE: 3, PROBABLE: 4, ACTIVE: 5,
}

function statusClasses(status: InjuryStatus) {
  switch (status) {
    case 'OUT':
    case 'IR':
      return 'bg-red-900/40 text-red-300 border-red-800'
    case 'DOUBTFUL':
      return 'bg-orange-900/40 text-orange-300 border-orange-800'
    case 'QUESTIONABLE':
      return 'bg-yellow-900/40 text-yellow-300 border-yellow-800'
    case 'PROBABLE':
      return 'bg-sky-900/40 text-sky-300 border-sky-800'
    default:
      return 'bg-emerald-900/40 text-emerald-300 border-emerald-800'
  }
}

function timeAgo(iso: string) {
  const t = Date.parse(iso)
  if (Number.isNaN(t)) return ''
  const mins = Math.round((Date.now() - t) / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.round(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.round(hrs / 24)}d ago`
}

export default function InjuryReportPanel({ reports }: { reports: InjuryReport[] }) {
  const sorted = [...reports].sort(
    (a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status] || a.team.localeCompare(b.team),
  )

  return (
    <div className="bg-[#0a0a14] border border-[#1a1a2e] rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-[10px] font-bold tracking-[0.3em] uppercase text-[#4b5563]">
          🩺 Injury &amp; News Watch
        </h2>
        <span className="text-[10px] text-[#334155] tabular-nums">
          {sorted.length} update{sorted.length !== 1 ? 's' : ''}
        </span>
      </div>

      {sorted.length === 0 ? (
        <p className="text-[#334155] text-xs text-center py-8">
          No injury updates right now. The watcher checks ESPN &amp; news daily.
        </p>
      ) : (
        <div className="space-y-2">
          {sorted.map((r) => (
            <div key={r.id} className="rounded-lg border border-[#1a1a2e] bg-[#0d0d1a] px-3 py-2.5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-100 truncate">{r.player}</span>
                    <span className="text-[10px] text-[#3b82f6] font-bold tracking-wider">{r.position}</span>
                    <span className="text-[10px] text-[#475569]">{r.team}</span>
                  </div>
                  <p className="text-[11px] text-[#8a94a6] leading-snug mt-1">{r.detail}</p>
                </div>
                <span className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded border tracking-widest ${statusClasses(r.status)}`}>
                  {r.status}
                </span>
              </div>

              {r.propImpact && (
                <p className="text-[11px] leading-snug text-amber-300/90 mt-1.5 border-t border-[#141422] pt-1.5">
                  <span className="text-[#475569] uppercase tracking-wider text-[9px] mr-1">Prop impact</span>
                  {r.propImpact}
                </p>
              )}

              <div className="flex items-center gap-2 mt-1 text-[9px] text-[#334155]">
                {r.source && <span>{r.source}</span>}
                {r.source && <span>·</span>}
                <span>{timeAgo(r.updatedAt)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

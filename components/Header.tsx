'use client'
import { DashboardData } from '../types'
export default function Header({ data }: { data: DashboardData }) {
  const up = data.netProfit >= 0
  return (
    <header className="w-full bg-black border-b border-gray-800 px-4 py-4 flex items-center justify-between">
      <div className="flex items-baseline gap-2">
        <span className="text-lg font-bold tracking-tight text-white">🏈 CRMBZ Football</span>
        <span className="text-[10px] text-gray-500 uppercase tracking-widest">
          NFL Props{data.currentWeek ? ` · Week ${data.currentWeek}` : ''}
        </span>
      </div>
      <div className="flex items-center gap-4">
        <span className={`text-2xl font-bold ${up ? 'text-green-400' : 'text-red-400'}`}>{`$${data.currentBankroll.toFixed(2)}`}</span>
        <span className={`text-xs px-2 py-1 rounded ${up ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'}`}>{up ? 'UP' : 'DOWN'}</span>
        <span className={`text-xs ml-4 font-bold ${data.roi > 0 ? 'text-green-400' : data.roi < 0 ? 'text-red-400' : 'text-gray-400'}`}>{data.roi >= 0 ? '+' : ''}{data.roi.toFixed(2)}% ROI</span>
      </div>
    </header>
  )
}

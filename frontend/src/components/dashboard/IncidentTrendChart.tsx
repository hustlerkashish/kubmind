import { useState } from 'react';
import { ChartDataPoint } from '@/services/mockTelemetryService';
import { Flame } from 'lucide-react';

interface IncidentTrendChartProps {
  data?: ChartDataPoint[];
}

export function IncidentTrendChart({ data }: IncidentTrendChartProps) {
  const [timeRange, setTimeRange] = useState<'1h' | '6h' | '24h'>('24h');
  const [hoveredBar, setHoveredBar] = useState<ChartDataPoint | null>(null);

  const getRangeData = (): ChartDataPoint[] => {
    switch (timeRange) {
      case '1h':
        return [
          { timestamp: '18:00', value: 0 },
          { timestamp: '18:15', value: 1 },
          { timestamp: '18:30', value: 0 },
          { timestamp: '18:45', value: 2 },
          { timestamp: '18:50', value: 1 },
        ];
      case '6h':
        return [
          { timestamp: '13:00', value: 1 },
          { timestamp: '14:00', value: 0 },
          { timestamp: '15:00', value: 3 },
          { timestamp: '16:00', value: 2 },
          { timestamp: '17:00', value: 0 },
          { timestamp: '18:50', value: 1 },
        ];
      case '24h':
      default:
        return Array.isArray(data) && data.length > 0
          ? data
          : [
              { timestamp: '00:00', value: 0 },
              { timestamp: '04:00', value: 1 },
              { timestamp: '08:00', value: 3 },
              { timestamp: '12:00', value: 2 },
              { timestamp: '16:00', value: 4 },
              { timestamp: '20:00', value: 1 },
            ];
    }
  };

  const safeData = getRangeData();
  const maxVal = Math.max(...safeData.map((d) => d.value), 1);

  return (
    <div className="rounded-2xl border border-slate-200/70 dark:border-slate-800/70 bg-white/85 dark:bg-[#0c121e]/85 backdrop-blur-xl p-4.5 shadow-sm relative overflow-hidden flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 shrink-0">
              <Flame className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h3 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 truncate">
                  Incident Velocity
                </h3>
                {hoveredBar && (
                  <span className="text-[10px] font-mono text-rose-500 font-bold bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/30">
                    {hoveredBar.value}
                  </span>
                )}
              </div>
              <p className="text-[10px] text-slate-500 truncate">Crash & anomaly timeline</p>
            </div>
          </div>

          {/* Time Range Switchers */}
          <div className="flex items-center gap-0.5 bg-slate-100 dark:bg-slate-900/80 p-0.5 rounded-lg border border-slate-200/80 dark:border-slate-800 shrink-0">
            {(['1h', '6h', '24h'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setTimeRange(r)}
                className={`px-1.5 py-0.5 rounded-md text-[10px] font-mono font-medium transition-all ${
                  timeRange === r
                    ? 'bg-white dark:bg-[#0c121e] text-rose-600 dark:text-rose-400 shadow-xs border border-slate-200/80 dark:border-slate-700 font-bold'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* Bar Visualizer */}
        <div className="h-[140px] flex items-end gap-3 pt-6 border-b border-slate-100 dark:border-slate-800/70 pb-2 px-2">
          {safeData.map((item, index) => {
            const heightPercent = (item.value / maxVal) * 100;
            return (
              <div
                key={index}
                className="flex-1 flex flex-col items-center gap-1 group relative cursor-pointer"
                onMouseEnter={() => setHoveredBar(item)}
                onMouseLeave={() => setHoveredBar(null)}
              >
                <div
                  style={{ height: `${Math.max(heightPercent, 12)}%` }}
                  className={`w-full rounded-t-lg transition-all duration-300 ${
                    item.value > 3
                      ? 'bg-gradient-to-t from-rose-600 to-rose-400 shadow-rose-500/20 shadow-md'
                      : item.value > 0
                      ? 'bg-gradient-to-t from-amber-600 to-amber-400'
                      : 'bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700'
                  }`}
                />
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex justify-between items-center text-[10px] text-slate-500 font-mono mt-2 px-1">
        {safeData.map((d, i) => (
          <span key={i}>{d.timestamp}</span>
        ))}
      </div>
    </div>
  );
}

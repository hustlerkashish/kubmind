import { useState } from 'react';
import { ChartDataPoint } from '@/services/mockTelemetryService';
import { Zap } from 'lucide-react';

interface IncidentTrendChartProps {
  data: ChartDataPoint[];
}

export function IncidentTrendChart({ data }: IncidentTrendChartProps) {
  const [hoveredBar, setHoveredBar] = useState<ChartDataPoint | null>(null);

  const safeData = Array.isArray(data) && data.length > 0 ? data : [
    { timestamp: '00:00', value: 0 },
    { timestamp: '04:00', value: 0 },
    { timestamp: '08:00', value: 0 },
    { timestamp: '12:00', value: 0 },
    { timestamp: '16:00', value: 0 },
    { timestamp: '20:00', value: 0 },
  ];

  const maxVal = Math.max(...safeData.map((d) => d.value), 1);

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 backdrop-blur-md relative overflow-hidden flex flex-col justify-between shadow-sm">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-500">
              <Zap className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">24h Incident Velocity</h3>
              <p className="text-[11px] text-slate-500">Crash & anomaly events timeline</p>
            </div>
          </div>

          {hoveredBar ? (
            <span className="text-xs font-mono text-rose-500 font-bold bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/30">
              {hoveredBar.timestamp}: {hoveredBar.value} Incidents
            </span>
          ) : (
            <span className="text-[11px] text-slate-500 font-mono">24h History</span>
          )}
        </div>

        {/* Bar Visualizer */}
        <div className="h-[140px] flex items-end gap-3 pt-6 border-b border-slate-200 dark:border-slate-800 pb-2 px-2">
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
                  style={{ height: `${Math.max(heightPercent, 8)}%` }}
                  className={`w-full rounded-t transition-all duration-300 ${
                    item.value > 3
                      ? 'bg-rose-500 hover:bg-rose-600'
                      : item.value > 0
                      ? 'bg-amber-500 hover:bg-amber-600'
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

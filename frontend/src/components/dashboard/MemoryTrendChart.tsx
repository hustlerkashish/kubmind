import { useState } from 'react';
import { ChartDataPoint } from '@/services/mockTelemetryService';
import { Zap, Activity } from 'lucide-react';

interface MemoryTrendChartProps {
  data?: ChartDataPoint[];
}

export function MemoryTrendChart({ data = [] }: MemoryTrendChartProps) {
  const [timeRange, setTimeRange] = useState<'1h' | '6h' | '24h'>('24h');
  const [hoveredPoint, setHoveredPoint] = useState<ChartDataPoint | null>(null);

  const width = 500;
  const height = 180;
  const padding = 20;

  const maxValue = 100;
  const minValue = 0;

  const hasRealData = Array.isArray(data) && data.length > 1;

  const chartPoints: ChartDataPoint[] = hasRealData
    ? data
    : [
        { timestamp: '00:00', value: 0 },
        { timestamp: '04:00', value: 0 },
        { timestamp: '08:00', value: 0 },
        { timestamp: '12:00', value: 0 },
        { timestamp: '16:00', value: 0 },
        { timestamp: '20:00', value: 0 },
      ];

  const points = chartPoints.map((d, index) => {
    const x = padding + (index / (chartPoints.length - 1)) * (width - padding * 2);
    const y = height - padding - ((d.value - minValue) / (maxValue - minValue)) * (height - padding * 2);
    return { x, y, ...d };
  });

  const pathD = points.reduce((acc, point, index) => {
    return index === 0 ? `M ${point.x} ${point.y}` : `${acc} L ${point.x} ${point.y}`;
  }, '');

  const areaD = `${pathD} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${
    height - padding
  } Z`;

  return (
    <div className="rounded-2xl border border-slate-200/70 dark:border-slate-800/70 bg-white/85 dark:bg-[#0c121e]/85 backdrop-blur-xl p-4.5 shadow-sm relative overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-500 shrink-0">
            <Zap className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <h3 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 truncate">
              Memory Allocation
            </h3>
            <p className="text-[10px] text-slate-500 truncate">
              {hasRealData ? 'Live PromQL metrics' : 'Prometheus stream offline'}
            </p>
          </div>
        </div>

        {/* Time-Window Switchers */}
        <div className="flex items-center gap-0.5 bg-slate-100 dark:bg-slate-900/80 p-0.5 rounded-lg border border-slate-200/80 dark:border-slate-800 shrink-0">
          {(['1h', '6h', '24h'] as const).map((r) => (
            <button
              key={r}
              onClick={() => setTimeRange(r)}
              className={`px-1.5 py-0.5 rounded-md text-[10px] font-mono font-medium transition-all ${
                timeRange === r
                  ? 'bg-white dark:bg-[#0c121e] text-purple-600 dark:text-purple-400 shadow-xs border border-slate-200/80 dark:border-slate-700 font-bold'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      <div className="relative w-full h-[180px]">
        {hasRealData ? (
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
            <defs>
              <linearGradient id="memGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#a855f7" stopOpacity="0.45" />
                <stop offset="100%" stopColor="#a855f7" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Grid lines */}
            <line x1={padding} y1={padding} x2={width - padding} y2={padding} stroke="var(--chart-grid)" strokeDasharray="3 3" />
            <line x1={padding} y1={height / 2} x2={width - padding} y2={height / 2} stroke="var(--chart-grid)" strokeDasharray="3 3" />
            <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="var(--chart-grid)" />

            {/* Area Fill */}
            <path d={areaD} fill="url(#memGradient)" />

            {/* Smooth Line */}
            <path d={pathD} fill="none" stroke="#a855f7" strokeWidth="2.5" strokeLinecap="round" />

            {/* Interactive Data Points */}
            {points.map((p, idx) => (
              <circle
                key={idx}
                cx={p.x}
                cy={p.y}
                r={hoveredPoint?.timestamp === p.timestamp ? 5 : 3.5}
                className="fill-purple-500 stroke-white dark:stroke-[#0c121e] stroke-2 cursor-pointer transition-all hover:scale-125"
                onMouseEnter={() => setHoveredPoint(p)}
                onMouseLeave={() => setHoveredPoint(null)}
              />
            ))}
          </svg>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center p-4 border border-dashed border-slate-200 dark:border-slate-800/80 rounded-xl">
            <Activity className="h-6 w-6 text-slate-400 mb-2 opacity-50" />
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">No Live Memory Stream</p>
            <p className="text-[10px] text-slate-500 mt-0.5 max-w-xs">
              Configure your Prometheus URL in Settings to stream container RSS memory usage.
            </p>
          </div>
        )}

        {/* Hover Tooltip Overlay */}
        {hoveredPoint && (
          <div className="absolute top-2 right-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 rounded-xl text-xs font-mono shadow-lg pointer-events-none animate-in fade-in duration-150">
            <span className="text-slate-500 font-medium">{hoveredPoint.timestamp}</span> :{' '}
            <span className="text-purple-500 font-bold">{Math.round(hoveredPoint.value)}% RAM</span>
          </div>
        )}
      </div>

      <div className="flex justify-between items-center text-[10px] text-slate-500 font-mono mt-2 px-1">
        {chartPoints.map((d, i) => (
          <span key={i}>{d.timestamp}</span>
        ))}
      </div>
    </div>
  );
}

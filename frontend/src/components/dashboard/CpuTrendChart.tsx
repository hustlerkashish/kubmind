import { useState } from 'react';
import { ChartDataPoint } from '@/services/mockTelemetryService';
import { Cpu } from 'lucide-react';

interface CpuTrendChartProps {
  data: ChartDataPoint[];
}

export function CpuTrendChart({ data }: CpuTrendChartProps) {
  const [hoveredPoint, setHoveredPoint] = useState<ChartDataPoint | null>(null);

  const width = 500;
  const height = 180;
  const padding = 20;

  const maxValue = 100;
  const minValue = 0;

  const safeData = Array.isArray(data) && data.length > 1 ? data : [];

  if (safeData.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 backdrop-blur-md">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-500">
            <Cpu className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">CPU Allocation & Throttle Trend</h3>
            <p className="text-[11px] text-slate-500">Cluster-wide compute load telemetry</p>
          </div>
        </div>
        <div className="h-[180px] flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin mx-auto mb-2" />
            <p className="text-xs text-slate-500">Connecting to Prometheus metric engine...</p>
          </div>
        </div>
      </div>
    );
  }

  const points = safeData.map((d, index) => {
    const x = padding + (index / (safeData.length - 1)) * (width - padding * 2);
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
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 backdrop-blur-md relative overflow-hidden shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-500">
            <Cpu className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">CPU Allocation & Throttle Trend</h3>
            <p className="text-[11px] text-slate-500">Cluster-wide compute load telemetry</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-[11px] text-slate-500 font-mono">
            <span className="h-2 w-2 rounded-full bg-amber-500" /> Prometheus Stream
          </span>
        </div>
      </div>

      <div className="relative w-full h-[180px]">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
          <defs>
            <linearGradient id="cpuGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          <line x1={padding} y1={padding} x2={width - padding} y2={padding} stroke="var(--chart-grid)" strokeDasharray="3 3" />
          <line x1={padding} y1={height / 2} x2={width - padding} y2={height / 2} stroke="var(--chart-grid)" strokeDasharray="3 3" />
          <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="var(--chart-grid)" />

          {/* Area Fill */}
          <path d={areaD} fill="url(#cpuGradient)" />

          {/* Smooth Line */}
          <path d={pathD} fill="none" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" />

          {/* Interactive Data Points */}
          {points.map((p, idx) => (
            <circle
              key={idx}
              cx={p.x}
              cy={p.y}
              r={hoveredPoint?.timestamp === p.timestamp ? 5 : 3}
              className="fill-amber-500 stroke-white dark:stroke-slate-900 stroke-2 cursor-pointer transition-all"
              onMouseEnter={() => setHoveredPoint(p)}
              onMouseLeave={() => setHoveredPoint(null)}
            />
          ))}
        </svg>

        {/* Hover Tooltip Overlay */}
        {hoveredPoint && (
          <div className="absolute top-2 right-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-2 rounded-lg text-xs font-mono shadow-md pointer-events-none">
            <span className="text-slate-500">{hoveredPoint.timestamp}</span> :{' '}
            <span className="text-amber-500 font-bold">{hoveredPoint.value}% CPU</span>
          </div>
        )}
      </div>

      <div className="flex justify-between items-center text-[10px] text-slate-500 font-mono mt-2">
        {data.map((d, i) => (
          <span key={i}>{d.timestamp}</span>
        ))}
      </div>
    </div>
  );
}

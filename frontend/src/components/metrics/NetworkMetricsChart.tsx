import { useState } from 'react';
import { PrometheusQueryResult, MetricDatapoint } from '@/services/prometheusService';
import { Network } from 'lucide-react';

interface NetworkMetricsChartProps {
  data?: PrometheusQueryResult;
}

export function NetworkMetricsChart({ data }: NetworkMetricsChartProps) {
  const [hoveredPoint, setHoveredPoint] = useState<MetricDatapoint | null>(null);

  const series = data?.series?.[0];
  const datapoints = series?.datapoints || [];

  const width = 500;
  const height = 180;
  const padding = 20;

  const maxValue = 100;
  const minValue = 0;

  const points = datapoints.map((d, index) => {
    const x = padding + (index / Math.max(datapoints.length - 1, 1)) * (width - padding * 2);
    const y = height - padding - ((d.value - minValue) / (maxValue - minValue)) * (height - padding * 2);
    return { x, y, ...d };
  });

  const pathD = points.reduce((acc, point, index) => {
    return index === 0 ? `M ${point.x} ${point.y}` : `${acc} L ${point.x} ${point.y}`;
  }, '');

  const areaD = points.length > 0
    ? `${pathD} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`
    : '';

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 backdrop-blur-md relative overflow-hidden shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-500">
            <Network className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Network Throughput RX/TX</h3>
            <p className="text-[11px] text-slate-500">sum(rate(container_network_receive_bytes_total[5m]))</p>
          </div>
        </div>

        <span className="text-[11px] font-mono font-semibold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
          Range: {data?.range || '1h'}
        </span>
      </div>

      <div className="relative w-full h-[180px]">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
          <defs>
            <linearGradient id="promNetGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          <line x1={padding} y1={padding} x2={width - padding} y2={padding} stroke="var(--chart-grid)" strokeDasharray="3 3" />
          <line x1={padding} y1={height / 2} x2={width - padding} y2={height / 2} stroke="var(--chart-grid)" strokeDasharray="3 3" />
          <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="var(--chart-grid)" />

          {areaD && <path d={areaD} fill="url(#promNetGradient)" />}
          {pathD && <path d={pathD} fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" />}

          {points.map((p, idx) => (
            <circle
              key={idx}
              cx={p.x}
              cy={p.y}
              r={hoveredPoint?.timestamp === p.timestamp ? 5 : 3}
              className="fill-emerald-500 stroke-white dark:stroke-slate-900 stroke-2 cursor-pointer transition-all"
              onMouseEnter={() => setHoveredPoint(p)}
              onMouseLeave={() => setHoveredPoint(null)}
            />
          ))}
        </svg>

        {hoveredPoint && (
          <div className="absolute top-2 right-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-2 rounded-lg text-xs font-mono shadow-md pointer-events-none">
            <span className="text-slate-500">{hoveredPoint.timestamp}</span> :{' '}
            <span className="text-emerald-500 font-bold">{hoveredPoint.value} MB/s</span>
          </div>
        )}
      </div>

      <div className="flex justify-between items-center text-[10px] text-slate-500 font-mono mt-2">
        {datapoints.map((d, i) => (
          <span key={i}>{d.timestamp}</span>
        ))}
      </div>
    </div>
  );
}

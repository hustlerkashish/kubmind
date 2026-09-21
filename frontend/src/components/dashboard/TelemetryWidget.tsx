import { MetricCardData } from '@/services/mockTelemetryService';
import {
  Server,
  Cpu,
  AlertTriangle,
  GitBranch,
  HardDrive,
  ArrowDownUp,
  Zap,
  Boxes,
  Flame,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface TelemetryWidgetProps {
  data: MetricCardData;
}

export function TelemetryWidget({ data }: TelemetryWidgetProps) {
  const isDisconnected = data.value === 'N/A' || data.value === null || data.value === undefined;

  const getIconAndColors = (type: MetricCardData['type']) => {
    switch (type) {
      case 'clusters':
        return {
          icon: Server,
          color: 'text-blue-600 dark:text-blue-400',
          bg: 'bg-blue-500/10 border-blue-500/20',
          glow: 'group-hover:border-blue-500/40',
          sparkColor: '#3b82f6',
        };
      case 'running_pods':
        return {
          icon: Boxes,
          color: 'text-emerald-600 dark:text-emerald-400',
          bg: 'bg-emerald-500/10 border-emerald-500/20',
          glow: 'group-hover:border-emerald-500/40',
          sparkColor: '#10b981',
        };
      case 'failed_pods':
        return {
          icon: AlertTriangle,
          color: 'text-rose-600 dark:text-rose-400',
          bg: 'bg-rose-500/10 border-rose-500/20',
          glow: 'group-hover:border-rose-500/40',
          sparkColor: '#f43f5e',
        };
      case 'deployments':
        return {
          icon: GitBranch,
          color: 'text-indigo-600 dark:text-indigo-400',
          bg: 'bg-indigo-500/10 border-indigo-500/20',
          glow: 'group-hover:border-indigo-500/40',
          sparkColor: '#6366f1',
        };
      case 'nodes':
        return {
          icon: Server,
          color: 'text-cyan-600 dark:text-cyan-400',
          bg: 'bg-cyan-500/10 border-cyan-500/20',
          glow: 'group-hover:border-cyan-500/40',
          sparkColor: '#06b6d4',
        };
      case 'cpu':
        return {
          icon: Cpu,
          color: 'text-amber-600 dark:text-amber-400',
          bg: 'bg-amber-500/10 border-amber-500/20',
          glow: 'group-hover:border-amber-500/40',
          sparkColor: '#f59e0b',
        };
      case 'memory':
        return {
          icon: Zap,
          color: 'text-purple-600 dark:text-purple-400',
          bg: 'bg-purple-500/10 border-purple-500/20',
          glow: 'group-hover:border-purple-500/40',
          sparkColor: '#a855f7',
        };
      case 'network':
        return {
          icon: ArrowDownUp,
          color: 'text-cyan-600 dark:text-cyan-400',
          bg: 'bg-cyan-500/10 border-cyan-500/20',
          glow: 'group-hover:border-cyan-500/40',
          sparkColor: '#06b6d4',
        };
      case 'disk':
        return {
          icon: HardDrive,
          color: 'text-blue-600 dark:text-blue-400',
          bg: 'bg-blue-500/10 border-blue-500/20',
          glow: 'group-hover:border-blue-500/40',
          sparkColor: '#3b82f6',
        };
      case 'incidents':
        return {
          icon: Flame,
          color: 'text-rose-600 dark:text-rose-400',
          bg: 'bg-rose-500/10 border-rose-500/20',
          glow: 'group-hover:border-rose-500/40',
          sparkColor: '#f43f5e',
        };
    }
  };

  const style = getIconAndColors(data.type);
  const Icon = style.icon;

  // Generate dynamic path if connected, or null if disconnected
  const generateLiveSparkline = () => {
    if (isDisconnected) return null;

    // Parse numeric value if available
    const num = typeof data.value === 'number'
      ? data.value
      : parseFloat(String(data.value).replace(/[^0-9.]/g, '')) || 50;

    // Normalize height between 4 and 20 (SVG viewbox is 120 x 24)
    const midY = 24 - Math.max(4, Math.min(20, (num / 100) * 20));
    const p1 = Math.max(4, Math.min(20, midY + 4));
    const p2 = Math.max(4, Math.min(20, midY - 6));
    const p3 = Math.max(4, Math.min(20, midY + 2));
    const p4 = Math.max(4, Math.min(20, midY - 3));

    return {
      path: `M0,${p1} Q25,${p2} 50,${p3} T90,${p4} T120,${midY}`,
      endY: midY,
    };
  };

  const liveSpark = generateLiveSparkline();

  return (
    <div
      className={cn(
        'group relative flex flex-col justify-between rounded-2xl border border-slate-200/70 dark:border-slate-800/70 bg-white/85 dark:bg-[#0c121e]/85 backdrop-blur-xl p-5 transition-all duration-200 hover:border-slate-300 dark:hover:border-slate-700 shadow-sm hover:shadow-md min-h-[156px]',
        style.glow
      )}
    >
      {/* Top Header: Title & Icon Badge */}
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 font-mono">
          {data.title}
        </span>
        <div className={cn('h-8 w-8 rounded-xl border flex items-center justify-center shrink-0 transition-transform group-hover:scale-105', style.bg, style.color)}>
          <Icon className="h-4 w-4" />
        </div>
      </div>

      {/* Main Value Display + Dynamic/Flatline Sparkline */}
      <div className="my-2 flex items-end justify-between gap-2">
        <h3 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white font-mono leading-none">
          {data.value}
        </h3>

        {/* Sparkline Visualizer */}
        <div className="w-24 h-6 opacity-75 group-hover:opacity-100 transition-opacity">
          <svg viewBox="0 0 120 24" className="w-full h-full overflow-visible">
            {isDisconnected ? (
              /* Disconnected: Subtle Dashed Flatline */
              <>
                <line
                  x1="0"
                  y1="12"
                  x2="114"
                  y2="12"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeDasharray="3 3"
                  className="text-slate-300 dark:text-slate-700"
                />
                <circle
                  cx="118"
                  cy="12"
                  r="2"
                  className="fill-slate-300 dark:fill-slate-700"
                />
              </>
            ) : liveSpark ? (
              /* Connected: Real-time Live Trend Wave + Glow Dot */
              <>
                <path
                  d={liveSpark.path}
                  fill="none"
                  stroke={style.sparkColor}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle
                  cx="120"
                  cy={liveSpark.endY}
                  r="2.5"
                  fill={style.sparkColor}
                  className="animate-pulse"
                />
              </>
            ) : null}
          </svg>
        </div>
      </div>

      {/* Bottom Footer: Subtext & Status Pill */}
      <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800/70 pt-2.5 text-xs">
        <span className="text-slate-500 dark:text-slate-400 font-medium truncate text-[11px]">
          {data.subtext}
        </span>
        <span
          className={cn(
            'font-mono font-semibold px-2 py-0.5 rounded-md text-[11px] shrink-0 ml-2 border',
            data.isPositive
              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
              : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
          )}
        >
          {data.change}
        </span>
      </div>
    </div>
  );
}

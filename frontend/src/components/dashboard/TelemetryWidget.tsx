import { MetricCardData } from '@/services/mockTelemetryService';
import {
  Server,
  Cpu,
  AlertTriangle,
  Layers,
  HardDrive,
  Activity,
  Zap,
  CheckCircle2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface TelemetryWidgetProps {
  data: MetricCardData;
}

export function TelemetryWidget({ data }: TelemetryWidgetProps) {
  const getIconAndColors = (type: MetricCardData['type']) => {
    switch (type) {
      case 'clusters':
        return {
          icon: Server,
          color: 'text-blue-500',
          bg: 'bg-blue-500/10 border-blue-500/20',
          glow: 'group-hover:border-blue-500/40',
        };
      case 'running_pods':
        return {
          icon: CheckCircle2,
          color: 'text-emerald-500',
          bg: 'bg-emerald-500/10 border-emerald-500/20',
          glow: 'group-hover:border-emerald-500/40',
        };
      case 'failed_pods':
        return {
          icon: AlertTriangle,
          color: 'text-rose-500',
          bg: 'bg-rose-500/10 border-rose-500/20',
          glow: 'group-hover:border-rose-500/40',
        };
      case 'deployments':
        return {
          icon: Layers,
          color: 'text-indigo-500',
          bg: 'bg-indigo-500/10 border-indigo-500/20',
          glow: 'group-hover:border-indigo-500/40',
        };
      case 'nodes':
        return {
          icon: HardDrive,
          color: 'text-cyan-500',
          bg: 'bg-cyan-500/10 border-cyan-500/20',
          glow: 'group-hover:border-cyan-500/40',
        };
      case 'cpu':
        return {
          icon: Cpu,
          color: 'text-amber-500',
          bg: 'bg-amber-500/10 border-amber-500/20',
          glow: 'group-hover:border-amber-500/40',
        };
      case 'memory':
        return {
          icon: Activity,
          color: 'text-purple-500',
          bg: 'bg-purple-500/10 border-purple-500/20',
          glow: 'group-hover:border-purple-500/40',
        };
      case 'incidents':
        return {
          icon: Zap,
          color: 'text-rose-500',
          bg: 'bg-rose-500/10 border-rose-500/20',
          glow: 'group-hover:border-rose-500/40',
        };
    }
  };

  const style = getIconAndColors(data.type);
  const Icon = style.icon;

  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 backdrop-blur-md transition-all duration-200 hover:border-slate-300 dark:hover:bg-slate-900/90 shadow-sm dark:shadow-md',
        style.glow
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 font-sans">{data.title}</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-2xl font-extrabold tracking-tight text-slate-800 dark:text-white font-mono">{data.value}</h3>
          </div>
        </div>
        <div className={cn('rounded-lg border p-2.5 transition-colors', style.bg, style.color)}>
          <Icon className="h-4 w-4" />
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-slate-100 dark:border-slate-800/60 pt-2.5 text-[11px]">
        <span className="text-slate-500 font-medium truncate max-w-[130px]">{data.subtext}</span>
        <span
          className={cn(
            'font-mono font-medium',
            data.isPositive ? 'text-emerald-500' : 'text-amber-500'
          )}
        >
          {data.change}
        </span>
      </div>
    </div>
  );
}

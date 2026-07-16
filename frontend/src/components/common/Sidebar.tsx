import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Cpu, Layers, Server, Network, Folder,
  AlertCircle, Activity, Terminal, ShieldAlert, Bot,
  Sparkles, Settings, User,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useClusterSummary } from '@/hooks/useKubernetes';
import { useThemeContext } from '@/context/ThemeContext';

export function Sidebar() {
  const { data: cluster } = useClusterSummary();
  const { isLight } = useThemeContext();

  const navItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { name: 'Pods & Workloads', icon: Cpu, path: '/k8s/pods' },
    { name: 'Deployments', icon: Layers, path: '/k8s/deployments' },
    { name: 'Cluster Nodes', icon: Server, path: '/k8s/nodes' },
    { name: 'Services & Routing', icon: Network, path: '/k8s/services' },
    { name: 'Namespaces', icon: Folder, path: '/k8s/namespaces' },
    { name: 'Cluster Events Feed', icon: AlertCircle, path: '/k8s/events' },
    { name: 'Prometheus Telemetry', icon: Activity, path: '/metrics' },
    { name: 'Kibana Log Explorer', icon: Terminal, path: '/logs' },
    { name: 'Incident Center & RCA', icon: ShieldAlert, path: '/incidents' },
    { name: 'AI LangGraph Copilot', icon: Bot, path: '/copilot' },
    { name: 'Recommendation Engine', icon: Sparkles, path: '/recommendations' },
    { name: 'Settings', icon: Settings, path: '/settings' },
    { name: 'Profile', icon: User, path: '/profile' },
  ];

  return (
    <aside className={cn(
      'w-64 flex flex-col justify-between shrink-0 h-screen sticky top-0 border-r transition-colors duration-200',
      isLight
        ? 'bg-white border-slate-200'
        : 'bg-slate-950/90 border-slate-800/80'
    )}>
      <div>
        {/* Brand Header */}
        <div className={cn(
          'h-16 flex items-center gap-3 px-6 border-b',
          isLight ? 'border-slate-200' : 'border-slate-800/80'
        )}>
          <div className="h-9 w-9 rounded-lg bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Cpu className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className={cn('font-bold tracking-tight text-base leading-none', isLight ? 'text-slate-900' : 'text-white')}>KubeMind</h1>
            <span className="text-[10px] uppercase font-mono font-semibold tracking-wider text-cyan-500">K8s Copilot v1.0</span>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="p-3 space-y-0.5">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all group',
                  isActive
                    ? 'bg-blue-600/10 text-blue-500 border border-blue-500/20 shadow-sm'
                    : isLight
                      ? 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/60'
                )
              }
            >
              <item.icon className="h-4 w-4 shrink-0 transition-colors group-hover:text-blue-500" />
              <span>{item.name}</span>
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Live Cluster Connection Status */}
      <div className={cn(
        'p-4 m-3 rounded-lg border',
        isLight
          ? 'border-slate-200 bg-slate-50'
          : 'border-slate-800 bg-slate-900/50'
      )}>
        <div className="flex items-center justify-between text-xs mb-1">
          <span className={cn('font-mono text-[11px]', isLight ? 'text-slate-500' : 'text-slate-400')}>Active Cluster</span>
          <span className={cn(
            'flex h-2 w-2 rounded-full animate-pulse',
            cluster?.connected ? 'bg-emerald-500' : 'bg-amber-400'
          )} />
        </div>
        <p className={cn('text-xs font-semibold truncate font-mono', isLight ? 'text-slate-800' : 'text-slate-200')}>
          {cluster?.clusterName || 'minikube-local'}
        </p>
        <span className={cn('text-[10px] font-mono block truncate', isLight ? 'text-slate-400' : 'text-slate-500')}>
          SDK {cluster?.kubernetesVersion || 'v1.30.2'} • {cluster?.status || 'Online'}
        </span>
      </div>
    </aside>
  );
}

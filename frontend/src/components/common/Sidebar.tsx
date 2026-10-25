import { NavLink } from 'react-router-dom';
import {
  Gauge,
  Boxes,
  Rocket,
  Server,
  Route,
  Shapes,
  Radio,
  LineChart,
  TerminalSquare,
  ShieldAlert,
  BrainCircuit,
  Lightbulb,
  SlidersHorizontal,
  UserCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useClusterSummary } from '@/hooks/useKubernetes';

export function Sidebar() {
  const { data: cluster } = useClusterSummary();

  const navItems = [
    { name: 'Dashboard', icon: Gauge, path: '/dashboard' },
    { name: 'Pods & Workloads', icon: Boxes, path: '/k8s/pods' },
    { name: 'Deployments', icon: Rocket, path: '/k8s/deployments' },
    { name: 'Cluster Nodes', icon: Server, path: '/k8s/nodes' },
    { name: 'Services & Routing', icon: Route, path: '/k8s/services' },
    { name: 'Namespaces', icon: Shapes, path: '/k8s/namespaces' },
    { name: 'Cluster Events Feed', icon: Radio, path: '/k8s/events' },
    { name: 'Prometheus Telemetry', icon: LineChart, path: '/metrics' },
    { name: 'Kibana Log Explorer', icon: TerminalSquare, path: '/logs' },
    { name: 'Incident Center & RCA', icon: ShieldAlert, path: '/incidents' },
    { name: 'AI LangGraph Copilot', icon: BrainCircuit, path: '/copilot' },
    { name: 'Recommendation Engine', icon: Lightbulb, path: '/recommendations' },
    { name: 'Settings', icon: SlidersHorizontal, path: '/settings' },
    { name: 'Profile', icon: UserCircle, path: '/profile' },
  ];

  return (
    <aside className="w-64 flex flex-col justify-between shrink-0 h-screen sticky top-0 border-r transition-colors duration-200 bg-white dark:bg-[#0c121e] border-slate-200 dark:border-slate-800/80">
      <div className="flex-1 overflow-y-auto">
        {/* Brand Header */}
        <div className="h-16 flex items-center gap-3 px-6 border-b border-slate-200 dark:border-slate-800/80">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 flex items-center justify-center shadow-md shadow-blue-500/20">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-white">
              <circle cx="12" cy="12" r="3" />
              <circle cx="12" cy="12" r="8" opacity="0.85" />
              <path d="M12 2v4M12 18v4M2 12h4M18 12h4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
            </svg>
          </div>
          <div>
            <h1 className="font-bold tracking-tight text-base leading-none text-slate-900 dark:text-white">KubeMind</h1>
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
                    ? 'bg-blue-600/10 text-blue-600 dark:text-cyan-400 border border-blue-500/20 dark:border-cyan-500/30 shadow-sm font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-900/60'
                )
              }
            >
              <item.icon className="h-4 w-4 shrink-0 transition-colors group-hover:text-blue-500 dark:group-hover:text-cyan-400" />
              <span>{item.name}</span>
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Live Cluster Connection Status */}
      <div className="p-4 m-3 rounded-xl border transition-colors border-slate-200 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-900/60 shadow-sm">
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span className="font-mono text-[11px] font-semibold text-slate-500 dark:text-slate-400">Active Cluster</span>
          <span className={cn(
            'flex h-2 w-2 rounded-full animate-pulse',
            cluster?.connected ? 'bg-emerald-500 shadow-emerald-500/50 shadow' : 'bg-amber-400'
          )} />
        </div>
        <p className="text-xs font-bold truncate font-mono text-slate-800 dark:text-slate-200">
          {cluster?.clusterName || 'minikube-local'}
        </p>
        <span className="text-[10px] font-mono block truncate mt-0.5 text-slate-400 dark:text-slate-500">
          SDK {cluster?.kubernetesVersion || 'v1.30.2'} • {cluster?.status || 'Online'}
        </span>
      </div>
    </aside>
  );
}

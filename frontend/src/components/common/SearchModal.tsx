import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Zap,
  Layers,
  Command,
  Moon,
  Sun,
  Sparkles,
  Terminal,
  Cpu,
  Activity,
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { useIncidents } from '@/hooks/useIncidents';
import { useDeployments, usePods } from '@/hooks/useKubernetes';
import { useThemeContext } from '@/context/ThemeContext';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();
  const { toggleTheme, isLight } = useThemeContext();

  const { data: incidents = [] } = useIncidents('all', 'all');
  const { data: deployments = [] } = useDeployments('all');
  const { data: pods = [] } = usePods('all');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const quickActions = [
    {
      id: 'theme',
      title: isLight ? 'Switch to Dark Theme' : 'Switch to Light Theme',
      icon: isLight ? Moon : Sun,
      color: 'text-amber-500',
      action: () => {
        toggleTheme();
        onClose();
      },
    },
    {
      id: 'copilot',
      title: 'Open AI Copilot Diagnostic Chat',
      icon: Sparkles,
      color: 'text-cyan-500',
      action: () => {
        navigate('/copilot');
        onClose();
      },
    },
    {
      id: 'logs',
      title: 'Open Kibana Log Stream Explorer',
      icon: Terminal,
      color: 'text-blue-500',
      action: () => {
        navigate('/logs');
        onClose();
      },
    },
    {
      id: 'metrics',
      title: 'View Prometheus Time-Series Telemetry',
      icon: Activity,
      color: 'text-purple-500',
      action: () => {
        navigate('/metrics');
        onClose();
      },
    },
  ];

  const filteredActions = quickActions.filter((a) =>
    a.title.toLowerCase().includes(query.toLowerCase())
  );

  const filteredIncidents = incidents.filter(
    (inc) =>
      inc.podName.toLowerCase().includes(query.toLowerCase()) ||
      inc.namespace.toLowerCase().includes(query.toLowerCase()) ||
      inc.reason.toLowerCase().includes(query.toLowerCase())
  );

  const filteredPods = pods.filter(
    (pod) =>
      pod.name.toLowerCase().includes(query.toLowerCase()) ||
      pod.namespace.toLowerCase().includes(query.toLowerCase())
  );

  const filteredDeployments = deployments.filter(
    (dep) =>
      dep.name.toLowerCase().includes(query.toLowerCase()) ||
      dep.namespace.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="KubeMind Command Search" className="max-w-2xl">
      <div className="space-y-4">
        {/* Search Input Box */}
        <div className="relative">
          <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search pods, deployments, incidents, or type quick actions (e.g. Dark mode, logs)..."
            className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 py-3 pl-10 pr-4 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 font-sans"
          />
        </div>

        {/* Search Results */}
        <div className="max-h-96 overflow-y-auto space-y-4 pr-1">
          {/* Quick Actions */}
          {filteredActions.length > 0 && (
            <div>
              <p className="text-[10px] uppercase font-mono font-semibold text-slate-500 dark:text-slate-400 mb-2">
                Quick Actions
              </p>
              <div className="space-y-1">
                {filteredActions.map((action) => (
                  <div
                    key={action.id}
                    onClick={action.action}
                    className="p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900/60 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer flex items-center justify-between transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800">
                        <action.icon className={`h-4 w-4 ${action.color}`} />
                      </div>
                      <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-cyan-400">
                        {action.title}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">Action</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pods */}
          {filteredPods.length > 0 && (
            <div>
              <p className="text-[10px] uppercase font-mono font-semibold text-slate-500 dark:text-slate-400 mb-2">
                Active Pods ({filteredPods.length})
              </p>
              <div className="space-y-1">
                {filteredPods.slice(0, 5).map((pod, idx) => (
                  <div
                    key={idx}
                    onClick={() => {
                      navigate(`/logs?pod=${pod.name}&namespace=${pod.namespace}`);
                      onClose();
                    }}
                    className="p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900/60 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer flex items-center justify-between transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Cpu className="h-4 w-4 text-blue-500 shrink-0" />
                      <div>
                        <p className="text-xs font-mono font-semibold text-slate-800 dark:text-slate-200">{pod.name}</p>
                        <p className="text-[10px] text-slate-500">{pod.namespace} • Node: {pod.nodeName}</p>
                      </div>
                    </div>
                    <span
                      className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded border ${
                        pod.status === 'Running'
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                          : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                      }`}
                    >
                      {pod.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Incidents */}
          {filteredIncidents.length > 0 && (
            <div>
              <p className="text-[10px] uppercase font-mono font-semibold text-slate-500 dark:text-slate-400 mb-2">
                Live Incidents ({filteredIncidents.length})
              </p>
              <div className="space-y-1">
                {filteredIncidents.map((inc) => (
                  <div
                    key={inc.id}
                    onClick={() => {
                      navigate('/incidents');
                      onClose();
                    }}
                    className="p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900/60 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer flex items-center justify-between transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Zap className="h-4 w-4 text-rose-500 shrink-0" />
                      <div>
                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 font-mono">{inc.podName}</p>
                        <p className="text-[10px] text-slate-500">{inc.namespace} • {inc.reason}</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono font-semibold text-rose-600 dark:text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                      {inc.severity}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Deployments */}
          {filteredDeployments.length > 0 && (
            <div>
              <p className="text-[10px] uppercase font-mono font-semibold text-slate-500 dark:text-slate-400 mb-2">
                Deployments ({filteredDeployments.length})
              </p>
              <div className="space-y-1">
                {filteredDeployments.map((dep, idx) => (
                  <div
                    key={idx}
                    onClick={() => {
                      navigate('/k8s/deployments');
                      onClose();
                    }}
                    className="p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900/60 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer flex items-center justify-between transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Layers className="h-4 w-4 text-indigo-500 shrink-0" />
                      <div>
                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 font-mono">{dep.name}</p>
                        <p className="text-[10px] text-slate-500">{dep.namespace} • Replicas: {dep.availableReplicas}/{dep.desiredReplicas}</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      {dep.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 font-mono">
          <span className="flex items-center gap-1">
            <Command className="h-3.5 w-3.5" /> Press ESC to close
          </span>
          <span>Live Infrastructure Fuzzy Index</span>
        </div>
      </div>
    </Modal>
  );
}

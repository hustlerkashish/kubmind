import { useEffect, useState } from 'react';
import { Search, Zap, Layers, Command } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { useIncidents } from '@/hooks/useIncidents';
import { useDeployments } from '@/hooks/useKubernetes';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [query, setQuery] = useState('');
  const { data: incidents = [] } = useIncidents('all', 'all');
  const { data: deployments = [] } = useDeployments('all');

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

  const filteredIncidents = incidents.filter(
    (inc) =>
      inc.podName.toLowerCase().includes(query.toLowerCase()) ||
      inc.namespace.toLowerCase().includes(query.toLowerCase()) ||
      inc.reason.toLowerCase().includes(query.toLowerCase())
  );

  const filteredDeployments = deployments.filter(
    (dep) =>
      dep.name.toLowerCase().includes(query.toLowerCase()) ||
      dep.namespace.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="KubeMind Command Search" className="max-w-xl">
      <div className="space-y-4">
        {/* Search Input Box */}
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search active pods, namespaces, deployments, or incidents..."
            className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 py-2.5 pl-9 pr-4 text-xs text-slate-800 dark:text-white placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Search Results */}
        <div className="max-h-80 overflow-y-auto space-y-3 pr-1">
          <div>
            <p className="text-[10px] uppercase font-mono font-semibold text-slate-500 mb-2">
              Live Incidents ({filteredIncidents.length})
            </p>
            {filteredIncidents.length > 0 ? (
              <div className="space-y-1">
                {filteredIncidents.map((inc) => (
                  <div
                    key={inc.id}
                    onClick={onClose}
                    className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 hover:bg-slate-100 dark:hover:bg-slate-800/40 cursor-pointer flex items-center justify-between transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <Zap className="h-4 w-4 text-rose-500" />
                      <div>
                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">{inc.podName}</p>
                        <p className="text-[10px] text-slate-500">{inc.namespace} • {inc.reason}</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                      {inc.severity}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic">No live incidents found</p>
            )}
          </div>

          <div>
            <p className="text-[10px] uppercase font-mono font-semibold text-slate-500 mb-2">
              Connected Deployments ({filteredDeployments.length})
            </p>
            {filteredDeployments.length > 0 ? (
              <div className="space-y-1">
                {filteredDeployments.map((dep, idx) => (
                  <div
                    key={idx}
                    onClick={onClose}
                    className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 hover:bg-slate-100 dark:hover:bg-slate-800/40 cursor-pointer flex items-center justify-between transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <Layers className="h-4 w-4 text-indigo-500" />
                      <div>
                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">{dep.name}</p>
                        <p className="text-[10px] text-slate-500">{dep.namespace} • Replicas: {dep.availableReplicas}/{dep.desiredReplicas}</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      {dep.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic">No active deployments found</p>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800 text-[10px] text-slate-500 font-mono">
          <span className="flex items-center gap-1">
            <Command className="h-3 w-3" /> Press ESC to close
          </span>
          <span>Live Infrastructure Search</span>
        </div>
      </div>
    </Modal>
  );
}

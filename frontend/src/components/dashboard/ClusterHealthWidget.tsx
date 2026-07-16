import { useNodes } from '@/hooks/useKubernetes';
import { Server, CheckCircle2, AlertCircle } from 'lucide-react';

export function ClusterHealthWidget() {
  const { data: nodes = [], isLoading } = useNodes();

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 backdrop-blur-md relative">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-500">
            <Server className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Cluster Infrastructure Health</h3>
            <p className="text-[11px] text-slate-500">Control plane & worker node capacity</p>
          </div>
        </div>
        <span className={`flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full ${
          nodes.length > 0
            ? 'text-emerald-500 bg-emerald-500/10 border border-emerald-500/20'
            : 'text-slate-500 bg-slate-500/10 border border-slate-500/20'
        }`}>
          {nodes.length > 0 ? (
            <>
              <CheckCircle2 className="h-3.5 w-3.5" />
              {nodes.length} Ready Node{nodes.length > 1 ? 's' : ''}
            </>
          ) : (
            <>
              <AlertCircle className="h-3.5 w-3.5" />
              Disconnected
            </>
          )}
        </span>
      </div>

      <div className="space-y-3">
        {isLoading ? (
          <div className="h-24 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
          </div>
        ) : nodes.length > 0 ? (
          nodes.map((node, idx) => (
            <div
              key={idx}
              className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
            >
              <div className="flex items-center gap-2.5">
                <span className={`h-2 w-2 rounded-full shrink-0 ${node.status === 'Ready' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                <div>
                  <p className="font-semibold text-slate-800 dark:text-slate-200 font-mono">{node.name}</p>
                  <p className="text-[10px] text-slate-500">{node.role} • Kubelet {node.kubeletVersion}</p>
                </div>
              </div>

              <div className="flex items-center gap-4 text-[11px]">
                <div>
                  <span className="text-slate-500">CPU: </span>
                  <span className="font-mono font-semibold text-amber-500">{node.cpuCapacity}</span>
                </div>
                <div className="h-3 w-px bg-slate-200 dark:bg-slate-800" />
                <div>
                  <span className="text-slate-500">RAM: </span>
                  <span className="font-mono font-semibold text-purple-500">{node.memoryCapacity}</span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-6 text-slate-500 text-xs">
            <p className="font-medium text-slate-700 dark:text-slate-300">No Nodes Connected</p>
            <p className="mt-0.5 text-slate-500">Connect to a Kubernetes cluster API server to monitor node metrics.</p>
          </div>
        )}
      </div>
    </div>
  );
}

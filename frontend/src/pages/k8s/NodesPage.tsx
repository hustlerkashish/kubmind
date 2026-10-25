import { useState } from 'react';
import { useNodes } from '@/hooks/useKubernetes';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent } from '@/components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { Loader } from '@/components/ui/Loader';
import { Server, RefreshCw, AlertTriangle, CheckCircle2, Search, Cpu, HardDrive } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export function NodesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const { data: nodes, isLoading, isError, refetch, isRefetching } = useNodes();

  const filteredNodes = (nodes || []).filter((node) => {
    const q = searchQuery.toLowerCase();
    return (
      node.name.toLowerCase().includes(q) ||
      node.role.toLowerCase().includes(q) ||
      (node.internalIP && node.internalIP.toLowerCase().includes(q))
    );
  });

  const totalNodes = nodes?.length || 0;
  const readyNodes = (nodes || []).filter((n) => n.status === 'Ready').length;

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title="Kubernetes Cluster Nodes"
        description="Node capacity specifications, Kubelet readiness status, internal IPs, CPU and RAM hardware limits"
        actions={
          <Button variant="outline" size="sm" onClick={() => refetch()} isLoading={isRefetching}>
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
            Sync Nodes
          </Button>
        }
      />

      {/* KPI Overview Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#0c121e] shadow-sm">
          <p className="text-[11px] font-mono font-semibold uppercase text-slate-500 dark:text-slate-400">Total Nodes</p>
          <div className="flex items-center justify-between mt-1">
            <span className="text-2xl font-bold font-mono text-slate-900 dark:text-white">{totalNodes}</span>
            <Server className="h-5 w-5 text-cyan-500/80" />
          </div>
        </div>

        <div className="p-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 shadow-sm">
          <p className="text-[11px] font-mono font-semibold uppercase text-emerald-600 dark:text-emerald-400">Ready Status</p>
          <div className="flex items-center justify-between mt-1">
            <span className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">{readyNodes} / {totalNodes}</span>
            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
          </div>
        </div>

        <div className="p-4 rounded-2xl border border-amber-500/30 bg-amber-500/5 shadow-sm">
          <p className="text-[11px] font-mono font-semibold uppercase text-amber-600 dark:text-amber-400">Total CPU Cores</p>
          <div className="flex items-center justify-between mt-1">
            <span className="text-2xl font-bold font-mono text-amber-600 dark:text-amber-400">{nodes?.[0]?.cpuCapacity || '8'} Cores</span>
            <Cpu className="h-5 w-5 text-amber-500" />
          </div>
        </div>

        <div className="p-4 rounded-2xl border border-purple-500/30 bg-purple-500/5 shadow-sm">
          <p className="text-[11px] font-mono font-semibold uppercase text-purple-600 dark:text-purple-400">Total Memory</p>
          <div className="flex items-center justify-between mt-1">
            <span className="text-2xl font-bold font-mono text-purple-600 dark:text-purple-400">{nodes?.[0]?.memoryCapacity || '16Gi'}</span>
            <HardDrive className="h-5 w-5 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter nodes by name, role, or internal IP..."
            className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c121e] py-2 pl-9 pr-4 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:border-blue-500 focus:outline-none font-sans shadow-sm"
          />
        </div>

        <div className="text-xs font-mono text-slate-500 flex items-center gap-2">
          <span>Showing {filteredNodes.length} of {totalNodes} Nodes</span>
        </div>
      </div>

      {isLoading ? (
        <Loader text="Querying Kubernetes nodes from backend SDK..." />
      ) : isError ? (
        <Card className="border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-300 p-6 flex items-center gap-3">
          <AlertTriangle className="h-6 w-6 text-rose-500 shrink-0" />
          <div>
            <h4 className="font-semibold text-sm">Cluster Nodes Connection Warning</h4>
            <p className="text-xs text-rose-600 dark:text-rose-200 mt-1">Standby node specs active.</p>
          </div>
        </Card>
      ) : (
        <Card className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white/85 dark:bg-[#0c121e]/85 backdrop-blur-xl shadow-sm overflow-hidden">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
                  <TableHead>Node Name</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Condition Status</TableHead>
                  <TableHead>Kubelet Version</TableHead>
                  <TableHead>Internal IP</TableHead>
                  <TableHead>CPU Capacity</TableHead>
                  <TableHead>RAM Capacity</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredNodes.length > 0 ? (
                  filteredNodes.map((node, i) => (
                    <TableRow key={i} className="border-b border-slate-100 dark:border-slate-800/60 hover:bg-slate-50/80 dark:hover:bg-slate-900/40 transition-colors">
                      <TableCell className="font-mono text-xs font-semibold text-slate-800 dark:text-slate-100">
                        <div className="flex items-center gap-2">
                          <Server className="h-4 w-4 text-cyan-500 shrink-0" />
                          <span className="truncate max-w-[220px]">{node.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-xs px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 font-semibold">
                          {node.role}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold font-mono ${
                            node.status === 'Ready'
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                              : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                          }`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full mr-1 ${node.status === 'Ready' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                          {node.status}
                        </span>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-slate-700 dark:text-slate-300">{node.kubeletVersion}</TableCell>
                      <TableCell className="font-mono text-xs text-slate-500 dark:text-slate-400">{node.internalIP}</TableCell>
                      <TableCell className="font-mono text-xs text-amber-600 dark:text-amber-400 font-semibold">{node.cpuCapacity}</TableCell>
                      <TableCell className="font-mono text-xs text-purple-600 dark:text-purple-400 font-semibold">{node.memoryCapacity}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-slate-500 text-xs font-mono">
                      No nodes found matching filter selection.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

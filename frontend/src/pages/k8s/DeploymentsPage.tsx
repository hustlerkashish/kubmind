import { useState } from 'react';
import { useDeployments, useNamespaces } from '@/hooks/useKubernetes';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent } from '@/components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { Loader } from '@/components/ui/Loader';
import { Layers, RefreshCw, AlertTriangle, Search, CheckCircle2, Rocket, ArrowUpDown } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export function DeploymentsPage() {
  const [selectedNamespace, setSelectedNamespace] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<'name' | 'replicas'>('name');
  const [sortAsc, setSortAsc] = useState(true);

  const { data: deployments, isLoading, isError, refetch, isRefetching } = useDeployments(selectedNamespace);
  const { data: namespaces } = useNamespaces();

  const handleSort = (field: 'name' | 'replicas') => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const filteredDeployments = (deployments || [])
    .filter((dep) => {
      const q = searchQuery.toLowerCase();
      return (
        dep.name.toLowerCase().includes(q) ||
        dep.namespace.toLowerCase().includes(q) ||
        dep.image.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      let comp = 0;
      if (sortField === 'name') comp = a.name.localeCompare(b.name);
      if (sortField === 'replicas') comp = (a.availableReplicas || 0) - (b.availableReplicas || 0);
      return sortAsc ? comp : -comp;
    });

  const totalDeployments = deployments?.length || 0;
  const healthyCount = (deployments || []).filter((d) => d.status === 'HEALTHY' || d.availableReplicas === d.desiredReplicas).length;
  const totalAvailable = (deployments || []).reduce((acc, d) => acc + (d.availableReplicas || 0), 0);
  const totalDesired = (deployments || []).reduce((acc, d) => acc + (d.desiredReplicas || 0), 0);

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title="Kubernetes Deployments"
        description="Active workload deployments, replica scaling specs, rollouts, and target image revisions"
        actions={
          <div className="flex items-center gap-2">
            <select
              value={selectedNamespace}
              onChange={(e) => setSelectedNamespace(e.target.value)}
              className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c121e] py-1.5 px-3 text-xs text-slate-800 dark:text-slate-200 focus:border-blue-500 focus:outline-none font-mono shadow-sm"
            >
              <option value="all">Namespace: All Namespaces</option>
              {namespaces?.map((ns) => (
                <option key={ns.name} value={ns.name}>
                  {ns.name}
                </option>
              ))}
            </select>

            <Button variant="outline" size="sm" onClick={() => refetch()} isLoading={isRefetching}>
              <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
              Sync Deployments
            </Button>
          </div>
        }
      />

      {/* KPI Overview Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#0c121e] shadow-sm">
          <p className="text-[11px] font-mono font-semibold uppercase text-slate-500 dark:text-slate-400">Total Deployments</p>
          <div className="flex items-center justify-between mt-1">
            <span className="text-2xl font-bold font-mono text-slate-900 dark:text-white">{totalDeployments}</span>
            <Rocket className="h-5 w-5 text-indigo-500/80" />
          </div>
        </div>

        <div className="p-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 shadow-sm">
          <p className="text-[11px] font-mono font-semibold uppercase text-emerald-600 dark:text-emerald-400">Healthy Rollouts</p>
          <div className="flex items-center justify-between mt-1">
            <span className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">{healthyCount}</span>
            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
          </div>
        </div>

        <div className="p-4 rounded-2xl border border-blue-500/30 bg-blue-500/5 shadow-sm">
          <p className="text-[11px] font-mono font-semibold uppercase text-blue-600 dark:text-blue-400">Ready Replicas</p>
          <div className="flex items-center justify-between mt-1">
            <span className="text-2xl font-bold font-mono text-blue-600 dark:text-blue-400">{totalAvailable}</span>
            <Layers className="h-5 w-5 text-blue-500" />
          </div>
        </div>

        <div className="p-4 rounded-2xl border border-purple-500/30 bg-purple-500/5 shadow-sm">
          <p className="text-[11px] font-mono font-semibold uppercase text-purple-600 dark:text-purple-400">Target Replicas</p>
          <div className="flex items-center justify-between mt-1">
            <span className="text-2xl font-bold font-mono text-purple-600 dark:text-purple-400">{totalDesired}</span>
            <span className="text-xs font-mono font-bold text-purple-500">Desired</span>
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
            placeholder="Filter deployments by name, namespace, or image..."
            className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c121e] py-2 pl-9 pr-4 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:border-blue-500 focus:outline-none font-sans shadow-sm"
          />
        </div>

        <div className="text-xs font-mono text-slate-500 flex items-center gap-2">
          <span>Showing {filteredDeployments.length} of {totalDeployments} Deployments</span>
        </div>
      </div>

      {isLoading ? (
        <Loader text="Streaming live deployments from Kubernetes API..." />
      ) : isError ? (
        <Card className="border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-300 p-6 flex items-center gap-3">
          <AlertTriangle className="h-6 w-6 text-rose-500 shrink-0" />
          <div>
            <h4 className="font-semibold text-sm">Deployments Telemetry Error</h4>
            <p className="text-xs text-rose-600 dark:text-rose-200 mt-1">Unable to communicate with API server.</p>
          </div>
        </Card>
      ) : (
        <Card className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white/85 dark:bg-[#0c121e]/85 backdrop-blur-xl shadow-sm overflow-hidden">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
                  <TableHead onClick={() => handleSort('name')} className="cursor-pointer hover:text-blue-500">
                    <div className="flex items-center gap-1.5">
                      <span>Deployment Name</span>
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </TableHead>
                  <TableHead>Namespace</TableHead>
                  <TableHead onClick={() => handleSort('replicas')} className="cursor-pointer hover:text-blue-500">
                    <div className="flex items-center gap-1.5">
                      <span>Replicas Spec</span>
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Container Image</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDeployments.length > 0 ? (
                  filteredDeployments.map((dep, i) => (
                    <TableRow key={i} className="border-b border-slate-100 dark:border-slate-800/60 hover:bg-slate-50/80 dark:hover:bg-slate-900/40 transition-colors">
                      <TableCell className="font-mono text-xs font-semibold text-slate-800 dark:text-slate-100">
                        <div className="flex items-center gap-2">
                          <Layers className="h-4 w-4 text-indigo-500 shrink-0" />
                          <span className="truncate max-w-[220px]">{dep.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-slate-500 dark:text-slate-400">{dep.namespace}</TableCell>
                      <TableCell className="font-mono text-xs font-semibold text-slate-700 dark:text-slate-200">
                        {dep.availableReplicas} / {dep.desiredReplicas} Ready
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold font-mono ${
                            dep.status === 'HEALTHY' || dep.availableReplicas === dep.desiredReplicas
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                              : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                          }`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full mr-1.5 ${dep.status === 'HEALTHY' || dep.availableReplicas === dep.desiredReplicas ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                          {dep.status || 'HEALTHY'}
                        </span>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-slate-500 dark:text-slate-400 truncate max-w-xs">{dep.image}</TableCell>
                      <TableCell className="font-mono text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">{dep.creationTimestamp}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-slate-500 text-xs font-mono">
                      No deployments found matching filter selection.
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

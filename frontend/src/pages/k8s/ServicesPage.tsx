import { useState } from 'react';
import { useServices, useNamespaces } from '@/hooks/useKubernetes';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent } from '@/components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { Loader } from '@/components/ui/Loader';
import { Network, RefreshCw, AlertTriangle, Search, Route, ArrowUpDown } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export function ServicesPage() {
  const [selectedNamespace, setSelectedNamespace] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<'name' | 'type'>('name');
  const [sortAsc, setSortAsc] = useState(true);

  const { data: services, isLoading, isError, refetch, isRefetching } = useServices(selectedNamespace);
  const { data: namespaces } = useNamespaces();

  const handleSort = (field: 'name' | 'type') => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const filteredServices = (services || [])
    .filter((svc) => {
      const q = searchQuery.toLowerCase();
      return (
        svc.name.toLowerCase().includes(q) ||
        svc.namespace.toLowerCase().includes(q) ||
        svc.type.toLowerCase().includes(q) ||
        (svc.clusterIP && svc.clusterIP.toLowerCase().includes(q))
      );
    })
    .sort((a, b) => {
      let comp = 0;
      if (sortField === 'name') comp = a.name.localeCompare(b.name);
      if (sortField === 'type') comp = a.type.localeCompare(b.type);
      return sortAsc ? comp : -comp;
    });

  const totalServices = services?.length || 0;
  const clusterIpCount = (services || []).filter((s) => s.type === 'ClusterIP').length;
  const nodePortCount = (services || []).filter((s) => s.type === 'NodePort' || s.type === 'LoadBalancer').length;

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title="Kubernetes Services"
        description="ClusterIP, NodePort, LoadBalancer service routing endpoints, cluster internal IPs, and port bindings"
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
              Sync Services
            </Button>
          </div>
        }
      />

      {/* KPI Overview Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#0c121e] shadow-sm">
          <p className="text-[11px] font-mono font-semibold uppercase text-slate-500 dark:text-slate-400">Total Services</p>
          <div className="flex items-center justify-between mt-1">
            <span className="text-2xl font-bold font-mono text-slate-900 dark:text-white">{totalServices}</span>
            <Network className="h-5 w-5 text-emerald-500/80" />
          </div>
        </div>

        <div className="p-4 rounded-2xl border border-blue-500/30 bg-blue-500/5 shadow-sm">
          <p className="text-[11px] font-mono font-semibold uppercase text-blue-600 dark:text-blue-400">ClusterIP Internal</p>
          <div className="flex items-center justify-between mt-1">
            <span className="text-2xl font-bold font-mono text-blue-600 dark:text-blue-400">{clusterIpCount}</span>
            <Route className="h-5 w-5 text-blue-500" />
          </div>
        </div>

        <div className="p-4 rounded-2xl border border-cyan-500/30 bg-cyan-500/5 shadow-sm">
          <p className="text-[11px] font-mono font-semibold uppercase text-cyan-600 dark:text-cyan-400">NodePort / LB</p>
          <div className="flex items-center justify-between mt-1">
            <span className="text-2xl font-bold font-mono text-cyan-600 dark:text-cyan-400">{nodePortCount}</span>
            <span className="text-xs font-mono font-bold text-cyan-500">External</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl border border-purple-500/30 bg-purple-500/5 shadow-sm">
          <p className="text-[11px] font-mono font-semibold uppercase text-purple-600 dark:text-purple-400">Namespaces</p>
          <div className="flex items-center justify-between mt-1">
            <span className="text-2xl font-bold font-mono text-purple-600 dark:text-purple-400">{namespaces?.length || 0}</span>
            <span className="text-xs font-mono font-bold text-purple-500">Scopes</span>
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
            placeholder="Filter services by name, namespace, or IP..."
            className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c121e] py-2 pl-9 pr-4 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:border-blue-500 focus:outline-none font-sans shadow-sm"
          />
        </div>

        <div className="text-xs font-mono text-slate-500 flex items-center gap-2">
          <span>Showing {filteredServices.length} of {totalServices} Services</span>
        </div>
      </div>

      {isLoading ? (
        <Loader text="Streaming live Kubernetes services from backend API..." />
      ) : isError ? (
        <Card className="border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-300 p-6 flex items-center gap-3">
          <AlertTriangle className="h-6 w-6 text-rose-500 shrink-0" />
          <div>
            <h4 className="font-semibold text-sm">Services Routing Warning</h4>
            <p className="text-xs text-rose-600 dark:text-rose-200 mt-1">Standby service definitions displayed.</p>
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
                      <span>Service Name</span>
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </TableHead>
                  <TableHead>Namespace</TableHead>
                  <TableHead onClick={() => handleSort('type')} className="cursor-pointer hover:text-blue-500">
                    <div className="flex items-center gap-1.5">
                      <span>Service Type</span>
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </TableHead>
                  <TableHead>Cluster IP</TableHead>
                  <TableHead>Exposed Ports & Protocols</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredServices.length > 0 ? (
                  filteredServices.map((svc, i) => (
                    <TableRow key={i} className="border-b border-slate-100 dark:border-slate-800/60 hover:bg-slate-50/80 dark:hover:bg-slate-900/40 transition-colors">
                      <TableCell className="font-mono text-xs font-semibold text-slate-800 dark:text-slate-100">
                        <div className="flex items-center gap-2">
                          <Network className="h-4 w-4 text-emerald-500 shrink-0" />
                          <span className="truncate max-w-[220px]">{svc.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-slate-500 dark:text-slate-400">{svc.namespace}</TableCell>
                      <TableCell>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold font-mono bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                          {svc.type}
                        </span>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-slate-700 dark:text-slate-300">{svc.clusterIP}</TableCell>
                      <TableCell className="font-mono text-xs text-cyan-600 dark:text-cyan-400 font-semibold">{svc.ports}</TableCell>
                      <TableCell className="font-mono text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">{svc.creationTimestamp}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-slate-500 text-xs font-mono">
                      No services found matching filter selection.
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

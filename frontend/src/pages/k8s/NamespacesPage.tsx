import { useState } from 'react';
import { useNamespaces } from '@/hooks/useKubernetes';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent } from '@/components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { Loader } from '@/components/ui/Loader';
import { Folder, RefreshCw, AlertTriangle, CheckCircle2, Search, Shapes, Shield } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export function NamespacesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const { data: namespaces, isLoading, isError, refetch, isRefetching } = useNamespaces();

  const filteredNamespaces = (namespaces || []).filter((ns) => {
    return ns.name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const totalNamespaces = namespaces?.length || 0;
  const activeCount = (namespaces || []).filter((n) => n.status === 'Active').length;
  const systemCount = (namespaces || []).filter((n) => n.name.startsWith('kube-') || n.name === 'default').length;
  const workloadCount = totalNamespaces - systemCount;

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title="Kubernetes Namespaces"
        description="Logical cluster isolation boundaries, tenant status, and deployment metadata"
        actions={
          <Button variant="outline" size="sm" onClick={() => refetch()} isLoading={isRefetching}>
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
            Sync Namespaces
          </Button>
        }
      />

      {/* KPI Overview Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#0c121e] shadow-sm">
          <p className="text-[11px] font-mono font-semibold uppercase text-slate-500 dark:text-slate-400">Total Namespaces</p>
          <div className="flex items-center justify-between mt-1">
            <span className="text-2xl font-bold font-mono text-slate-900 dark:text-white">{totalNamespaces}</span>
            <Shapes className="h-5 w-5 text-purple-500/80" />
          </div>
        </div>

        <div className="p-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 shadow-sm">
          <p className="text-[11px] font-mono font-semibold uppercase text-emerald-600 dark:text-emerald-400">Active Status</p>
          <div className="flex items-center justify-between mt-1">
            <span className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">{activeCount} / {totalNamespaces}</span>
            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
          </div>
        </div>

        <div className="p-4 rounded-2xl border border-blue-500/30 bg-blue-500/5 shadow-sm">
          <p className="text-[11px] font-mono font-semibold uppercase text-blue-600 dark:text-blue-400">System Namespaces</p>
          <div className="flex items-center justify-between mt-1">
            <span className="text-2xl font-bold font-mono text-blue-600 dark:text-blue-400">{systemCount}</span>
            <Shield className="h-5 w-5 text-blue-500" />
          </div>
        </div>

        <div className="p-4 rounded-2xl border border-indigo-500/30 bg-indigo-500/5 shadow-sm">
          <p className="text-[11px] font-mono font-semibold uppercase text-indigo-600 dark:text-indigo-400">Workload Spaces</p>
          <div className="flex items-center justify-between mt-1">
            <span className="text-2xl font-bold font-mono text-indigo-600 dark:text-indigo-400">{workloadCount}</span>
            <span className="text-xs font-mono font-bold text-indigo-500">Apps</span>
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
            placeholder="Filter namespaces by name..."
            className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c121e] py-2 pl-9 pr-4 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:border-blue-500 focus:outline-none font-sans shadow-sm"
          />
        </div>

        <div className="text-xs font-mono text-slate-500 flex items-center gap-2">
          <span>Showing {filteredNamespaces.length} of {totalNamespaces} Namespaces</span>
        </div>
      </div>

      {isLoading ? (
        <Loader text="Fetching cluster namespaces from Kubernetes SDK..." />
      ) : isError ? (
        <Card className="border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-300 p-6 flex items-center gap-3">
          <AlertTriangle className="h-6 w-6 text-rose-500 shrink-0" />
          <div>
            <h4 className="font-semibold text-sm">Namespaces Telemetry Warning</h4>
            <p className="text-xs text-rose-600 dark:text-rose-200 mt-1">Standby namespace definitions active.</p>
          </div>
        </Card>
      ) : (
        <Card className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white/85 dark:bg-[#0c121e]/85 backdrop-blur-xl shadow-sm overflow-hidden">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
                  <TableHead>Namespace Name</TableHead>
                  <TableHead>Isolation Category</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Creation Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredNamespaces.length > 0 ? (
                  filteredNamespaces.map((ns, i) => (
                    <TableRow key={i} className="border-b border-slate-100 dark:border-slate-800/60 hover:bg-slate-50/80 dark:hover:bg-slate-900/40 transition-colors">
                      <TableCell className="font-mono text-xs font-semibold text-slate-800 dark:text-slate-100">
                        <div className="flex items-center gap-2">
                          <Folder className="h-4 w-4 text-purple-500 shrink-0" />
                          <span>{ns.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-semibold border ${
                          ns.name.startsWith('kube-') || ns.name === 'default'
                            ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20'
                            : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                        }`}>
                          {ns.name.startsWith('kube-') || ns.name === 'default' ? 'Cluster System' : 'User Workload'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold font-mono bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          {ns.status}
                        </span>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">{ns.creationTimestamp}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-slate-500 text-xs font-mono">
                      No namespaces found matching filter selection.
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

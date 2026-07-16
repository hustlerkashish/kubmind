import { useState } from 'react';
import { usePods, useNamespaces } from '@/hooks/useKubernetes';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent } from '@/components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { Loader } from '@/components/ui/Loader';
import { Cpu, RefreshCw, Terminal, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export function PodsPage() {
  const [selectedNamespace, setSelectedNamespace] = useState('all');
  const { data: pods, isLoading, isError, refetch, isRefetching } = usePods(selectedNamespace);
  const { data: namespaces } = useNamespaces();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Kubernetes Pods & Workloads"
        description="Live status, IP allocations, restart metrics, and node scheduling for active cluster pods"
        actions={
          <div className="flex items-center gap-2">
            <div className="relative">
              <select
                value={selectedNamespace}
                onChange={(e) => setSelectedNamespace(e.target.value)}
                className="rounded-lg border border-slate-800 bg-slate-900 py-1.5 px-3 text-xs text-slate-200 focus:border-blue-500 focus:outline-none font-mono"
              >
                <option value="all">Namespace: All Namespaces</option>
                {namespaces?.map((ns) => (
                  <option key={ns.name} value={ns.name}>
                    {ns.name}
                  </option>
                ))}
              </select>
            </div>
            <Button variant="outline" size="sm" onClick={() => refetch()} isLoading={isRefetching}>
              <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
              Sync Pods
            </Button>
          </div>
        }
      />

      {isLoading ? (
        <Loader text="Streaming live container pod status from Kubernetes API..." />
      ) : isError ? (
        <Card className="border-rose-500/30 bg-rose-950/20 text-rose-300 p-6 flex items-center gap-3">
          <AlertTriangle className="h-6 w-6 text-rose-400 shrink-0" />
          <div>
            <h4 className="font-semibold text-sm">Kubernetes Pod Stream Error</h4>
            <p className="text-xs text-rose-200 mt-1">Failed to query pod state from backend API. Standard standby telemetry displayed.</p>
          </div>
        </Card>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Pod Name</TableHead>
                  <TableHead>Namespace</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Pod IP / Host Node</TableHead>
                  <TableHead>Restarts</TableHead>
                  <TableHead>Containers</TableHead>
                  <TableHead className="text-right">Logs</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pods && pods.length > 0 ? (
                  pods.map((pod, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-mono text-xs font-semibold text-slate-100">
                        <div className="flex items-center gap-2">
                          <Cpu className="h-4 w-4 text-blue-400 shrink-0" />
                          <span>{pod.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-slate-400">{pod.namespace}</TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold font-mono ${
                            pod.status === 'Running'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          }`}
                        >
                          {pod.status}
                        </span>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-slate-300">
                        <div>{pod.podIP}</div>
                        <div className="text-[10px] text-slate-500">Node: {pod.nodeName}</div>
                      </TableCell>
                      <TableCell className="font-mono text-xs font-semibold text-amber-400">
                        {pod.restartCount}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-slate-400">{pod.containers}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" className="h-7 text-xs text-slate-300">
                          <Terminal className="h-3.5 w-3.5 mr-1 text-cyan-400" />
                          View Stderr
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-6 text-slate-500 text-xs">
                      No active pods found matching filter selection.
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

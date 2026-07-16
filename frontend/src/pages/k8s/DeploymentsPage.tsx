import { useState } from 'react';
import { useDeployments, useNamespaces } from '@/hooks/useKubernetes';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent } from '@/components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { Loader } from '@/components/ui/Loader';
import { Layers, RefreshCw, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export function DeploymentsPage() {
  const [selectedNamespace, setSelectedNamespace] = useState('all');
  const { data: deployments, isLoading, isError, refetch, isRefetching } = useDeployments(selectedNamespace);
  const { data: namespaces } = useNamespaces();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Kubernetes Deployments"
        description="Active workload deployments, replica scaling specs, rollouts, and target image revisions"
        actions={
          <div className="flex items-center gap-2">
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

            <Button variant="outline" size="sm" onClick={() => refetch()} isLoading={isRefetching}>
              <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
              Sync Deployments
            </Button>
          </div>
        }
      />

      {isLoading ? (
        <Loader text="Streaming live deployments from Kubernetes API..." />
      ) : isError ? (
        <Card className="border-rose-500/30 bg-rose-950/20 text-rose-300 p-6 flex items-center gap-3">
          <AlertTriangle className="h-6 w-6 text-rose-400 shrink-0" />
          <div>
            <h4 className="font-semibold text-sm">Deployments Telemetry Error</h4>
            <p className="text-xs text-rose-200 mt-1">Unable to communicate with API server.</p>
          </div>
        </Card>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Deployment Name</TableHead>
                  <TableHead>Namespace</TableHead>
                  <TableHead>Replicas Spec</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Container Image</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {deployments && deployments.length > 0 ? (
                  deployments.map((dep, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-mono text-xs font-semibold text-slate-100">
                        <div className="flex items-center gap-2">
                          <Layers className="h-4 w-4 text-indigo-400 shrink-0" />
                          <span>{dep.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-slate-400">{dep.namespace}</TableCell>
                      <TableCell className="font-mono text-xs font-semibold text-slate-200">
                        {dep.availableReplicas} / {dep.desiredReplicas} Ready
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold font-mono ${
                            dep.status === 'HEALTHY'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          }`}
                        >
                          {dep.status}
                        </span>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-slate-400 truncate max-w-xs">{dep.image}</TableCell>
                      <TableCell className="font-mono text-xs text-slate-400">{dep.creationTimestamp}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-6 text-slate-500 text-xs">
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

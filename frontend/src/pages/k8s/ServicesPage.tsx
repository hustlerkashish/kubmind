import { useState } from 'react';
import { useServices, useNamespaces } from '@/hooks/useKubernetes';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent } from '@/components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { Loader } from '@/components/ui/Loader';
import { Network, RefreshCw, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export function ServicesPage() {
  const [selectedNamespace, setSelectedNamespace] = useState('all');
  const { data: services, isLoading, isError, refetch, isRefetching } = useServices(selectedNamespace);
  const { data: namespaces } = useNamespaces();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Kubernetes Services"
        description="ClusterIP, NodePort, LoadBalancer service routing endpoints, cluster internal IPs, and port bindings"
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
              Sync Services
            </Button>
          </div>
        }
      />

      {isLoading ? (
        <Loader text="Streaming live Kubernetes services from backend API..." />
      ) : isError ? (
        <Card className="border-rose-500/30 bg-rose-950/20 text-rose-300 p-6 flex items-center gap-3">
          <AlertTriangle className="h-6 w-6 text-rose-400 shrink-0" />
          <div>
            <h4 className="font-semibold text-sm">Services Routing Warning</h4>
            <p className="text-xs text-rose-200 mt-1">Standby service definitions displayed.</p>
          </div>
        </Card>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Service Name</TableHead>
                  <TableHead>Namespace</TableHead>
                  <TableHead>Service Type</TableHead>
                  <TableHead>Cluster IP</TableHead>
                  <TableHead>Exposed Ports & Protocols</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {services && services.length > 0 ? (
                  services.map((svc, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-mono text-xs font-semibold text-slate-100">
                        <div className="flex items-center gap-2">
                          <Network className="h-4 w-4 text-emerald-400 shrink-0" />
                          <span>{svc.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-slate-400">{svc.namespace}</TableCell>
                      <TableCell>
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold font-mono bg-blue-500/20 text-blue-300 border border-blue-500/30">
                          {svc.type}
                        </span>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-slate-300">{svc.clusterIP}</TableCell>
                      <TableCell className="font-mono text-xs text-cyan-400 font-semibold">{svc.ports}</TableCell>
                      <TableCell className="font-mono text-xs text-slate-400">{svc.creationTimestamp}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-6 text-slate-500 text-xs">
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

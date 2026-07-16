import { useNodes } from '@/hooks/useKubernetes';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent } from '@/components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { Loader } from '@/components/ui/Loader';
import { Server, RefreshCw, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export function NodesPage() {
  const { data: nodes, isLoading, isError, refetch, isRefetching } = useNodes();

  return (
    <div className="space-y-6">
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

      {isLoading ? (
        <Loader text="Querying Kubernetes nodes from backend SDK..." />
      ) : isError ? (
        <Card className="border-rose-500/30 bg-rose-950/20 text-rose-300 p-6 flex items-center gap-3">
          <AlertTriangle className="h-6 w-6 text-rose-400 shrink-0" />
          <div>
            <h4 className="font-semibold text-sm">Cluster Nodes Connection Warning</h4>
            <p className="text-xs text-rose-200 mt-1">Standby node specs active.</p>
          </div>
        </Card>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <Table>
              <TableHeader>
                <TableRow>
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
                {nodes && nodes.length > 0 ? (
                  nodes.map((node, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-mono text-xs font-semibold text-slate-100">
                        <div className="flex items-center gap-2">
                          <Server className="h-4 w-4 text-cyan-400 shrink-0" />
                          <span>{node.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-purple-400 font-semibold">{node.role}</TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold font-mono ${
                            node.status === 'Ready'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          }`}
                        >
                          <CheckCircle2 className="h-3 w-3" />
                          {node.status}
                        </span>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-slate-300">{node.kubeletVersion}</TableCell>
                      <TableCell className="font-mono text-xs text-slate-400">{node.internalIP}</TableCell>
                      <TableCell className="font-mono text-xs text-amber-400 font-semibold">{node.cpuCapacity}</TableCell>
                      <TableCell className="font-mono text-xs text-purple-400 font-semibold">{node.memoryCapacity}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-6 text-slate-500 text-xs">
                      No nodes found.
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

import { useDeployments } from '@/hooks/useKubernetes';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Layers, AlertCircle } from 'lucide-react';

export function RecentDeploymentsTable() {
  const { data: deployments = [], isLoading } = useDeployments('all');

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-500">
              <Layers className="h-4 w-4" />
            </div>
            <div>
              <CardTitle>Workload Deployments</CardTitle>
              <CardDescription>Active Kubernetes deployment manifests and replica status</CardDescription>
            </div>
          </div>
          <span className="text-xs font-mono text-slate-500">
            {deployments.length} Active Deployments
          </span>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-32 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
          </div>
        ) : deployments.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Deployment Name</TableHead>
                <TableHead>Namespace</TableHead>
                <TableHead>Replicas</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Image</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {deployments.map((deployment, idx) => (
                <TableRow key={idx}>
                  <TableCell>
                    <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">{deployment.name}</div>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-slate-500">
                    {deployment.namespace}
                  </TableCell>
                  <TableCell className="font-mono text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {deployment.availableReplicas} / {deployment.desiredReplicas}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold tracking-wide ${
                        deployment.status === 'HEALTHY'
                          ? 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/30'
                          : 'bg-rose-500/20 text-rose-500 border border-rose-500/30'
                      }`}
                    >
                      {deployment.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs text-slate-500 font-mono truncate max-w-xs">
                    {deployment.image}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-8 text-slate-500">
            <AlertCircle className="h-7 w-7 mx-auto mb-2 opacity-50" />
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">No Active Deployments Found</p>
            <p className="text-xs text-slate-500 mt-0.5">Connect to a live Kubernetes cluster or namespace with deployed workloads.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

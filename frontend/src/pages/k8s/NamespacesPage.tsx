import { useNamespaces } from '@/hooks/useKubernetes';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent } from '@/components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { Loader } from '@/components/ui/Loader';
import { Folder, RefreshCw, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export function NamespacesPage() {
  const { data: namespaces, isLoading, isError, refetch, isRefetching } = useNamespaces();

  return (
    <div className="space-y-6">
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

      {isLoading ? (
        <Loader text="Fetching cluster namespaces from Kubernetes SDK..." />
      ) : isError ? (
        <Card className="border-rose-500/30 bg-rose-950/20 text-rose-300 p-6 flex items-center gap-3">
          <AlertTriangle className="h-6 w-6 text-rose-400 shrink-0" />
          <div>
            <h4 className="font-semibold text-sm">Namespaces Telemetry Warning</h4>
            <p className="text-xs text-rose-200 mt-1">Standby namespace definitions active.</p>
          </div>
        </Card>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Namespace Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Creation Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {namespaces && namespaces.length > 0 ? (
                  namespaces.map((ns, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-mono text-xs font-semibold text-slate-100">
                        <div className="flex items-center gap-2">
                          <Folder className="h-4 w-4 text-purple-400 shrink-0" />
                          <span>{ns.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          <CheckCircle2 className="h-3 w-3" />
                          {ns.status}
                        </span>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-slate-400">{ns.creationTimestamp}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-6 text-slate-500 text-xs">
                      No namespaces found.
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

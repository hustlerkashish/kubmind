import { useState } from 'react';
import { useEvents, useNamespaces } from '@/hooks/useKubernetes';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent } from '@/components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { Loader } from '@/components/ui/Loader';
import { AlertCircle, RefreshCw, AlertTriangle, Info } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export function EventsPage() {
  const [selectedNamespace, setSelectedNamespace] = useState('all');
  const { data: events, isLoading, isError, refetch, isRefetching } = useEvents(selectedNamespace);
  const { data: namespaces } = useNamespaces();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Kubernetes Cluster Events Log"
        description="Real-time warning events, scheduling logs, error probe failures, and status change stream"
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
              Sync Events
            </Button>
          </div>
        }
      />

      {isLoading ? (
        <Loader text="Streaming live events from Kubernetes CoreV1Api..." />
      ) : isError ? (
        <Card className="border-rose-500/30 bg-rose-950/20 text-rose-300 p-6 flex items-center gap-3">
          <AlertTriangle className="h-6 w-6 text-rose-400 shrink-0" />
          <div>
            <h4 className="font-semibold text-sm">Cluster Events Stream Error</h4>
            <p className="text-xs text-rose-200 mt-1">Standby events feed active.</p>
          </div>
        </Card>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Involved Resource</TableHead>
                  <TableHead>Namespace</TableHead>
                  <TableHead>Message Payload</TableHead>
                  <TableHead>Count</TableHead>
                  <TableHead>Timestamp</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {events && events.length > 0 ? (
                  events.map((evt, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        {evt.type === 'Warning' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold font-mono bg-rose-500/20 text-rose-300 border border-rose-500/30">
                            <AlertCircle className="h-3 w-3 text-rose-400" />
                            Warning
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold font-mono bg-blue-500/20 text-blue-300 border border-blue-500/30">
                            <Info className="h-3 w-3 text-blue-400" />
                            Normal
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="font-mono text-xs font-semibold text-slate-200">{evt.reason}</TableCell>
                      <TableCell className="font-mono text-xs text-cyan-400 font-medium">{evt.involvedObject}</TableCell>
                      <TableCell className="font-mono text-xs text-slate-400">{evt.namespace}</TableCell>
                      <TableCell className="text-xs text-slate-300 font-mono leading-relaxed truncate max-w-sm">
                        {evt.message}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-amber-400 font-semibold">{evt.count}</TableCell>
                      <TableCell className="font-mono text-xs text-slate-400 whitespace-nowrap">{evt.lastTimestamp}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-6 text-slate-500 text-xs">
                      No cluster events found matching filter selection.
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

import { useState } from 'react';
import { useEvents, useNamespaces } from '@/hooks/useKubernetes';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent } from '@/components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { Loader } from '@/components/ui/Loader';
import { AlertCircle, RefreshCw, AlertTriangle, Info, Search, Radio, BellRing, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export function EventsPage() {
  const [selectedNamespace, setSelectedNamespace] = useState('all');
  const [selectedType, setSelectedType] = useState<'all' | 'Warning' | 'Normal'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: events, isLoading, isError, refetch, isRefetching } = useEvents(selectedNamespace);
  const { data: namespaces } = useNamespaces();

  const filteredEvents = (events || []).filter((evt) => {
    const matchesType = selectedType === 'all' || evt.type === selectedType;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      evt.reason.toLowerCase().includes(q) ||
      evt.involvedObject.toLowerCase().includes(q) ||
      evt.message.toLowerCase().includes(q) ||
      evt.namespace.toLowerCase().includes(q);

    return matchesType && matchesSearch;
  });

  const totalEvents = events?.length || 0;
  const warningCount = (events || []).filter((e) => e.type === 'Warning').length;
  const normalCount = (events || []).filter((e) => e.type === 'Normal').length;

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title="Kubernetes Cluster Events Log"
        description="Real-time warning events, scheduling logs, error probe failures, and status change stream"
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
              Sync Events
            </Button>
          </div>
        }
      />

      {/* KPI Overview Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#0c121e] shadow-sm">
          <p className="text-[11px] font-mono font-semibold uppercase text-slate-500 dark:text-slate-400">Total Events</p>
          <div className="flex items-center justify-between mt-1">
            <span className="text-2xl font-bold font-mono text-slate-900 dark:text-white">{totalEvents}</span>
            <Radio className="h-5 w-5 text-indigo-500/80" />
          </div>
        </div>

        <div className="p-4 rounded-2xl border border-rose-500/30 bg-rose-500/5 shadow-sm">
          <p className="text-[11px] font-mono font-semibold uppercase text-rose-600 dark:text-rose-400">Warning Alerts</p>
          <div className="flex items-center justify-between mt-1">
            <span className="text-2xl font-bold font-mono text-rose-600 dark:text-rose-400">{warningCount}</span>
            <AlertCircle className="h-5 w-5 text-rose-500" />
          </div>
        </div>

        <div className="p-4 rounded-2xl border border-blue-500/30 bg-blue-500/5 shadow-sm">
          <p className="text-[11px] font-mono font-semibold uppercase text-blue-600 dark:text-blue-400">Normal Routine</p>
          <div className="flex items-center justify-between mt-1">
            <span className="text-2xl font-bold font-mono text-blue-600 dark:text-blue-400">{normalCount}</span>
            <CheckCircle2 className="h-5 w-5 text-blue-500" />
          </div>
        </div>

        <div className="p-4 rounded-2xl border border-amber-500/30 bg-amber-500/5 shadow-sm">
          <p className="text-[11px] font-mono font-semibold uppercase text-amber-600 dark:text-amber-400">Active Warning Rate</p>
          <div className="flex items-center justify-between mt-1">
            <span className="text-2xl font-bold font-mono text-amber-600 dark:text-amber-400">
              {totalEvents > 0 ? Math.round((warningCount / totalEvents) * 100) : 0}%
            </span>
            <BellRing className="h-5 w-5 text-amber-500" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 max-w-lg">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter by reason, involved pod, message..."
              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c121e] py-2 pl-9 pr-4 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:border-blue-500 focus:outline-none font-sans shadow-sm"
            />
          </div>

          <div className="flex items-center bg-white dark:bg-[#0c121e] border border-slate-200 dark:border-slate-800 rounded-xl p-1 shadow-sm shrink-0">
            {(['all', 'Warning', 'Normal'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setSelectedType(t)}
                className={`px-3 py-1 rounded-lg text-xs font-mono font-medium transition-all ${
                  selectedType === t
                    ? t === 'Warning'
                      ? 'bg-rose-600 text-white shadow-sm'
                      : 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {t === 'all' ? 'All Types' : t}
              </button>
            ))}
          </div>
        </div>

        <div className="text-xs font-mono text-slate-500 flex items-center gap-2">
          <span>Showing {filteredEvents.length} of {totalEvents} Events</span>
        </div>
      </div>

      {isLoading ? (
        <Loader text="Streaming live events from Kubernetes CoreV1Api..." />
      ) : isError ? (
        <Card className="border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-300 p-6 flex items-center gap-3">
          <AlertTriangle className="h-6 w-6 text-rose-500 shrink-0" />
          <div>
            <h4 className="font-semibold text-sm">Cluster Events Stream Error</h4>
            <p className="text-xs text-rose-600 dark:text-rose-200 mt-1">Standby events feed active.</p>
          </div>
        </Card>
      ) : (
        <Card className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white/85 dark:bg-[#0c121e]/85 backdrop-blur-xl shadow-sm overflow-hidden">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
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
                {filteredEvents.length > 0 ? (
                  filteredEvents.map((evt, i) => (
                    <TableRow key={i} className="border-b border-slate-100 dark:border-slate-800/60 hover:bg-slate-50/80 dark:hover:bg-slate-900/40 transition-colors">
                      <TableCell>
                        {evt.type === 'Warning' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold font-mono bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                            <AlertCircle className="h-3 w-3 text-rose-500" />
                            Warning
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold font-mono bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                            <Info className="h-3 w-3 text-blue-500" />
                            Normal
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="font-mono text-xs font-semibold text-slate-800 dark:text-slate-200">{evt.reason}</TableCell>
                      <TableCell className="font-mono text-xs text-cyan-600 dark:text-cyan-400 font-semibold">{evt.involvedObject}</TableCell>
                      <TableCell className="font-mono text-xs text-slate-500 dark:text-slate-400">{evt.namespace}</TableCell>
                      <TableCell className="text-xs text-slate-700 dark:text-slate-300 font-mono leading-relaxed truncate max-w-sm">
                        {evt.message}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-amber-600 dark:text-amber-400 font-semibold">{evt.count}</TableCell>
                      <TableCell className="font-mono text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">{evt.lastTimestamp}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-slate-500 text-xs font-mono">
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

import { useState } from 'react';
import { useIncidents, useUpdateIncidentStatus } from '@/hooks/useIncidents';
import { Incident } from '@/services/incidentService';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent } from '@/components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { Loader } from '@/components/ui/Loader';
import { Button } from '@/components/ui/Button';
import { IncidentTimelineModal } from '@/components/incidents/IncidentTimelineModal';

import {
  RefreshCw,
  Search,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import { useToast } from '@/context/ToastContext';

export function IncidentCenterPage() {
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedNamespace] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeIncident, setActiveIncident] = useState<Incident | null>(null);

  const { data: incidents = [], isLoading, refetch, isRefetching } = useIncidents(selectedStatus, selectedNamespace);
  const updateStatusMutation = useUpdateIncidentStatus();
  const { success } = useToast();

  const handleStatusChange = (id: string, newStatus: string) => {
    updateStatusMutation.mutate(
      { id, status: newStatus },
      {
        onSuccess: () => {
          success('Incident Updated', `Status changed to ${newStatus}`);
          if (activeIncident && activeIncident.id === id) {
            setActiveIncident({ ...activeIncident, status: newStatus });
          }
        },
      }
    );
  };

  const filteredIncidents = (incidents || []).filter(
    (inc) =>
      inc.podName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inc.incidentCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inc.reason.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const criticalCount = (incidents || []).filter((i) => i.severity === 'CRITICAL').length;
  const oomCount = (incidents || []).filter((i) => i.reason === 'OOMKilled').length;
  const openCount = (incidents || []).filter((i) => i.status !== 'RESOLVED').length;

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title="Incident Center & Automated Root Cause Analysis"
        description="Persistent cluster failure tracking, CrashLoopBackOff/OOMKilled highlights, lifecycle status rotation, and AI timeline inspection"
        actions={
          <Button variant="outline" size="sm" onClick={() => refetch()} isLoading={isRefetching}>
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
            Sync Incidents
          </Button>
        }
      />

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
          <p className="text-[11px] font-mono text-slate-500">Total Recorded Incidents</p>
          <p className="text-2xl font-bold text-slate-800 dark:text-slate-100 font-mono mt-1">{incidents.length}</p>
        </div>

        <div className="rounded-xl border border-rose-500/30 bg-rose-500/5 p-4">
          <p className="text-[11px] font-mono text-rose-500">Critical Container Failures</p>
          <p className="text-2xl font-bold text-rose-500 font-mono mt-1">{criticalCount}</p>
        </div>

        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
          <p className="text-[11px] font-mono text-amber-500">OOMKilled Events</p>
          <p className="text-2xl font-bold text-amber-500 font-mono mt-1">{oomCount}</p>
        </div>

        <div className="rounded-xl border border-blue-500/30 bg-blue-500/5 p-4">
          <p className="text-[11px] font-mono text-blue-500">Unresolved Active Alerts</p>
          <p className="text-2xl font-bold text-blue-500 font-mono mt-1">{openCount}</p>
        </div>
      </div>

      {/* Table Controls */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter by code, pod, or reason..."
              className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 py-2 pl-9 pr-4 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:border-blue-500 focus:outline-none font-mono"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 py-2 px-3 text-xs text-slate-800 dark:text-slate-200 focus:border-blue-500 focus:outline-none font-mono"
            >
              <option value="all">Status: All States</option>
              <option value="OPEN">Status: OPEN</option>
              <option value="INVESTIGATING">Status: INVESTIGATING</option>
              <option value="RESOLVED">Status: RESOLVED</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Incidents Data Table */}
      {isLoading ? (
        <Loader text="Fetching incidents from database..." />
      ) : (
        <Card>
          <CardContent className="pt-6">
            {filteredIncidents.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Cluster & Pod</TableHead>
                    <TableHead>Failure Reason</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>Lifecycle Status</TableHead>
                    <TableHead>Detected</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredIncidents.map((inc) => (
                    <TableRow key={inc.id}>
                      <TableCell className="font-mono text-xs font-semibold text-blue-500">
                        {inc.incidentCode}
                      </TableCell>
                      <TableCell>
                        <div className="text-xs font-semibold text-slate-800 dark:text-slate-100">{inc.podName}</div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          {inc.clusterName} • {inc.namespace}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                            ['CrashLoopBackOff', 'OOMKilled'].includes(inc.reason)
                              ? 'bg-rose-500/20 text-rose-500 border border-rose-500/30'
                              : 'bg-amber-500/20 text-amber-500 border border-amber-500/30'
                          }`}
                        >
                          {inc.reason}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold font-mono ${
                            inc.severity === 'CRITICAL'
                              ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                              : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                          }`}
                        >
                          {inc.severity}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-semibold font-mono ${
                            inc.status === 'RESOLVED'
                              ? 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/30'
                              : inc.status === 'INVESTIGATING'
                              ? 'bg-amber-500/20 text-amber-500 border border-amber-500/30'
                              : 'bg-rose-500/20 text-rose-500 border border-rose-500/30'
                          }`}
                        >
                          {inc.status}
                        </span>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-slate-500">{inc.detectedAt}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm" onClick={() => setActiveIncident(inc)}>
                          <Sparkles className="h-3 w-3 mr-1 text-cyan-500" />
                          Timeline & RCA
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-12 text-slate-500">
                <ShieldCheck className="h-10 w-10 mx-auto mb-3 text-emerald-500 opacity-80" />
                <p className="text-base font-semibold text-slate-800 dark:text-slate-200">Zero Incident Alerts Recorded</p>
                <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                  No container failures or abnormal pod events have been detected in your database.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Timeline Modal */}
      <IncidentTimelineModal
        incident={activeIncident}
        onClose={() => setActiveIncident(null)}
        onUpdateStatus={handleStatusChange}
      />
    </div>
  );
}

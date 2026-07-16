import { useState } from 'react';
import { useIncidents } from '@/hooks/useIncidents';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Bot, Terminal, Sparkles, CheckCircle2 } from 'lucide-react';
import { Incident } from '@/services/incidentService';

export function RecentIncidentsTable() {
  const { data: incidents = [], isLoading } = useIncidents('all', 'all');
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);

  const handleRunRca = (incident: Incident) => {
    setSelectedIncident(incident);
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Active Incident Alerts</CardTitle>
            <CardDescription>Detected pod crash logs and telemetry anomalies requiring Root Cause Analysis</CardDescription>
          </div>
          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
            incidents.length > 0
              ? 'bg-rose-500/10 border border-rose-500/20 text-rose-500'
              : 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-500'
          }`}>
            {incidents.length} Detected
          </span>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-48 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
          </div>
        ) : incidents.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Incident Code</TableHead>
                <TableHead>Cluster & Pod</TableHead>
                <TableHead>Error Reason</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {incidents.map((incident) => (
                <TableRow key={incident.id}>
                  <TableCell className="font-mono text-xs font-semibold text-blue-500">
                    {incident.incidentCode}
                  </TableCell>
                  <TableCell>
                    <div className="text-xs font-medium text-slate-800 dark:text-slate-200">{incident.podName}</div>
                    <div className="text-[10px] text-slate-500 font-mono">
                      {incident.clusterName} • {incident.namespace}
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                    {incident.reason}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold tracking-wide ${
                        incident.severity === 'CRITICAL'
                          ? 'bg-rose-500/20 text-rose-500 border border-rose-500/30'
                          : 'bg-amber-500/20 text-amber-500 border border-amber-500/30'
                      }`}
                    >
                      {incident.severity}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" onClick={() => handleRunRca(incident)}>
                      <Sparkles className="h-3 w-3 mr-1 text-cyan-500" />
                      Run AI RCA
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-10 text-slate-500">
            <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-emerald-500 opacity-80" />
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">No Active Incidents Detected</p>
            <p className="text-xs text-slate-500 mt-0.5">Your connected infrastructure and cluster workloads are operating normally.</p>
          </div>
        )}
      </CardContent>

      {/* AI Copilot RCA Inspection Modal */}
      {selectedIncident && (
        <Modal
          isOpen={!!selectedIncident}
          onClose={() => setSelectedIncident(null)}
          title={`AI Root Cause Analysis - ${selectedIncident.incidentCode}`}
        >
          <div className="space-y-4">
            <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs space-y-1 font-mono">
              <p><span className="text-slate-500">Pod Name:</span> {selectedIncident.podName}</p>
              <p><span className="text-slate-500">Namespace:</span> {selectedIncident.namespace}</p>
              <p><span className="text-slate-500">Cluster:</span> {selectedIncident.clusterName}</p>
              <p><span className="text-slate-500">Detected:</span> {selectedIncident.detectedAt}</p>
            </div>

            <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Bot className="h-4 w-4 text-cyan-500" />
                <h4 className="text-xs font-bold text-cyan-600 dark:text-cyan-400">AI Copilot Diagnostic Synthesis</h4>
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                {selectedIncident.aiSummary || 'Container crashed or exited. Inspect logs below for details.'}
              </p>
            </div>

            <div>
              <p className="text-[11px] font-semibold text-slate-500 mb-1">Container Stderr Dump:</p>
              <pre className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-900 text-[11px] text-rose-400 font-mono overflow-x-auto">
                {selectedIncident.logSnippet || 'No stderr output recorded.'}
              </pre>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={() => setSelectedIncident(null)}>
                Close
              </Button>
              <Button variant="primary">
                <Terminal className="h-3.5 w-3.5 mr-1.5" />
                Stream Container Logs
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </Card>
  );
}

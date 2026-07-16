import { useState } from 'react';
import { useRecommendations, useApplyRecommendation, useReports } from '@/hooks/useRecommendations';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent } from '@/components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { Loader } from '@/components/ui/Loader';
import { Button } from '@/components/ui/Button';
import { recommendationApi } from '@/services/recommendationService';

import {
  Sparkles,
  CheckCircle2,
  RefreshCw,
  FileText,
  FileSpreadsheet,
  Copy,
  CheckCircle,
} from 'lucide-react';
import { useToast } from '@/context/ToastContext';

export function RecommendationsPage() {
  const [activeTab, setActiveTab] = useState<'recommendations' | 'reports'>('recommendations');
  const [selectedType, setSelectedType] = useState('all');

  const { data: recommendations = [], isLoading, refetch, isRefetching } = useRecommendations(selectedType);
  const { data: reports = [] } = useReports();
  const applyMutation = useApplyRecommendation();

  const { success } = useToast();

  const handleApply = (id: string, actionSummary: string) => {
    applyMutation.mutate(id, {
      onSuccess: () => {
        success('Recommendation Applied', actionSummary);
      },
    });
  };

  const handleCopyCommand = (cmd: string) => {
    navigator.clipboard.writeText(cmd);
    success('Copied Command', cmd);
  };

  const resourceCount = recommendations.filter((r) => r.recommendationType === 'RESOURCE_ADJUSTMENT').length;
  const scalingCount = recommendations.filter((r) => r.recommendationType === 'REPLICA_SCALING').length;
  const patternCount = recommendations.filter((r) => r.recommendationType === 'RECURRING_INCIDENT').length;

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title="AI Recommendation Engine & Incident Reports"
        description="Automated resource tuning (CPU/RAM limits, replica auto-scaling), recurring error detection, and PDF/CSV audit exports"
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant={activeTab === 'recommendations' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setActiveTab('recommendations')}
            >
              <Sparkles className="h-3.5 w-3.5 mr-1.5" />
              Recommendations
            </Button>
            <Button
              variant={activeTab === 'reports' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setActiveTab('reports')}
            >
              <FileText className="h-3.5 w-3.5 mr-1.5" />
              Incident Reports
            </Button>
          </div>
        }
      />

      {/* Summary Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
          <p className="text-[11px] font-mono text-slate-500">Optimization Recommendations</p>
          <p className="text-2xl font-bold text-slate-800 dark:text-slate-100 font-mono mt-1">{recommendations.length}</p>
        </div>

        <div className="rounded-xl border border-cyan-500/30 bg-cyan-500/5 p-4">
          <p className="text-[11px] font-mono text-cyan-500">RAM Limit Adjustments</p>
          <p className="text-2xl font-bold text-cyan-500 font-mono mt-1">{resourceCount} Suggestion{resourceCount === 1 ? '' : 's'}</p>
        </div>

        <div className="rounded-xl border border-indigo-500/30 bg-indigo-500/5 p-4">
          <p className="text-[11px] font-mono text-indigo-500">Scaling Suggestions</p>
          <p className="text-2xl font-bold text-indigo-500 font-mono mt-1">{scalingCount} Suggestion{scalingCount === 1 ? '' : 's'}</p>
        </div>

        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
          <p className="text-[11px] font-mono text-amber-500">Recurring Alert Patterns</p>
          <p className="text-2xl font-bold text-amber-500 font-mono mt-1">{patternCount} Pattern{patternCount === 1 ? '' : 's'}</p>
        </div>
      </div>

      {activeTab === 'recommendations' ? (
        <>
          {/* Recommendations Filters & Controls */}
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 py-1.5 px-3 text-xs text-slate-800 dark:text-slate-200 focus:border-blue-500 focus:outline-none font-mono"
                >
                  <option value="all">Type: All Optimization Types</option>
                  <option value="RESOURCE_ADJUSTMENT">Memory / CPU Tuning</option>
                  <option value="REPLICA_SCALING">Replica Auto-Scaling</option>
                  <option value="RECURRING_INCIDENT">Recurring Alerts</option>
                </select>
              </div>

              <Button variant="outline" size="sm" onClick={() => refetch()} isLoading={isRefetching}>
                <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                Sync Engine
              </Button>
            </div>
          </Card>

          {/* Recommendations Table */}
          {isLoading ? (
            <Loader text="Analyzing cluster telemetry and incident logs..." />
          ) : (
            <Card>
              <CardContent className="pt-6">
                {recommendations.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Type</TableHead>
                        <TableHead>Target Pod & Namespace</TableHead>
                        <TableHead>Action Recommendation</TableHead>
                        <TableHead>Suggested Remediation Command</TableHead>
                        <TableHead>Tuning Delta</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recommendations.map((rec) => (
                        <TableRow key={rec.id}>
                          <TableCell>
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                                rec.recommendationType === 'RESOURCE_ADJUSTMENT'
                                  ? 'bg-cyan-500/20 text-cyan-500 border border-cyan-500/30'
                                  : rec.recommendationType === 'REPLICA_SCALING'
                                  ? 'bg-indigo-500/20 text-indigo-500 border border-indigo-500/30'
                                  : 'bg-amber-500/20 text-amber-500 border border-amber-500/30'
                              }`}
                            >
                              {rec.recommendationType}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="text-xs font-semibold text-slate-800 dark:text-slate-100">{rec.podName}</div>
                            <div className="text-[10px] text-slate-500 font-mono">
                              {rec.clusterName} • {rec.namespace}
                            </div>
                          </TableCell>
                          <TableCell className="text-xs text-slate-700 dark:text-slate-300 font-medium max-w-xs">
                            {rec.actionSummary}
                          </TableCell>
                          <TableCell className="font-mono text-xs text-cyan-500 max-w-sm truncate">
                            {rec.suggestedCommand ? (
                              <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-950 p-1.5 rounded border border-slate-200 dark:border-slate-800">
                                <code className="truncate">{rec.suggestedCommand}</code>
                                <button
                                  onClick={() => handleCopyCommand(rec.suggestedCommand!)}
                                  className="text-slate-400 hover:text-slate-900 dark:hover:text-white p-1"
                                >
                                  <Copy className="h-3 w-3" />
                                </button>
                              </div>
                            ) : (
                              'N/A'
                            )}
                          </TableCell>
                          <TableCell className="font-mono text-xs font-bold text-amber-500">
                            {rec.memoryAdjustment || rec.replicaAdjustment || rec.cpuAdjustment || 'Auto'}
                          </TableCell>
                          <TableCell className="text-right">
                            {rec.applied ? (
                              <span className="inline-flex items-center gap-1 text-xs font-mono font-semibold text-emerald-500">
                                <CheckCircle2 className="h-4 w-4" /> Applied
                              </span>
                            ) : (
                              <Button
                                variant="primary"
                                size="sm"
                                onClick={() => handleApply(rec.id, rec.actionSummary)}
                              >
                                Apply Spec
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-12 text-slate-500">
                    <CheckCircle className="h-10 w-10 mx-auto mb-3 text-emerald-500 opacity-80" />
                    <p className="text-base font-semibold text-slate-800 dark:text-slate-200">No Optimization Actions Required</p>
                    <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                      All cluster workloads are operating within optimal RAM, CPU, and replica resource specs.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </>
      ) : (
        /* Reports Export Section */
        <div className="space-y-4">
          <div className="mb-2">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 font-mono">
              Operational Incident Audit Reports (Daily, Weekly, Monthly)
            </h3>
            <p className="text-xs text-slate-500">
              Download structured reliability summary reports in PDF or CSV formats for team retrospectives.
            </p>
          </div>

          {reports.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {reports.map((report) => (
                <Card key={report.id} className="p-5 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded bg-blue-500/20 text-blue-500 border border-blue-500/30">
                        {report.reportType} REPORT
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">{report.generatedAt}</span>
                    </div>

                    <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 leading-tight mb-2">
                      {report.reportTitle}
                    </h4>

                    <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-mono text-xs space-y-1.5 mb-4">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Total Recorded:</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">{report.totalIncidents} Alerts</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Critical Failures:</span>
                        <span className="font-bold text-rose-500">{report.criticalCount} Outages</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Resolved Rate:</span>
                        <span className="font-bold text-emerald-500">
                          {Math.round((report.resolvedCount / Math.max(report.totalIncidents, 1)) * 100)}% Closed
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => recommendationApi.downloadCsv(report.id)}
                    >
                      <FileSpreadsheet className="h-3.5 w-3.5 mr-1.5 text-emerald-500" />
                      Export CSV
                    </Button>

                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => recommendationApi.downloadPdf(report.id)}
                    >
                      <FileText className="h-3.5 w-3.5 mr-1.5 text-blue-500" />
                      Export PDF
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-10 text-center text-slate-500">
              <FileText className="h-10 w-10 mx-auto mb-3 text-slate-400 opacity-60" />
              <p className="text-base font-semibold text-slate-800 dark:text-slate-200">No Generated Audit Reports</p>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                Incident reports are generated automatically when operational events are logged by your active infrastructure.
              </p>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

import { ReactElement } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  RefreshCw, Bot,
  CheckCircle, XCircle, Clock, GitBranch, Bell, AlertTriangle,
  AlertCircle
} from 'lucide-react';

import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/Button';
import { TelemetryWidget } from '@/components/dashboard/TelemetryWidget';
import { CpuTrendChart } from '@/components/dashboard/CpuTrendChart';
import { MemoryTrendChart } from '@/components/dashboard/MemoryTrendChart';
import { IncidentTrendChart } from '@/components/dashboard/IncidentTrendChart';
import { ClusterHealthWidget } from '@/components/dashboard/ClusterHealthWidget';
import { RecentIncidentsTable } from '@/components/dashboard/RecentIncidentsTable';
import { useToast } from '@/context/ToastContext';
import { apiClient } from '@/services/apiClient';
import { prometheusApi } from '@/services/prometheusService';

// ─── API fetchers ────────────────────────────────────────────────────────────

async function fetchDashboardSummary() {
  const res = await apiClient.get('/dashboard/summary');
  return res.data;
}

async function fetchCiCdRuns() {
  const res = await apiClient.get('/dashboard/cicd/runs');
  return res.data.data as any[];
}

async function fetchGrafanaAlerts() {
  const res = await apiClient.get('/dashboard/grafana/alerts');
  return res.data.data as any[];
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function ConnectionBadge({ connected }: { connected: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full font-medium ${
      connected
        ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
        : 'bg-slate-500/10 text-slate-500 border border-slate-500/20'
    }`}>
      <span className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
      {connected ? 'LIVE' : 'NOT CONNECTED'}
    </span>
  );
}

function CiCdRunRow({ run }: { run: any }) {
  const conclusionColor: Record<string, string> = {
    success: 'text-emerald-500',
    failure: 'text-rose-500',
    cancelled: 'text-slate-400',
    in_progress: 'text-cyan-500',
  };
  const conclusionIcon: Record<string, ReactElement> = {
    success: <CheckCircle className="h-4 w-4" />,
    failure: <XCircle className="h-4 w-4" />,
    in_progress: <Clock className="h-4 w-4 animate-spin" />,
  };
  const key = run.conclusion || run.status;
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-slate-200 dark:border-slate-800/50 last:border-0">
      <div className="flex items-center gap-3">
        <span className={conclusionColor[key] || 'text-slate-400'}>
          {conclusionIcon[key] || <Clock className="h-4 w-4" />}
        </span>
        <div>
          <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{run.name}</p>
          <p className="text-xs text-slate-500 flex items-center gap-1">
            <GitBranch className="h-3 w-3" />
            {run.branch} · <span className="font-mono">{run.commitSha}</span>
          </p>
        </div>
      </div>
      <div className="text-right">
        <span className={`text-xs font-semibold uppercase ${conclusionColor[key] || 'text-slate-400'}`}>
          {run.conclusion || run.status}
        </span>
        <p className="text-xs text-slate-500">{run.repo}</p>
      </div>
    </div>
  );
}

function GrafanaAlertRow({ alert }: { alert: any }) {
  const isFiring = alert.state === 'alerting';
  return (
    <div className="flex items-center justify-between py-2 border-b border-slate-200 dark:border-slate-800/50 last:border-0">
      <div className="flex items-center gap-2">
        <AlertTriangle className={`h-4 w-4 ${isFiring ? 'text-rose-500' : 'text-emerald-500'}`} />
        <span className="text-sm text-slate-800 dark:text-slate-200">{alert.name}</span>
      </div>
      <span className={`text-xs font-semibold uppercase px-2 py-0.5 rounded ${
        isFiring ? 'bg-rose-500/10 text-rose-500' : 'bg-emerald-500/10 text-emerald-500'
      }`}>
        {alert.state}
      </span>
    </div>
  );
}

// ─── Main Dashboard ──────────────────────────────────────────────────────────

export function DashboardPage() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();
  const navigate = useNavigate();
  const [isRefreshing, setIsRefreshing] = useState(false);

  // ── Real API queries with 30s auto-refresh ──
  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: fetchDashboardSummary,
    refetchInterval: 30_000,
    retry: 2,
  });

  const { data: cpuData } = useQuery({
    queryKey: ['metrics-cpu'],
    queryFn: () => prometheusApi.getCpuMetrics('1h'),
    refetchInterval: 30_000,
    retry: 1,
  });

  const { data: memData } = useQuery({
    queryKey: ['metrics-memory'],
    queryFn: () => prometheusApi.getMemoryMetrics('1h'),
    refetchInterval: 30_000,
    retry: 1,
  });

  const { data: cicdRuns } = useQuery({
    queryKey: ['cicd-runs'],
    queryFn: fetchCiCdRuns,
    refetchInterval: 60_000,
    retry: 1,
  });

  const { data: grafanaAlerts } = useQuery({
    queryKey: ['grafana-alerts'],
    queryFn: fetchGrafanaAlerts,
    refetchInterval: 60_000,
    retry: 1,
  });

  const metrics = summary?.metrics;
  const cluster = summary?.cluster;
  const cicd = summary?.cicd;
  const grafana = summary?.grafana;

  const isPrometheusLive = metrics?.livePrometheusConnected === true;
  const isK8sConnected = cluster?.connected === true;
  const isCicdConnected = cicd?.connected === true;
  const isGrafanaConnected = grafana?.connected === true;

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      await queryClient.invalidateQueries({ queryKey: ['metrics-cpu'] });
      await queryClient.invalidateQueries({ queryKey: ['metrics-memory'] });
      await queryClient.invalidateQueries({ queryKey: ['cicd-runs'] });
      await queryClient.invalidateQueries({ queryKey: ['grafana-alerts'] });
      success('Telemetry Synced', 'All active connections updated.');
    } catch {
      error('Refresh Failed', 'Could not reach server.');
    } finally {
      setTimeout(() => setIsRefreshing(false), 600);
    }
  };

  const cpuVal = metrics?.cpuPercent ?? null;
  const memVal = metrics?.memoryPercent ?? null;

  const telemetryCards = [
    {
      title: 'CPU Usage',
      value: cpuVal !== null ? `${cpuVal}%` : 'N/A',
      subtext: isPrometheusLive ? 'Live Prometheus' : 'Not Connected',
      change: cpuVal !== null ? (cpuVal > 70 ? '+High' : 'Normal') : 'No Data',
      isPositive: cpuVal !== null ? cpuVal <= 70 : false,
      type: 'cpu' as const,
    },
    {
      title: 'Memory Usage',
      value: memVal !== null ? `${memVal}%` : 'N/A',
      subtext: isPrometheusLive ? 'Live Prometheus' : 'Not Connected',
      change: memVal !== null ? (memVal > 80 ? '+High' : 'Normal') : 'No Data',
      isPositive: memVal !== null ? memVal <= 80 : false,
      type: 'memory' as const,
    },
    {
      title: 'Network I/O',
      value: metrics?.networkMBps != null ? `${metrics.networkMBps} MB/s` : 'N/A',
      subtext: isPrometheusLive ? 'Inbound traffic' : 'Not Connected',
      change: isPrometheusLive ? 'Live' : 'No Data',
      isPositive: isPrometheusLive,
      type: 'cpu' as const,
    },
    {
      title: 'Disk Usage',
      value: metrics?.diskPercent != null ? `${metrics.diskPercent}%` : 'N/A',
      subtext: isPrometheusLive ? 'Storage utilization' : 'Not Connected',
      change: isPrometheusLive ? 'Live' : 'No Data',
      isPositive: isPrometheusLive,
      type: 'memory' as const,
    },
    {
      title: 'Total Pods',
      value: isK8sConnected ? (cluster?.totalPods ?? 0) : 'N/A',
      subtext: isK8sConnected ? (cluster?.clusterName ?? 'K8s Cluster') : 'Not Connected',
      change: isK8sConnected ? 'Running' : 'No Connection',
      isPositive: isK8sConnected,
      type: 'running_pods' as const,
    },
    {
      title: 'Total Nodes',
      value: isK8sConnected ? (cluster?.totalNodes ?? 0) : 'N/A',
      subtext: isK8sConnected ? (cluster?.kubernetesVersion ?? 'K8s') : 'Not Connected',
      change: isK8sConnected ? (cluster?.status ?? 'Online') : 'No Connection',
      isPositive: isK8sConnected,
      type: 'nodes' as const,
    },
    {
      title: 'CI/CD Runs',
      value: isCicdConnected ? (cicd?.totalRuns ?? 0) : 'N/A',
      subtext: isCicdConnected ? (cicd?.configuredRepo || 'GitHub Actions') : 'Not Connected',
      change: isCicdConnected ? `${cicd?.successRate ?? 0}% pass` : 'No Connection',
      isPositive: isCicdConnected && (cicd?.successRate ?? 0) >= 80,
      type: 'deployments' as const,
    },
    {
      title: 'Firing Alerts',
      value: isGrafanaConnected ? (grafana?.firingAlerts ?? 0) : 'N/A',
      subtext: isGrafanaConnected ? 'Grafana Alerts' : 'Not Connected',
      change: isGrafanaConnected ? ((grafana?.firingAlerts ?? 0) > 0 ? 'Action Needed' : 'Clear') : 'No Connection',
      isPositive: isGrafanaConnected && (grafana?.firingAlerts ?? 0) === 0,
      type: 'incidents' as const,
    },
  ];

  return (
    <div className="space-y-6 pb-12">

      {/* Page Header */}
      <PageHeader
        title="KubeMind Command Center"
        description="Real-time Infrastructure, Connected Repository CI/CD Pipelines & Operational Monitoring"
        actions={
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={handleRefresh} isLoading={isRefreshing}>
              <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
              Sync Telemetry
            </Button>
            <Button variant="primary" size="sm" onClick={() => navigate('/copilot')}>
              <Bot className="h-3.5 w-3.5 mr-1.5" />
              AI Copilot
            </Button>
          </div>
        }
      />

      {/* Integration Status Bar */}
      <div className="flex flex-wrap gap-3">
        {[
          { label: 'Prometheus', connected: isPrometheusLive },
          { label: 'Kubernetes', connected: isK8sConnected },
          { label: 'GitHub Actions', connected: isCicdConnected },
          { label: 'Grafana', connected: isGrafanaConnected },
        ].map(src => (
          <div key={src.label} className="flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <span className={`w-2 h-2 rounded-full ${src.connected ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
            <span className="text-slate-700 dark:text-slate-300 font-medium">{src.label}:</span>
            <span className={src.connected ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-slate-500 dark:text-slate-400'}>
              {src.connected ? 'Connected' : 'Not Connected'}
            </span>
          </div>
        ))}
      </div>

      {/* 8 Metric Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        {summaryLoading
          ? Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-24 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 animate-pulse shadow-sm" />
            ))
          : telemetryCards.map((card, idx) => (
              <TelemetryWidget key={idx} data={card} />
            ))
        }
      </div>

      {/* Metric Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <CpuTrendChart data={cpuData?.series?.[0]?.datapoints ?? []} />
        <MemoryTrendChart data={memData?.series?.[0]?.datapoints ?? []} />
        <IncidentTrendChart data={[]} />
      </div>

      {/* Cluster & Incidents */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RecentIncidentsTable />
        </div>
        <div>
          <ClusterHealthWidget />
        </div>
      </div>

      {/* GitHub Actions & Grafana Alerts Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* GitHub Actions CI/CD Panel */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <GitBranch className="h-4 w-4 text-indigo-500" />
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">GitHub Actions Pipeline</h3>
              <ConnectionBadge connected={isCicdConnected} />
            </div>
            {isCicdConnected && cicd && (
              <div className="flex items-center gap-3 text-xs">
                <span className="text-emerald-500 font-semibold">{cicd.successRuns} Passed</span>
                <span className="text-rose-500 font-semibold">{cicd.failedRuns} Failed</span>
                <span className="text-slate-500">{cicd.successRate}% Success</span>
              </div>
            )}
          </div>

          <div className="space-y-0">
            {isCicdConnected && (cicdRuns ?? cicd?.recentRuns ?? []).length > 0 ? (
              (cicdRuns ?? cicd?.recentRuns ?? []).slice(0, 5).map((run: any, i: number) => (
                <CiCdRunRow key={i} run={run} />
              ))
            ) : (
              <div className="text-center py-8 px-4 text-slate-500 text-sm">
                <AlertCircle className="h-8 w-8 mx-auto mb-2 text-slate-400 opacity-60" />
                <p className="font-medium text-slate-700 dark:text-slate-300">
                  {isCicdConnected ? 'No recent workflow runs found in connected repository.' : 'GitHub Integration Not Connected'}
                </p>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  {isCicdConnected
                    ? 'Trigger a workflow or push a commit to your connected GitHub repository to view live execution metrics.'
                    : 'Configure your GITHUB_TOKEN and GITHUB_REPOS in the Settings tab to monitor real workflow pipelines.'
                  }
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Grafana Alerts Panel */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-amber-500" />
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Grafana Live Alerts</h3>
              <ConnectionBadge connected={isGrafanaConnected} />
            </div>
            {isGrafanaConnected && grafana && (
              <div className="flex items-center gap-3 text-xs">
                <span className="text-rose-500 font-semibold">{grafana.firingAlerts} Firing</span>
                <span className="text-emerald-500 font-semibold">{grafana.okAlerts} Healthy</span>
              </div>
            )}
          </div>

          <div className="space-y-0">
            {isGrafanaConnected && (grafanaAlerts ?? []).length > 0 ? (
              (grafanaAlerts ?? []).map((alert: any, i: number) => (
                <GrafanaAlertRow key={i} alert={alert} />
              ))
            ) : (
              <div className="text-center py-8 px-4 text-slate-500 text-sm">
                <Bell className="h-8 w-8 mx-auto mb-2 text-slate-400 opacity-60" />
                <p className="font-medium text-slate-700 dark:text-slate-300">
                  {isGrafanaConnected ? 'No active alerts in Grafana.' : 'Grafana Integration Not Connected'}
                </p>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  {isGrafanaConnected
                    ? 'All connected Grafana alert rules are currently in OK status.'
                    : 'Provide GRAFANA_URL and GRAFANA_API_KEY in Settings to import live alerting states.'
                  }
                </p>
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}

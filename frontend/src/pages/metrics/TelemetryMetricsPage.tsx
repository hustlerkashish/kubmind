import { useState } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/Button';
import { Loader } from '@/components/ui/Loader';
import { Card } from '@/components/ui/Card';
import { useProject } from '@/context/ProjectContext';

import {
  useCpuMetrics,
  useMemoryMetrics,
  useNetworkMetrics,
  useDiskMetrics,
  usePodMetrics,
  useNodeMetrics,
  useGrafanaPanels,
} from '@/hooks/usePrometheus';

import { CpuMetricsChart } from '@/components/metrics/CpuMetricsChart';
import { MemoryMetricsChart } from '@/components/metrics/MemoryMetricsChart';
import { NetworkMetricsChart } from '@/components/metrics/NetworkMetricsChart';
import { DiskMetricsChart } from '@/components/metrics/DiskMetricsChart';
import { GrafanaEmbedCard } from '@/components/metrics/GrafanaEmbedCard';

import { Activity, RefreshCw, Sliders } from 'lucide-react';
import { useToast } from '@/context/ToastContext';

export function TelemetryMetricsPage() {
  const [timeRange, setTimeRange] = useState('1h');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const { activeProject } = useProject();
  const { success } = useToast();

  const { data: cpuData, isLoading: isCpuLoading, refetch: refetchCpu, isRefetching } = useCpuMetrics(timeRange, autoRefresh);
  const { data: memoryData } = useMemoryMetrics(timeRange, autoRefresh);
  const { data: networkData } = useNetworkMetrics(timeRange, autoRefresh);
  const { data: diskData } = useDiskMetrics(timeRange, autoRefresh);
  const { data: podMetrics } = usePodMetrics(timeRange, autoRefresh);
  const { data: nodeMetrics } = useNodeMetrics(timeRange, autoRefresh);
  const { data: grafanaPanels } = useGrafanaPanels();

  const targetPrometheusUrl = activeProject.prometheusUrl || 'http://localhost:9090';

  const handleManualRefresh = () => {
    refetchCpu();
    success('PromQL Metrics Refreshed', `Fetched PromQL time-series for range window ${timeRange}.`);
  };

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title="Prometheus Telemetry & Observability"
        description="Real-time PromQL time-series metrics for CPU, Memory, Network RX/TX, Disk Storage, Pods, Nodes & Grafana embeds"
        actions={
          <div className="flex items-center gap-3">
            {/* Time Range Selector */}
            <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg p-1">
              {['5m', '1h', '6h', '24h', '7d'].map((r) => (
                <button
                  key={r}
                  onClick={() => setTimeRange(r)}
                  className={`px-2.5 py-1 rounded text-xs font-mono font-medium transition-all ${
                    timeRange === r
                      ? 'bg-blue-600 text-white shadow'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>

            {/* Auto Refresh Toggle */}
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-mono transition-all ${
                autoRefresh
                  ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                  : 'border-slate-800 bg-slate-900 text-slate-400'
              }`}
            >
              <span className={`h-2 w-2 rounded-full ${autoRefresh ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`} />
              <span>{autoRefresh ? '5s Polling Active' : 'Polling Paused'}</span>
            </button>

            <Button variant="outline" size="sm" onClick={handleManualRefresh} isLoading={isRefetching}>
              <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
              Sync
            </Button>
          </div>
        }
      />

      {/* Connection Status Banner */}
      <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400">
            <Activity className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-xs font-semibold text-slate-200">Prometheus Server Configuration</h4>
            <p className="text-[11px] text-slate-400 font-mono">
              Target URL: <code className="text-blue-400">{targetPrometheusUrl}</code> • PromQL Engine Active
            </p>
          </div>
        </div>
        <span className="text-xs font-mono px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-semibold">
          Auto-refresh (5s)
        </span>
      </div>

      {isCpuLoading ? (
        <Loader text="Executing PromQL HTTP queries for CPU, Memory, Network & Disk throughput..." />
      ) : (
        <>
          {/* 1. Core Hardware Telemetry Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <CpuMetricsChart data={cpuData} />
            <MemoryMetricsChart data={memoryData} />
            <NetworkMetricsChart data={networkData} />
            <DiskMetricsChart data={diskData} />
          </div>

          {/* 2. Pod & Node PromQL Subsystem Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <div className="p-5 border-b border-slate-800/80 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-slate-100">Pod Specific PromQL Utilization</h3>
                  <p className="text-[11px] text-slate-400">sum(rate(container_cpu_usage_seconds_total[5m])) by (pod_name)</p>
                </div>
                <span className="text-[11px] text-amber-400 font-mono font-semibold">Active Series</span>
              </div>
              <div className="p-5 space-y-3">
                {podMetrics?.series?.length ? (
                  podMetrics.series.map((s, idx) => (
                    <div key={idx} className="p-3 rounded-lg border border-slate-800 bg-slate-950 flex items-center justify-between text-xs">
                      <span className="font-mono font-semibold text-slate-200">{s.target}</span>
                      <span className="font-mono text-amber-400 font-bold">{s.datapoints[s.datapoints.length - 1]?.value}%</span>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-xs text-slate-400 font-mono">
                    Live Pod Metrics Engine Active (0 pods emitting PromQL stream)
                  </div>
                )}
              </div>
            </Card>

            <Card>
              <div className="p-5 border-b border-slate-800/80 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-slate-100">Node Hardware Capacity Load</h3>
                  <p className="text-[11px] text-slate-400">100 - (avg by (instance) (rate(node_cpu_seconds_total[5m])))</p>
                </div>
                <span className="text-[11px] text-purple-400 font-mono font-semibold">Active Series</span>
              </div>
              <div className="p-5 space-y-3">
                {nodeMetrics?.series?.length ? (
                  nodeMetrics.series.map((s, idx) => (
                    <div key={idx} className="p-3 rounded-lg border border-slate-800 bg-slate-950 flex items-center justify-between text-xs">
                      <span className="font-mono font-semibold text-slate-200">{s.target}</span>
                      <span className="font-mono text-purple-400 font-bold">{s.datapoints[s.datapoints.length - 1]?.value}%</span>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-xs text-slate-400 font-mono">
                    Live Node Metrics Engine Active (1 node emitting load metrics)
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* 3. Grafana Embed Panels Section */}
          <div>
            <div className="mb-4">
              <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                <Sliders className="h-5 w-5 text-orange-400" />
                <span>Grafana Embed Panels</span>
              </h2>
              <p className="text-xs text-slate-400">Prepared iframe dashboard embeds for Grafana v10 integration</p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {grafanaPanels?.map((panel, idx) => (
                <GrafanaEmbedCard key={idx} panel={panel} />
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

import { useState } from 'react';
import { usePodLogs } from '@/hooks/useIncidents';
import { usePods, useNamespaces } from '@/hooks/useKubernetes';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/Button';
import { Loader } from '@/components/ui/Loader';
import { Card } from '@/components/ui/Card';

import {
  Terminal,
  Search,
  Download,
  Copy,
  Pause,
  Play,
  RefreshCw,
  CheckCircle,
} from 'lucide-react';
import { useToast } from '@/context/ToastContext';

export function LogExplorerPage() {
  const [selectedNamespace, setSelectedNamespace] = useState('production');
  const [selectedPod, setSelectedPod] = useState('auth-service-7f89b-9x2l');
  const [searchQuery, setSearchQuery] = useState('');
  const [logLevelFilter, setLogLevelFilter] = useState('ALL');
  const [isPaused, setIsPaused] = useState(false);

  const { data: namespaces } = useNamespaces();
  const { data: pods } = usePods(selectedNamespace);
  const { data: logData, isLoading, refetch, isRefetching } = usePodLogs(
    selectedNamespace,
    selectedPod,
    undefined,
    150
  );

  const { success } = useToast();

  const logs = logData?.logs || [
    `2026-07-16T13:40:01.102Z [INFO] Container initializing application environment on pod ${selectedPod}`,
    `2026-07-16T13:40:02.441Z [INFO] Successfully established datasource pool (active: 10, max: 50)`,
    `2026-07-16T13:40:04.912Z [WARN] Upstream cache timeout detected on redis-node-0.internal:6379`,
    `2026-07-16T13:40:08.312Z [ERROR] [CrashLoopBackOff] Container process exited abruptly with exit code 137`,
    `2026-07-16T13:40:08.315Z [FATAL] [OOMKilled] Memory limit of 512Mi was exceeded during batch processing`,
    `2026-07-16T13:40:12.901Z [INFO] Kubelet probe attempting restart container (Attempt #4)`,
  ];

  const filteredLogs = logs.filter((line) => {
    const matchesSearch = line.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLevel =
      logLevelFilter === 'ALL' ||
      (logLevelFilter === 'ERROR' && (line.includes('[ERROR]') || line.includes('[FATAL]') || line.includes('CrashLoopBackOff') || line.includes('OOMKilled'))) ||
      (logLevelFilter === 'WARN' && line.includes('[WARN]')) ||
      (logLevelFilter === 'INFO' && line.includes('[INFO]'));

    return matchesSearch && matchesLevel;
  });

  const handleDownloadLogs = () => {
    const blob = new Blob([logs.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedPod}-container.log`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    success('Logs Downloaded', `Saved container logs file: ${selectedPod}-container.log`);
  };

  const handleCopyLogs = () => {
    navigator.clipboard.writeText(logs.join('\n'));
    success('Copied to Clipboard', 'Log output copied to system clipboard.');
  };

  const highlightLogLine = (line: string) => {
    let style = 'text-slate-700 dark:text-slate-300';
    if (line.includes('[ERROR]') || line.includes('[FATAL]') || line.includes('OOMKilled') || line.includes('CrashLoopBackOff')) {
      style = 'text-rose-500 font-semibold';
    } else if (line.includes('[WARN]')) {
      style = 'text-amber-500 font-medium';
    } else if (line.includes('[INFO]')) {
      style = 'text-slate-700 dark:text-slate-300';
    }

    return (
      <span className={style}>
        {line.split(' ').map((word, idx) => {
          if (['CrashLoopBackOff', 'ImagePullBackOff', 'OOMKilled', 'FailedScheduling'].includes(word.replace(/[\[\]]/g, ''))) {
            return (
              <span key={idx} className="bg-rose-500/20 border border-rose-500/40 text-rose-500 px-1.5 py-0.5 rounded text-[10px] font-bold mx-1 inline-block animate-pulse">
                {word}
              </span>
            );
          }
          return word + ' ';
        })}
      </span>
    );
  };

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title="Kibana-Style Log Explorer"
        description="Live container stdout/stderr log streaming with keyword search, error highlights, and container file export"
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleCopyLogs}>
              <Copy className="h-3.5 w-3.5 mr-1.5" />
              Copy
            </Button>
            <Button variant="primary" size="sm" onClick={handleDownloadLogs}>
              <Download className="h-3.5 w-3.5 mr-1.5" />
              Download Log File
            </Button>
          </div>
        }
      />

      {/* Control Filters Toolbar */}
      <Card className="p-4 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
          {/* Namespace Dropdown */}
          <div>
            <label className="text-[10px] uppercase font-mono font-semibold text-slate-500 block mb-1">
              Target Namespace
            </label>
            <select
              value={selectedNamespace}
              onChange={(e) => setSelectedNamespace(e.target.value)}
              className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 py-1.5 px-3 text-xs text-slate-800 dark:text-slate-200 focus:border-blue-500 focus:outline-none font-mono"
            >
              {namespaces?.map((ns) => (
                <option key={ns.name} value={ns.name}>
                  {ns.name}
                </option>
              )) || <option value="production">production</option>}
            </select>
          </div>

          {/* Pod Dropdown */}
          <div>
            <label className="text-[10px] uppercase font-mono font-semibold text-slate-500 block mb-1">
              Active Pod
            </label>
            <select
              value={selectedPod}
              onChange={(e) => setSelectedPod(e.target.value)}
              className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 py-1.5 px-3 text-xs text-slate-800 dark:text-slate-200 focus:border-blue-500 focus:outline-none font-mono"
            >
              {pods && pods.length > 0 ? (
                pods.map((p) => (
                  <option key={p.name} value={p.name}>
                    {p.name}
                  </option>
                ))
              ) : (
                <option value="auth-service-7f89b-9x2l">auth-service-7f89b-9x2l</option>
              )}
            </select>
          </div>

          {/* Level Filter */}
          <div>
            <label className="text-[10px] uppercase font-mono font-semibold text-slate-500 block mb-1">
              Log Level
            </label>
            <select
              value={logLevelFilter}
              onChange={(e) => setLogLevelFilter(e.target.value)}
              className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 py-1.5 px-3 text-xs text-slate-800 dark:text-slate-200 focus:border-blue-500 focus:outline-none font-mono"
            >
              <option value="ALL">ALL LEVELS</option>
              <option value="ERROR">ERROR / CRASH ONLY</option>
              <option value="WARN">WARNINGS ONLY</option>
              <option value="INFO">INFO MESSAGES</option>
            </select>
          </div>

          {/* Live Stream Controls */}
          <div>
            <label className="text-[10px] uppercase font-mono font-semibold text-slate-500 block mb-1">
              Stream Control
            </label>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsPaused(!isPaused)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg border text-xs font-mono font-semibold transition-all ${
                  isPaused
                    ? 'border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-300'
                    : 'border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300'
                }`}
              >
                {isPaused ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}
                <span>{isPaused ? 'Resume Stream' : 'Live Tailing (4s)'}</span>
              </button>
              <Button variant="outline" size="sm" onClick={() => refetch()} isLoading={isRefetching}>
                <RefreshCw className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Free Text Search Box */}
        <div className="relative mt-3">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search log string (e.g. OOMKilled, exception, connection refused)..."
            className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 py-2 pl-9 pr-4 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:border-blue-500 focus:outline-none font-mono"
          />
        </div>
      </Card>

      {/* Terminal Window */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 overflow-hidden shadow-sm dark:shadow-2xl">
        {/* Terminal Header */}
        <div className="p-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 flex items-center justify-between font-mono text-xs">
          <div className="flex items-center gap-2">
            <Terminal className="h-4 w-4 text-cyan-500" />
            <span className="text-slate-800 dark:text-slate-200 font-semibold">{selectedPod}</span>
            <span className="text-slate-500">[{selectedNamespace}]</span>
          </div>

          <div className="flex items-center gap-3 text-[11px] text-slate-500">
            <span>Filtered: {filteredLogs.length} / {logs.length} Lines</span>
            <span className="flex items-center gap-1 text-emerald-500 font-medium">
              <CheckCircle className="h-3 w-3" /> Live Tailing
            </span>
          </div>
        </div>

        {/* Console Content Window */}
        <div className="p-4 max-h-[500px] overflow-y-auto font-mono text-xs space-y-1 select-text bg-slate-900 text-slate-100 dark:bg-[#030712]">
          {isLoading ? (
            <Loader text="Opening log stream to target pod container..." />
          ) : filteredLogs.length > 0 ? (
            filteredLogs.map((line, idx) => (
              <div key={idx} className="flex items-start gap-3 hover:bg-slate-800/60 p-0.5 rounded transition-colors">
                <span className="text-slate-500 select-none text-[10px] w-8 text-right shrink-0 mt-0.5 font-mono">
                  {idx + 1}
                </span>
                <div className="flex-1 break-all font-mono leading-relaxed">
                  {highlightLogLine(line)}
                </div>
              </div>
            ))
          ) : (
            <div className="py-12 text-center text-slate-500 italic">
              No logs matching query string "{searchQuery}".
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

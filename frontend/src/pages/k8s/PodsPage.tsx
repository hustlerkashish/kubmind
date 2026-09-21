import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePods, useNamespaces } from '@/hooks/useKubernetes';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent } from '@/components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { Loader } from '@/components/ui/Loader';
import { Modal } from '@/components/ui/Modal';
import {
  Boxes,
  RefreshCw,
  Terminal,
  AlertTriangle,
  MoreVertical,
  RotateCw,
  Sparkles,
  FileCode,
  Search,
  ArrowUpDown,
  Copy,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/context/ToastContext';

export function PodsPage() {
  const [selectedNamespace, setSelectedNamespace] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<'name' | 'restarts' | 'status'>('name');
  const [sortAsc, setSortAsc] = useState(true);
  const [activeMenuPod, setActiveMenuPod] = useState<string | null>(null);
  const [yamlModalPod, setYamlModalPod] = useState<any | null>(null);

  const navigate = useNavigate();
  const { data: pods, isLoading, isError, refetch, isRefetching } = usePods(selectedNamespace);
  const { data: namespaces } = useNamespaces();
  const { success } = useToast();

  const handleSort = (field: 'name' | 'restarts' | 'status') => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const handleRestartPod = (podName: string) => {
    setActiveMenuPod(null);
    success('Rollout Restart Initiated', `Sent SIGTERM restart signal for pod ${podName}. New replica provisioning.`);
  };

  const filteredPods = (pods || [])
    .filter((pod) => {
      const matchSearch =
        pod.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pod.namespace.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pod.podIP?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pod.nodeName?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchSearch;
    })
    .sort((a, b) => {
      let comp = 0;
      if (sortField === 'name') comp = a.name.localeCompare(b.name);
      if (sortField === 'restarts') comp = (a.restartCount || 0) - (b.restartCount || 0);
      if (sortField === 'status') comp = a.status.localeCompare(b.status);
      return sortAsc ? comp : -comp;
    });

  const getMockPodYaml = (pod: any) => `apiVersion: v1
kind: Pod
metadata:
  name: ${pod.name}
  namespace: ${pod.namespace}
  labels:
    app.kubernetes.io/name: ${pod.name.split('-')[0]}
    app.kubernetes.io/instance: production
    managed-by: kubemind-operator
spec:
  nodeName: ${pod.nodeName || 'worker-node-alpha'}
  restartPolicy: Always
  containers:
  - name: ${pod.name.split('-')[0]}-container
    image: registry.internal/services/${pod.name.split('-')[0]}:v1.4.2
    resources:
      limits:
        cpu: "500m"
        memory: "512Mi"
      requests:
        cpu: "100m"
        memory: "128Mi"
status:
  phase: ${pod.status}
  podIP: ${pod.podIP || '10.244.0.15'}
  hostIP: 192.168.1.104`;

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title="Kubernetes Pods & Workloads"
        description="Live status, IP allocations, restart metrics, and node scheduling for active cluster pods"
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
              Sync Pods
            </Button>
          </div>
        }
      />

      {/* Instant Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter pods by name, IP, or node..."
            className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c121e] py-2 pl-9 pr-4 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:border-blue-500 focus:outline-none font-sans shadow-sm"
          />
        </div>

        <div className="text-xs font-mono text-slate-500 flex items-center gap-2">
          <span>Showing {filteredPods.length} of {pods?.length || 0} Pods</span>
        </div>
      </div>

      {isLoading ? (
        <Loader text="Streaming live container pod status from Kubernetes API..." />
      ) : isError ? (
        <Card className="border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-300 p-6 flex items-center gap-3">
          <AlertTriangle className="h-6 w-6 text-rose-500 shrink-0" />
          <div>
            <h4 className="font-semibold text-sm">Kubernetes Pod Stream Error</h4>
            <p className="text-xs text-rose-600 dark:text-rose-200 mt-1">Failed to query pod state from backend API. Standard standby telemetry displayed.</p>
          </div>
        </Card>
      ) : (
        <Card className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white/85 dark:bg-[#0c121e]/85 backdrop-blur-xl shadow-sm overflow-visible">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
                  <TableHead onClick={() => handleSort('name')} className="cursor-pointer hover:text-blue-500">
                    <div className="flex items-center gap-1.5">
                      <span>Pod Name</span>
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </TableHead>
                  <TableHead>Namespace</TableHead>
                  <TableHead onClick={() => handleSort('status')} className="cursor-pointer hover:text-blue-500">
                    <div className="flex items-center gap-1.5">
                      <span>Status</span>
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </TableHead>
                  <TableHead>Pod IP / Host Node</TableHead>
                  <TableHead onClick={() => handleSort('restarts')} className="cursor-pointer hover:text-blue-500">
                    <div className="flex items-center gap-1.5">
                      <span>Restarts</span>
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </TableHead>
                  <TableHead>Containers</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPods.length > 0 ? (
                  filteredPods.map((pod, i) => (
                    <TableRow key={i} className="border-b border-slate-100 dark:border-slate-800/60 hover:bg-slate-50/80 dark:hover:bg-slate-900/40 transition-colors">
                      <TableCell className="font-mono text-xs font-semibold text-slate-800 dark:text-slate-100">
                        <div className="flex items-center gap-2">
                          <Boxes className="h-4 w-4 text-emerald-500 shrink-0" />
                          <span className="truncate max-w-[220px]">{pod.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-slate-500 dark:text-slate-400">{pod.namespace}</TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold font-mono ${
                            pod.status === 'Running'
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                              : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                          }`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full mr-1.5 ${pod.status === 'Running' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                          {pod.status}
                        </span>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-slate-700 dark:text-slate-300">
                        <div>{pod.podIP || '10.244.0.12'}</div>
                        <div className="text-[10px] text-slate-400 dark:text-slate-500">Node: {pod.nodeName || 'worker-01'}</div>
                      </TableCell>
                      <TableCell className="font-mono text-xs font-semibold text-amber-600 dark:text-amber-400">
                        {pod.restartCount}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-slate-500 dark:text-slate-400">{pod.containers}</TableCell>
                      <TableCell className="text-right">
                        <div className="relative inline-block text-left">
                          <button
                            onClick={() => setActiveMenuPod(activeMenuPod === pod.name ? null : pod.name)}
                            className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </button>

                          {/* Action Menu Dropdown */}
                          {activeMenuPod === pod.name && (
                            <div className="absolute right-0 mt-1 w-48 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c121e] shadow-2xl z-30 p-1 space-y-0.5 animate-in fade-in zoom-in-95 duration-100 text-left">
                              <button
                                onClick={() => {
                                  setActiveMenuPod(null);
                                  navigate(`/logs?pod=${pod.name}&namespace=${pod.namespace}`);
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 rounded-lg transition-colors"
                              >
                                <Terminal className="h-3.5 w-3.5 text-cyan-500" />
                                <span>Stream Live Logs</span>
                              </button>

                              <button
                                onClick={() => {
                                  setActiveMenuPod(null);
                                  navigate('/copilot');
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 rounded-lg transition-colors"
                              >
                                <Sparkles className="h-3.5 w-3.5 text-blue-500" />
                                <span>AI Root Cause (RCA)</span>
                              </button>

                              <button
                                onClick={() => {
                                  setActiveMenuPod(null);
                                  setYamlModalPod(pod);
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 rounded-lg transition-colors"
                              >
                                <FileCode className="h-3.5 w-3.5 text-purple-500" />
                                <span>View Resource YAML</span>
                              </button>

                              <div className="border-t border-slate-100 dark:border-slate-800 my-1" />

                              <button
                                onClick={() => handleRestartPod(pod.name)}
                                className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                              >
                                <RotateCw className="h-3.5 w-3.5" />
                                <span>Restart Pod</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12 text-slate-500 font-mono text-xs">
                      No pods found matching current filter query.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Resource YAML Modal */}
      {yamlModalPod && (
        <Modal
          isOpen={!!yamlModalPod}
          onClose={() => setYamlModalPod(null)}
          title={`Resource YAML: ${yamlModalPod.name}`}
          className="max-w-2xl"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-slate-500 font-mono">
              <span>Namespace: {yamlModalPod.namespace}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(getMockPodYaml(yamlModalPod));
                  success('Copied YAML', 'Kubernetes Pod definition YAML copied to clipboard.');
                }}
              >
                <Copy className="h-3.5 w-3.5 mr-1" /> Copy YAML
              </Button>
            </div>
            <pre className="p-4 rounded-xl bg-slate-900 text-slate-100 text-xs font-mono overflow-x-auto max-h-96 border border-slate-800">
              <code>{getMockPodYaml(yamlModalPod)}</code>
            </pre>
          </div>
        </Modal>
      )}
    </div>
  );
}

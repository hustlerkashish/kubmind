export interface MetricCardData {
  title: string;
  value: string | number;
  subtext: string;
  change: string;
  isPositive: boolean;
  type: 'clusters' | 'running_pods' | 'failed_pods' | 'deployments' | 'nodes' | 'cpu' | 'memory' | 'incidents';
}

export interface ChartDataPoint {
  timestamp: string;
  value: number;
  secondaryValue?: number;
}

export interface IncidentRecord {
  id: string;
  cluster: string;
  namespace: string;
  podName: string;
  reason: string;
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  status: 'OPEN' | 'INVESTIGATING' | 'RESOLVED';
  detectedAt: string;
  aiConfidence: number;
  container: string;
  errorLogSnippet: string;
}

export interface DeploymentRecord {
  id: string;
  name: string;
  cluster: string;
  namespace: string;
  desiredReplicas: number;
  availableReplicas: number;
  status: 'HEALTHY' | 'DEGRADED' | 'PROGRESSING';
  updatedAt: string;
  image: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  description: string;
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  timeAgo: string;
  read: boolean;
}

export interface ClusterNodeHealth {
  name: string;
  role: 'Control Plane' | 'Worker Node';
  status: 'Ready' | 'NotReady';
  cpuUtilization: number;
  memoryUtilization: number;
  podsCount: number;
}

// 8 Core Telemetry Summary Metrics
export const mockMetrics: MetricCardData[] = [
  {
    title: 'Total Clusters',
    value: '4',
    subtext: '4/4 Multi-region Online',
    change: '+1 from last month',
    isPositive: true,
    type: 'clusters',
  },
  {
    title: 'Running Pods',
    value: '138',
    subtext: '96.2% Workload Health',
    change: '+12 active pods',
    isPositive: true,
    type: 'running_pods',
  },
  {
    title: 'Failed Pods',
    value: '4',
    subtext: 'CrashLoopBackOff & OOM',
    change: '-2 resolved',
    isPositive: false,
    type: 'failed_pods',
  },
  {
    title: 'Deployments',
    value: '28',
    subtext: '27 Healthy • 1 Degraded',
    change: 'All specs synced',
    isPositive: true,
    type: 'deployments',
  },
  {
    title: 'Kubernetes Nodes',
    value: '16',
    subtext: '16/16 Kubelet Ready',
    change: '100% Availability',
    isPositive: true,
    type: 'nodes',
  },
  {
    title: 'CPU Usage',
    value: '74.2%',
    subtext: 'Core Load 23.8 / 32 Cores',
    change: '+4.1% peak load',
    isPositive: false,
    type: 'cpu',
  },
  {
    title: 'Memory Usage',
    value: '81.6%',
    subtext: '104.4 GB / 128 GB Allocated',
    change: '+2.8% surge',
    isPositive: false,
    type: 'memory',
  },
  {
    title: 'Active Incidents',
    value: '3',
    subtext: 'AI Copilot Ready',
    change: 'Requires Attention',
    isPositive: false,
    type: 'incidents',
  },
];

// Time Series Datapoints for Charts
export const mockCpuTrend: ChartDataPoint[] = [
  { timestamp: '00:00', value: 42 },
  { timestamp: '03:00', value: 38 },
  { timestamp: '06:00', value: 55 },
  { timestamp: '09:00', value: 78 },
  { timestamp: '12:00', value: 89 },
  { timestamp: '15:00', value: 72 },
  { timestamp: '18:00', value: 81 },
  { timestamp: '21:00', value: 74 },
];

export const mockMemoryTrend: ChartDataPoint[] = [
  { timestamp: '00:00', value: 65 },
  { timestamp: '03:00', value: 64 },
  { timestamp: '06:00', value: 68 },
  { timestamp: '09:00', value: 75 },
  { timestamp: '12:00', value: 84 },
  { timestamp: '15:00', value: 82 },
  { timestamp: '18:00', value: 80 },
  { timestamp: '21:00', value: 81.6 },
];

export const mockIncidentTrend: ChartDataPoint[] = [
  { timestamp: '00:00', value: 1 },
  { timestamp: '04:00', value: 0 },
  { timestamp: '08:00', value: 2 },
  { timestamp: '12:00', value: 5 },
  { timestamp: '16:00', value: 3 },
  { timestamp: '20:00', value: 3 },
];

// Recent Incidents Data
export const mockRecentIncidents: IncidentRecord[] = [
  {
    id: 'INC-9042',
    cluster: 'k8s-prod-us-east',
    namespace: 'payment-service',
    podName: 'payment-processor-78d9b-x92q',
    reason: 'OOMKilled (Exit Code 137)',
    severity: 'CRITICAL',
    status: 'OPEN',
    detectedAt: '3 mins ago',
    aiConfidence: 98,
    container: 'payment-worker',
    errorLogSnippet: 'java.lang.OutOfMemoryError: Java heap space. Terminating threadPool executor.',
  },
  {
    id: 'INC-9041',
    cluster: 'k8s-prod-us-east',
    namespace: 'authentication',
    podName: 'auth-gateway-55c4d-m41k',
    reason: 'CrashLoopBackOff',
    severity: 'CRITICAL',
    status: 'INVESTIGATING',
    detectedAt: '12 mins ago',
    aiConfidence: 94,
    container: 'oauth-proxy',
    errorLogSnippet: 'Fatal: Unable to connect to Redis cache node redis-master.internal:6379 (Connection refused)',
  },
  {
    id: 'INC-9040',
    cluster: 'k8s-stage-us-west',
    namespace: 'ingress-nginx',
    podName: 'ingress-nginx-controller-88c9-k1z0',
    reason: 'High CPU Throttle (89%)',
    severity: 'WARNING',
    status: 'OPEN',
    detectedAt: '45 mins ago',
    aiConfidence: 87,
    container: 'nginx-ingress',
    errorLogSnippet: 'SSL_do_handshake() failed (SSL: error:14094418:SSL routines:ssl3_read_bytes:tlsv1 alert unknown ca)',
  },
  {
    id: 'INC-9039',
    cluster: 'k8s-prod-us-east',
    namespace: 'telemetry',
    podName: 'prometheus-k8s-0',
    reason: 'Volume IO Limit Exceeded',
    severity: 'WARNING',
    status: 'RESOLVED',
    detectedAt: '2 hours ago',
    aiConfidence: 91,
    container: 'prometheus-collector',
    errorLogSnippet: 'level=error ts=2026-07-16T11:20:00Z caller=main.go:812 msg="TSDB WAL compaction failed: storage full"',
  },
  {
    id: 'INC-9038',
    cluster: 'k8s-eu-central',
    namespace: 'analytics',
    podName: 'spark-worker-99a-2n',
    reason: 'ImagePullBackOff',
    severity: 'WARNING',
    status: 'RESOLVED',
    detectedAt: '4 hours ago',
    aiConfidence: 99,
    container: 'executor',
    errorLogSnippet: 'Failed to pull image "registry.internal/spark-job:v2.4": rpc error: code = NotFound',
  },
];

// Recent Deployments Data
export const mockRecentDeployments: DeploymentRecord[] = [
  {
    id: 'DEP-101',
    name: 'payment-processor-api',
    cluster: 'k8s-prod-us-east',
    namespace: 'payment-service',
    desiredReplicas: 8,
    availableReplicas: 8,
    status: 'HEALTHY',
    updatedAt: '10 mins ago',
    image: 'docker.io/kubemind/payment-api:v2.4.1',
  },
  {
    id: 'DEP-102',
    name: 'auth-gateway-proxy',
    cluster: 'k8s-prod-us-east',
    namespace: 'authentication',
    desiredReplicas: 4,
    availableReplicas: 3,
    status: 'DEGRADED',
    updatedAt: '24 mins ago',
    image: 'docker.io/kubemind/auth-proxy:v1.8.0',
  },
  {
    id: 'DEP-103',
    name: 'user-profile-service',
    cluster: 'k8s-prod-us-east',
    namespace: 'user-management',
    desiredReplicas: 6,
    availableReplicas: 6,
    status: 'HEALTHY',
    updatedAt: '1 hour ago',
    image: 'docker.io/kubemind/user-service:v3.1.0',
  },
  {
    id: 'DEP-104',
    name: 'ai-copilot-engine',
    cluster: 'k8s-stage-us-west',
    namespace: 'ai-system',
    desiredReplicas: 2,
    availableReplicas: 2,
    status: 'PROGRESSING',
    updatedAt: '2 hours ago',
    image: 'docker.io/kubemind/ai-copilot-service:v1.0.0',
  },
  {
    id: 'DEP-105',
    name: 'mcp-tool-orchestrator',
    cluster: 'k8s-stage-us-west',
    namespace: 'ai-system',
    desiredReplicas: 2,
    availableReplicas: 2,
    status: 'HEALTHY',
    updatedAt: '5 hours ago',
    image: 'docker.io/kubemind/mcp-server:v1.2.0',
  },
];

// Notifications Feed Data
export const mockNotifications: NotificationItem[] = [
  {
    id: 'NOTIF-1',
    title: 'Pod Crash Detected (OOMKilled)',
    description: 'payment-processor-78d9b-x92q exceeded 512Mi memory limit in namespace payment-service.',
    severity: 'CRITICAL',
    timeAgo: '3 mins ago',
    read: false,
  },
  {
    id: 'NOTIF-2',
    title: 'CrashLoopBackOff Alert',
    description: 'auth-gateway-55c4d-m41k restarted 8 times in the last 15 minutes.',
    severity: 'CRITICAL',
    timeAgo: '12 mins ago',
    read: false,
  },
  {
    id: 'NOTIF-3',
    title: 'High CPU Throttling Warning',
    description: 'ingress-nginx-controller-88c9-k1z0 reached 89% CPU limit quota.',
    severity: 'WARNING',
    timeAgo: '45 mins ago',
    read: true,
  },
  {
    id: 'NOTIF-4',
    title: 'Cluster Node Ready',
    description: 'Node worker-node-04 joined cluster k8s-prod-us-east successfully.',
    severity: 'INFO',
    timeAgo: '2 hours ago',
    read: true,
  },
];

// Cluster Nodes Status Allocation Matrix
export const mockClusterNodes: ClusterNodeHealth[] = [
  { name: 'control-plane-01', role: 'Control Plane', status: 'Ready', cpuUtilization: 48, memoryUtilization: 62, podsCount: 22 },
  { name: 'worker-node-01', role: 'Worker Node', status: 'Ready', cpuUtilization: 82, memoryUtilization: 88, podsCount: 38 },
  { name: 'worker-node-02', role: 'Worker Node', status: 'Ready', cpuUtilization: 76, memoryUtilization: 81, podsCount: 42 },
  { name: 'worker-node-03', role: 'Worker Node', status: 'Ready', cpuUtilization: 68, memoryUtilization: 74, podsCount: 40 },
];

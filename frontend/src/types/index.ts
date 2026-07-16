export interface User {
  id: string;
  username: string;
  email: string;
  fullName: string;
  role?: string;
  roles?: string[] | Set<string>;
  avatarUrl?: string;
  createdAt?: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken?: string;
  tokenType: string;
  user: User;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

export interface ClusterSummary {
  totalNodes: number;
  totalPods: number;
  unhealthyPods: number;
  cpuUsagePercentage: number;
  memoryUsagePercentage: number;
  activeAlerts: number;
}

export interface IncidentAlert {
  id: string;
  namespace: string;
  podName: string;
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  reason: string;
  message: string;
  detectedAt: string;
  status: 'OPEN' | 'INVESTIGATING' | 'RESOLVED';
}

-- ==============================================================================
-- KubeMind Database Incidents Schema Migration (V2)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS incidents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    incident_code VARCHAR(50) NOT NULL UNIQUE,
    cluster_name VARCHAR(100) NOT NULL,
    namespace VARCHAR(100) NOT NULL,
    pod_name VARCHAR(150) NOT NULL,
    container_name VARCHAR(100),
    reason VARCHAR(100) NOT NULL, -- CrashLoopBackOff, ImagePullBackOff, OOMKilled, FailedScheduling
    severity VARCHAR(50) NOT NULL,  -- CRITICAL, WARNING, INFO
    status VARCHAR(50) NOT NULL DEFAULT 'OPEN', -- OPEN, INVESTIGATING, RESOLVED
    log_snippet TEXT,
    ai_summary TEXT,
    detected_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Seed Initial Cluster Incidents
INSERT INTO incidents (incident_code, cluster_name, namespace, pod_name, container_name, reason, severity, status, log_snippet, ai_summary)
VALUES
(
    'INC-9042',
    'k8s-prod-us-east',
    'payment-service',
    'payment-processor-78d9b-x92q',
    'payment-worker',
    'OOMKilled',
    'CRITICAL',
    'OPEN',
    'java.lang.OutOfMemoryError: Java heap space. Process terminated by kernel (Exit Code 137).',
    'Memory limit of 512Mi was exceeded due to unhandled heap allocation in heavy batch processing threads.'
),
(
    'INC-9041',
    'k8s-prod-us-east',
    'authentication',
    'auth-gateway-55c4d-m41k',
    'oauth-proxy',
    'CrashLoopBackOff',
    'CRITICAL',
    'INVESTIGATING',
    'Fatal: Connection refused on redis-master.internal:6379. Restarting container (Attempt 8).',
    'Container failed connection probe to dependency Redis cache host.'
),
(
    'INC-9040',
    'k8s-stage-us-west',
    'ingress-nginx',
    'ingress-nginx-controller-88c9-k1z0',
    'nginx-ingress',
    'ImagePullBackOff',
    'WARNING',
    'OPEN',
    'Failed to pull image "registry.internal/ingress:v1.9.9": rpc error: code = NotFound desc = failed to pull',
    'Target image tag does not exist in internal container image repository.'
),
(
    'INC-9039',
    'k8s-prod-us-east',
    'telemetry',
    'prometheus-worker-0',
    'collector',
    'FailedScheduling',
    'WARNING',
    'RESOLVED',
    '0/4 nodes are available: 4 Insufficient memory capacity limit.',
    'Pods remained pending due to memory resource request exceeding node pool allocations.'
)
ON CONFLICT DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_incidents_status ON incidents(status);
CREATE INDEX IF NOT EXISTS idx_incidents_reason ON incidents(reason);

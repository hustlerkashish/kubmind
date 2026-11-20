-- ==============================================================================
-- KubeMind Recommendation Engine & Reports Schema Migration (V4)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS recommendations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    incident_code VARCHAR(50),
    cluster_name VARCHAR(100) NOT NULL,
    namespace VARCHAR(100) NOT NULL,
    pod_name VARCHAR(150) NOT NULL,
    recommendation_type VARCHAR(50) NOT NULL, -- RESOURCE_ADJUSTMENT, REPLICA_SCALING, COMMAND, RECURRING_INCIDENT
    action_summary TEXT NOT NULL,
    suggested_command TEXT,
    cpu_adjustment VARCHAR(50),
    memory_adjustment VARCHAR(50),
    replica_adjustment VARCHAR(50),
    recurring_count INT DEFAULT 1,
    applied BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS incident_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_title VARCHAR(200) NOT NULL,
    report_type VARCHAR(50) NOT NULL, -- DAILY, WEEKLY, MONTHLY
    total_incidents INT DEFAULT 0,
    critical_count INT DEFAULT 0,
    resolved_count INT DEFAULT 0,
    summary_json TEXT,
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Seed Initial Recommendations & Telemetry Reports
INSERT INTO recommendations (incident_code, cluster_name, namespace, pod_name, recommendation_type, action_summary, suggested_command, memory_adjustment, applied)
VALUES
(
    'INC-9042',
    'k8s-prod-us-east',
    'payment-service',
    'payment-processor-78d9b-x92q',
    'RESOURCE_ADJUSTMENT',
    'Increase container RAM memory request from 512Mi to 1024Mi to eliminate OOMKilled kernel termination.',
    'kubectl set resources deployment/payment-processor -n payment-service --limits=memory=1024Mi --requests=memory=512Mi',
    '512Mi -> 1024Mi',
    FALSE
),
(
    'INC-9041',
    'k8s-prod-us-east',
    'authentication',
    'auth-gateway-55c4d-m41k',
    'REPLICA_SCALING',
    'Scale deployment workload replicas from 4 to 8 to distribute incoming ingress HTTP load spike.',
    'kubectl scale deployment/auth-gateway-proxy --replicas=8 -n authentication',
    '4 -> 8 Replicas',
    FALSE
),
(
    'INC-9040',
    'k8s-prod-us-east',
    'payment-service',
    'payment-worker-4b21a-p4q1',
    'RECURRING_INCIDENT',
    'Recurring CrashLoopBackOff detected (4 occurrences in past 24 hours). Check downstream Redis pool limits.',
    'kubectl rollout restart deployment/payment-worker -n payment-service',
    'Memory Pressure',
    FALSE
)
ON CONFLICT DO NOTHING;

INSERT INTO incident_reports (report_title, report_type, total_incidents, critical_count, resolved_count, summary_json)
VALUES
(
    'Daily Cluster Reliability Summary - July 16, 2026',
    'DAILY',
    12,
    3,
    9,
    '{"period":"24h","healthScore":"94.2%","topError":"OOMKilled","mttr":"14m"}'
),
(
    'Weekly Operations & Incident Velocity Report (Week 28)',
    'WEEKLY',
    48,
    11,
    42,
    '{"period":"7d","healthScore":"96.8%","topError":"CrashLoopBackOff","mttr":"18m"}'
),
(
    'Monthly Executive Infrastructure Resilience Audit',
    'MONTHLY',
    184,
    32,
    178,
    '{"period":"30d","healthScore":"98.5%","topError":"OOMKilled","mttr":"12m"}'
)
ON CONFLICT DO NOTHING;

-- ==============================================================================
-- KubeMind Production Normalized Database Schema Migration (V5)
-- Enterprise 3NF Architecture for Kubernetes AI Incident Platform
-- ==============================================================================

-- 1. Extend Authentication & Security Tables
ALTER TABLE refresh_tokens 
    ADD COLUMN IF NOT EXISTS ip_address VARCHAR(45),
    ADD COLUMN IF NOT EXISTS browser VARCHAR(100),
    ADD COLUMN IF NOT EXISTS operating_system VARCHAR(100),
    ADD COLUMN IF NOT EXISTS device_name VARCHAR(100),
    ADD COLUMN IF NOT EXISTS last_used_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE password_resets 
    ADD COLUMN IF NOT EXISTS ip_address VARCHAR(45),
    ADD COLUMN IF NOT EXISTS user_agent TEXT;

-- 2. Infrastructure Domain (Clusters, Namespaces, Nodes, Pods, Metrics, Events)
CREATE TABLE IF NOT EXISTS clusters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cluster_name VARCHAR(100) NOT NULL UNIQUE,
    provider VARCHAR(50) NOT NULL, -- AWS-EKS, Azure-AKS, Google-GKE, Minikube, On-Prem
    region VARCHAR(50),
    environment VARCHAR(50) NOT NULL DEFAULT 'production', -- production, staging, development
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE', -- ACTIVE, INACTIVE, MAINTENANCE
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS namespaces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cluster_id UUID NOT NULL REFERENCES clusters(id) ON DELETE CASCADE,
    namespace_name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_cluster_namespace UNIQUE (cluster_id, namespace_name)
);

CREATE TABLE IF NOT EXISTS nodes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cluster_id UUID NOT NULL REFERENCES clusters(id) ON DELETE CASCADE,
    node_name VARCHAR(150) NOT NULL,
    cpu_capacity VARCHAR(50) NOT NULL,
    memory_capacity VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'READY', -- READY, NOT_READY, SCHEDULING_DISABLED
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_cluster_node UNIQUE (cluster_id, node_name)
);

CREATE TABLE IF NOT EXISTS pods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    namespace_id UUID NOT NULL REFERENCES namespaces(id) ON DELETE CASCADE,
    node_id UUID REFERENCES nodes(id) ON DELETE SET NULL,
    pod_name VARCHAR(150) NOT NULL,
    deployment_name VARCHAR(150),
    replica_set VARCHAR(150),
    daemon_set VARCHAR(150),
    image_name VARCHAR(255) NOT NULL,
    pod_uid VARCHAR(100) UNIQUE,
    status VARCHAR(50) NOT NULL DEFAULT 'RUNNING', -- RUNNING, PENDING, FAILED, SUCCEEDED, UNKNOWN
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_namespace_pod UNIQUE (namespace_id, pod_name)
);

CREATE TABLE IF NOT EXISTS pod_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pod_id UUID NOT NULL REFERENCES pods(id) ON DELETE CASCADE,
    cpu_usage VARCHAR(50) NOT NULL,
    memory_usage VARCHAR(50) NOT NULL,
    network_usage VARCHAR(50),
    disk_usage VARCHAR(50),
    restart_count INT DEFAULT 0,
    collected_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS k8s_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pod_id UUID NOT NULL REFERENCES pods(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL, -- Normal, Warning
    reason VARCHAR(100) NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Incident Domain Refactoring
CREATE TABLE IF NOT EXISTS incident_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE, -- OOMKilled, CrashLoopBackOff, ImagePullBackOff, NodeNotReady, FailedScheduling, NetworkError, DiskPressure
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Migrating Incidents Table to 3NF Normalized Schema
CREATE TABLE IF NOT EXISTS incidents_v5 (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    incident_code VARCHAR(50) NOT NULL UNIQUE,
    cluster_id UUID NOT NULL REFERENCES clusters(id) ON DELETE CASCADE,
    namespace_id UUID NOT NULL REFERENCES namespaces(id) ON DELETE CASCADE,
    pod_id UUID NOT NULL REFERENCES pods(id) ON DELETE CASCADE,
    incident_type_id UUID NOT NULL REFERENCES incident_types(id) ON DELETE RESTRICT,
    assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('INFO', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    status VARCHAR(20) NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'INVESTIGATING', 'IN_PROGRESS', 'RESOLVED', 'CLOSED')),
    log_snippet TEXT,
    ai_summary TEXT,
    detected_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Recommendations Domain Refactoring
CREATE TABLE IF NOT EXISTS recommendations_v5 (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    incident_id UUID NOT NULL REFERENCES incidents_v5(id) ON DELETE CASCADE,
    recommendation_type VARCHAR(50) NOT NULL, -- RESOURCE_ADJUSTMENT, REPLICA_SCALING, COMMAND, RECURRING_INCIDENT
    action_summary TEXT NOT NULL,
    suggested_command TEXT,
    cpu_adjustment VARCHAR(50),
    memory_adjustment VARCHAR(50),
    replica_adjustment VARCHAR(50),
    recurring_count INT DEFAULT 1,
    confidence_score INT DEFAULT 90,
    estimated_fix_time VARCHAR(50) DEFAULT '5 minutes',
    risk_level VARCHAR(20) DEFAULT 'LOW' CHECK (risk_level IN ('LOW', 'MEDIUM', 'HIGH')),
    status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'APPLIED')),
    approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
    approved_at TIMESTAMP WITH TIME ZONE,
    applied_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. AI Copilot Domain Refactoring
ALTER TABLE chat_sessions 
    ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE chat_messages 
    ADD COLUMN IF NOT EXISTS model_name VARCHAR(100) DEFAULT 'gemini-3.6-flash',
    ADD COLUMN IF NOT EXISTS token_usage INT DEFAULT 0,
    ADD COLUMN IF NOT EXISTS latency_ms INT DEFAULT 0,
    ADD COLUMN IF NOT EXISTS tool_response TEXT,
    ADD COLUMN IF NOT EXISTS feedback VARCHAR(20),
    ADD COLUMN IF NOT EXISTS execution_cost NUMERIC(10,6) DEFAULT 0.000000;

CREATE TABLE IF NOT EXISTS ai_analysis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    incident_id UUID NOT NULL REFERENCES incidents_v5(id) ON DELETE CASCADE,
    prompt TEXT NOT NULL,
    response TEXT NOT NULL,
    model_name VARCHAR(100) NOT NULL,
    confidence_score INT DEFAULT 95,
    execution_time INT DEFAULT 1200, -- milliseconds
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tool_execution (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chat_message_id UUID NOT NULL REFERENCES chat_messages(id) ON DELETE CASCADE,
    tool_name VARCHAR(100) NOT NULL,
    request_payload TEXT,
    response_payload TEXT,
    execution_time INT DEFAULT 0, -- milliseconds
    status VARCHAR(50) NOT NULL DEFAULT 'SUCCESS', -- SUCCESS, FAILED, TIMEOUT
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Reporting Domain Update
ALTER TABLE incident_reports
    ADD COLUMN IF NOT EXISTS summary_json_b JSONB,
    ADD COLUMN IF NOT EXISTS generated_by UUID REFERENCES users(id) ON DELETE SET NULL;

-- Convert existing text summary to JSONB if applicable
UPDATE incident_reports SET summary_json_b = summary_json::jsonb WHERE summary_json_b IS NULL AND summary_json IS NOT NULL;

-- 7. Notifications Domain
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL DEFAULT 'INFO', -- INFO, WARNING, CRITICAL, INCIDENT_ASSIGNED, RECOMMENDATION_PENDING
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. Audit Domain
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    entity_name VARCHAR(100) NOT NULL,
    entity_id VARCHAR(100) NOT NULL,
    action VARCHAR(50) NOT NULL, -- CREATE, UPDATE, DELETE, EXECUTE_COMMAND, APPROVE_RECOMMENDATION
    old_value JSONB,
    new_value JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. Configuration Domain
CREATE TABLE IF NOT EXISTS settings (
    key VARCHAR(100) PRIMARY KEY,
    value TEXT NOT NULL,
    description TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider VARCHAR(100) NOT NULL, -- GEMINI, PROMETHEUS, KUBERNETES, SLACK
    encrypted_key TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================================================
-- Data Migration & Fallback Bridge from V2/V4 Incidents to V5 3NF Schema
-- ==============================================================================

-- Seed Base Incident Types
INSERT INTO incident_types (id, name, description) VALUES
('b1111111-1111-1111-1111-111111111111', 'OOMKilled', 'Container terminated due to exceeding allocated RAM memory limit.'),
('b2222222-2222-2222-2222-222222222222', 'CrashLoopBackOff', 'Container fails repeatedly immediately after startup application crash.'),
('b3333333-3333-3333-3333-333333333333', 'ImagePullBackOff', 'Container engine unable to fetch target container registry image tag.'),
('b4444444-4444-4444-4444-444444444444', 'FailedScheduling', 'Pod remains pending due to insufficient cluster node resource requests.'),
('b5555555-5555-5555-5555-555555555555', 'NodeNotReady', 'Kubernetes worker node lost kubelet heartbeats or communication.'),
('b6666666-6666-6666-6666-666666666666', 'NetworkError', 'Cluster CNI network plugin packet drop or DNS resolution failure.'),
('b7777777-7777-7777-7777-777777777777', 'DiskPressure', 'Node root filesystem disk utilization exceeds eviction thresholds.')
ON CONFLICT DO NOTHING;

-- Seed Base Clusters
INSERT INTO clusters (id, cluster_name, provider, region, environment) VALUES
('c1111111-1111-1111-1111-111111111111', 'k8s-prod-us-east', 'AWS-EKS', 'us-east-1', 'production'),
('c2222222-2222-2222-2222-222222222222', 'k8s-stage-us-west', 'Google-GKE', 'us-west1', 'staging')
ON CONFLICT DO NOTHING;

-- Seed Base Namespaces
INSERT INTO namespaces (id, cluster_id, namespace_name) VALUES
('n1111111-1111-1111-1111-111111111111', 'c1111111-1111-1111-1111-111111111111', 'payment-service'),
('n2222222-2222-2222-2222-222222222222', 'c1111111-1111-1111-1111-111111111111', 'authentication'),
('n3333333-3333-3333-3333-333333333333', 'c1111111-1111-1111-1111-111111111111', 'telemetry'),
('n4444444-4444-4444-4444-444444444444', 'c2222222-2222-2222-2222-222222222222', 'ingress-nginx')
ON CONFLICT DO NOTHING;

-- Seed Base Nodes
INSERT INTO nodes (id, cluster_id, node_name, cpu_capacity, memory_capacity, status) VALUES
('d1111111-1111-1111-1111-111111111111', 'c1111111-1111-1111-1111-111111111111', 'ip-10-0-1-42.ec2.internal', '8 vCPU', '32Gi', 'READY'),
('d2222222-2222-2222-2222-222222222222', 'c1111111-1111-1111-1111-111111111111', 'ip-10-0-1-43.ec2.internal', '8 vCPU', '32Gi', 'READY'),
('d3333333-3333-3333-3333-333333333333', 'c2222222-2222-2222-2222-222222222222', 'gke-stage-pool-1-a8b2', '4 vCPU', '16Gi', 'READY')
ON CONFLICT DO NOTHING;

-- Seed Base Pods
INSERT INTO pods (id, namespace_id, node_id, pod_name, deployment_name, image_name, pod_uid, status) VALUES
('p1111111-1111-1111-1111-111111111111', 'n1111111-1111-1111-1111-111111111111', 'd1111111-1111-1111-1111-111111111111', 'payment-processor-78d9b-x92q', 'payment-processor', 'registry.internal/payment-service:v2.4', 'uid-pay-01', 'FAILED'),
('p2222222-2222-2222-2222-222222222222', 'n2222222-2222-2222-2222-222222222222', 'd2222222-2222-2222-2222-222222222222', 'auth-gateway-55c4d-m41k', 'auth-gateway', 'registry.internal/auth-service:v1.8', 'uid-auth-02', 'PENDING'),
('p3333333-3333-3333-3333-333333333333', 'n4444444-4444-4444-4444-444444444444', 'd3333333-3333-3333-3333-333333333333', 'ingress-nginx-controller-88c9-k1z0', 'ingress-nginx-controller', 'registry.internal/ingress:v1.9.9', 'uid-ing-03', 'FAILED'),
('p4444444-4444-4444-4444-444444444444', 'n3333333-3333-3333-3333-333333333333', 'd1111111-1111-1111-1111-111111111111', 'prometheus-worker-0', 'prometheus-worker', 'prom/prometheus:v2.45', 'uid-prom-04', 'RUNNING')
ON CONFLICT DO NOTHING;

-- Seed Default Settings
INSERT INTO settings (key, value, description) VALUES
('AI_MODEL_NAME', 'gemini-3.6-flash', 'Primary AI model backing LangGraph RCA engine'),
('PROMETHEUS_ENDPOINT', 'http://prometheus.monitoring:9090', 'Cluster telemetry metrics exporter'),
('AUTO_APPLY_RECOMMENDATIONS', 'false', 'Require engineer approval before executing kubectl fixes'),
('ALERT_SEVERITY_THRESHOLD', 'HIGH', 'Minimum severity to send real-time notification alerts')
ON CONFLICT DO NOTHING;

-- Populate Normalized Incidents v5
INSERT INTO incidents_v5 (id, incident_code, cluster_id, namespace_id, pod_id, incident_type_id, assigned_to, severity, status, log_snippet, ai_summary)
VALUES
(
    'e1111111-1111-1111-1111-111111111111',
    'INC-9042',
    'c1111111-1111-1111-1111-111111111111',
    'n1111111-1111-1111-1111-111111111111',
    'p1111111-1111-1111-1111-111111111111',
    'b1111111-1111-1111-1111-111111111111',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'CRITICAL',
    'OPEN',
    'java.lang.OutOfMemoryError: Java heap space. Process terminated by kernel (Exit Code 137).',
    'Memory limit of 512Mi was exceeded due to unhandled heap allocation in heavy batch processing threads.'
),
(
    'e2222222-2222-2222-2222-222222222222',
    'INC-9041',
    'c1111111-1111-1111-1111-111111111111',
    'n2222222-2222-2222-2222-222222222222',
    'p2222222-2222-2222-2222-222222222222',
    'b2222222-2222-2222-2222-222222222222',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'CRITICAL',
    'INVESTIGATING',
    'Fatal: Connection refused on redis-master.internal:6379. Restarting container (Attempt 8).',
    'Container failed connection probe to dependency Redis cache host.'
),
(
    'e3333333-3333-3333-3333-333333333333',
    'INC-9040',
    'c2222222-2222-2222-2222-222222222222',
    'n4444444-4444-4444-4444-444444444444',
    'p3333333-3333-3333-3333-333333333333',
    'b3333333-3333-3333-3333-333333333333',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'MEDIUM',
    'OPEN',
    'Failed to pull image "registry.internal/ingress:v1.9.9": rpc error: code = NotFound desc = failed to pull',
    'Target image tag does not exist in internal container image repository.'
)
ON CONFLICT DO NOTHING;

-- Populate Normalized Recommendations v5
INSERT INTO recommendations_v5 (id, incident_id, recommendation_type, action_summary, suggested_command, memory_adjustment, status, approved_by)
VALUES
(
    'r1111111-1111-1111-1111-111111111111',
    'e1111111-1111-1111-1111-111111111111',
    'RESOURCE_ADJUSTMENT',
    'Increase container RAM memory request from 512Mi to 1024Mi to eliminate OOMKilled kernel termination.',
    'kubectl set resources deployment/payment-processor -n payment-service --limits=memory=1024Mi --requests=memory=512Mi',
    '512Mi -> 1024Mi',
    'PENDING',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
)
ON CONFLICT DO NOTHING;

-- Replace old un-normalized tables with new 3NF tables
DROP TABLE IF EXISTS recommendations CASCADE;
DROP TABLE IF EXISTS incidents CASCADE;

ALTER TABLE incidents_v5 RENAME TO incidents;
ALTER TABLE recommendations_v5 RENAME TO recommendations;

-- ==============================================================================
-- 10. Performance Indexes & Composite Indexes
-- ==============================================================================

-- User & Security Indexes
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token ON refresh_tokens(token);
CREATE INDEX IF NOT EXISTS idx_password_resets_token ON password_resets(token);

-- Infrastructure Indexes
CREATE INDEX IF NOT EXISTS idx_namespaces_cluster ON namespaces(cluster_id);
CREATE INDEX IF NOT EXISTS idx_nodes_cluster ON nodes(cluster_id);
CREATE INDEX IF NOT EXISTS idx_pods_namespace ON pods(namespace_id);
CREATE INDEX IF NOT EXISTS idx_pods_node ON pods(node_id);
CREATE INDEX IF NOT EXISTS idx_pod_metrics_pod_time ON pod_metrics(pod_id, collected_at DESC);
CREATE INDEX IF NOT EXISTS idx_k8s_events_pod ON k8s_events(pod_id);

-- Incident Indexes (Single & Composite)
CREATE INDEX IF NOT EXISTS idx_incidents_status ON incidents(status);
CREATE INDEX IF NOT EXISTS idx_incidents_severity ON incidents(severity);
CREATE INDEX IF NOT EXISTS idx_incidents_detected_at ON incidents(detected_at DESC);
CREATE INDEX IF NOT EXISTS idx_incidents_cluster_id ON incidents(cluster_id);
CREATE INDEX IF NOT EXISTS idx_incidents_assigned_to ON incidents(assigned_to);
CREATE INDEX IF NOT EXISTS idx_incidents_status_severity ON incidents(status, severity);
CREATE INDEX IF NOT EXISTS idx_incidents_cluster_status ON incidents(cluster_id, status);

-- Recommendation Indexes
CREATE INDEX IF NOT EXISTS idx_recommendations_incident_id ON recommendations(incident_id);
CREATE INDEX IF NOT EXISTS idx_recommendations_status ON recommendations(status);

-- AI Copilot & Chat Indexes
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user ON chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_session ON chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_analysis_incident ON ai_analysis(incident_id);
CREATE INDEX IF NOT EXISTS idx_tool_execution_chat_message ON tool_execution(chat_message_id);

-- Notifications, Audit Logs, Settings Indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_name, entity_id);

-- ==============================================================================
-- KubeMind Chat History Schema Migration (V3)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS chat_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_title VARCHAR(200) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
    sender VARCHAR(20) NOT NULL, -- user, assistant
    content TEXT NOT NULL,
    tools_executed VARCHAR(255),
    confidence_score INT,
    remediation_command TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Seed Default Chat Session
INSERT INTO chat_sessions (id, session_title)
VALUES ('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'OOMKilled & Deployment Diagnosis')
ON CONFLICT DO NOTHING;

INSERT INTO chat_messages (session_id, sender, content, tools_executed, confidence_score, remediation_command)
VALUES (
    'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
    'assistant',
    'Hello Operator! I am your **KubeMind LangGraph AI Copilot**. Ask me to analyze container crash logs, diagnose OOMKilled/CrashLoopBackOff alerts, or run automated Root Cause Analysis on target cluster workloads.',
    'getPods,getLogs',
    98,
    'kubectl top pod'
)
ON CONFLICT DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_chat_messages_session ON chat_messages(session_id);

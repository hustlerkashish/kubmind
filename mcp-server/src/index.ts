import express from 'express';

const app = express();
const PORT = process.env.MCP_SERVER_PORT || 3001;

app.use(express.json());

app.get('/health', (req, res) => {
  res.json({
    status: 'UP',
    service: 'KubeMind MCP Server',
    protocol: 'Model Context Protocol v1.0',
    registeredTools: ['kubectl_get_pods', 'kubectl_describe_pod', 'prometheus_query_range'],
  });
});

app.get('/mcp/tools', (req, res) => {
  res.json({
    tools: [
      {
        name: 'get_cluster_nodes',
        description: 'Retrieves active status of all nodes in target cluster',
      },
      {
        name: 'fetch_pod_stderr',
        description: 'Streams crash dump logs from container standard error stream',
      },
    ],
  });
});

app.listen(PORT, () => {
  console.log(`[MCP Server] Operational and listening on port ${PORT}`);
});

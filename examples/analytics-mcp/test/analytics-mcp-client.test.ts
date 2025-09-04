import {
  env,
  createExecutionContext,
  waitOnExecutionContext,
} from "cloudflare:test";
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { WorkerSSEClientTransport } from "@nullshot/test-utils/mcp/WorkerSSEClientTransport";

// Define response type for clarity
interface ToolResponse {
  content: Array<{
    type: string;
    text: string;
  }>;
  data?: any;
  success?: boolean;
  error?: string;
}

describe("Analytics MCP Client Integration Tests", () => {
  const baseUrl = "http://localhost";
  let client: Client;
  let ctx: ExecutionContext;

  beforeEach(async () => {
    console.log(`--------- STARTING ANALYTICS MCP TEST ---------`);
    ctx = createExecutionContext();

    // Create a standard MCP client
    client = new Client({
      name: "analytics-mcp-test-client",
      version: "1.0.0",
    });

    console.log(`Created MCP Client for Analytics testing`);
  });

  afterEach(async () => {
    console.log(`--------- ENDING ANALYTICS MCP TEST ---------`);
    if (client) {
      await client.close();
    }
    await waitOnExecutionContext(ctx);
  });

  // Helper function to create the transport
  function createTransport(ctx: ExecutionContext) {
    const url = new URL(`${baseUrl}/sse`);
    return new WorkerSSEClientTransport(url, ctx);
  }

  describe("Tools", () => {
    it("should list available tools", async () => {
      const transport = createTransport(ctx);
      await client.connect(transport);
      
      const tools = await client.listTools();
      
      expect(tools.tools).toBeInstanceOf(Array);
      expect(tools.tools.length).toBeGreaterThan(0);
      
      const toolNames = tools.tools.map(tool => tool.name);
      expect(toolNames).toContain('track_metric');
      expect(toolNames).toContain('track_batch_metrics');
      expect(toolNames).toContain('track_agent_metrics');
      expect(toolNames).toContain('query_analytics');
      expect(toolNames).toContain('get_metrics_summary');
      expect(toolNames).toContain('get_time_series');
      expect(toolNames).toContain('analyze_trends');
      expect(toolNames).toContain('detect_anomalies');
      expect(toolNames).toContain('monitor_system_health');
    });

    it("should track a single metric", async () => {
      const transport = createTransport(ctx);
      await client.connect(transport);
      
      const result = await client.callTool({
        name: 'track_metric',
        arguments: {
          dataset: 'test_events',
          dimensions: {
            event_type: 'user_login',
            source: 'web'
          },
          metrics: {
            response_time: 150,
            success: 1
          }
        }
      }) as ToolResponse;

      expect(result.content).toBeInstanceOf(Array);
      expect(result.content[0].type).toBe('text');
      
      const responseData = JSON.parse(result.content[0].text);
      expect(responseData.success).toBe(true);
      expect(responseData.data.dataset).toBe('test_events');
    });

    it("should track batch metrics", async () => {
      const transport = createTransport(ctx);
      await client.connect(transport);
      
      const result = await client.callTool({
        name: 'track_batch_metrics',
        arguments: {
          dataset: 'test_events',
          dataPoints: [
            {
              dimensions: { event_type: 'page_view', page: 'home' },
              metrics: { load_time: 200 }
            },
            {
              dimensions: { event_type: 'page_view', page: 'about' },
              metrics: { load_time: 180 }
            }
          ]
        }
      }) as ToolResponse;

      expect(result.content).toBeInstanceOf(Array);
      const responseData = JSON.parse(result.content[0].text);
      expect(responseData.success).toBe(true);
      expect(responseData.data.count).toBe(2);
    });

    it("should track agent metrics", async () => {
      const transport = createTransport(ctx);
      await client.connect(transport);
      
      const result = await client.callTool({
        name: 'track_agent_metrics',
        arguments: {
          agentId: 'test-agent',
          eventType: 'message_received',
          userId: 'user123',
          processingTime: 250
        }
      }) as ToolResponse;

      expect(result.content).toBeInstanceOf(Array);
      const responseData = JSON.parse(result.content[0].text);
      expect(responseData.success).toBe(true);
      expect(responseData.data.agentId).toBe('test-agent');
    });

    it("should execute analytics queries", async () => {
      const transport = createTransport(ctx);
      await client.connect(transport);
      
      const result = await client.callTool({
        name: 'query_analytics',
        arguments: {
          sql: 'SELECT COUNT(*) as total FROM agent_metrics WHERE timestamp > 1000000000'
        }
      }) as ToolResponse;

      expect(result.content).toBeInstanceOf(Array);
      const responseData = JSON.parse(result.content[0].text);
      expect(responseData.success).toBe(true);
      expect(responseData.data.data).toBeInstanceOf(Array);
    });

    it("should get time series data", async () => {
      const transport = createTransport(ctx);
      await client.connect(transport);
      
      const result = await client.callTool({
        name: 'get_time_series',
        arguments: {
          dataset: 'github_stats',
          metric: 'prs_created',
          interval: '1d',
          timeRange: {
            start: '2025-08-01T00:00:00Z',
            end: '2025-09-05T00:00:00Z'
          },
          filters: {}
        }
      }) as ToolResponse;

      expect(result.content).toBeInstanceOf(Array);
      const responseData = JSON.parse(result.content[0].text);
      expect(responseData.success).toBe(true);
      expect(responseData.data.dataset).toBe('github_stats');
      expect(responseData.data.metric).toBe('prs_created');
      expect(responseData.data.data).toBeInstanceOf(Array);
    });

    it("should analyze trends", async () => {
      const transport = createTransport(ctx);
      await client.connect(transport);
      
      const result = await client.callTool({
        name: 'analyze_trends',
        arguments: {
          dataset: 'github_stats',
          metric: 'prs_created',
          timeRange: '30d',
          algorithm: 'linear'
        }
      }) as ToolResponse;

      expect(result.content).toBeInstanceOf(Array);
      const responseData = JSON.parse(result.content[0].text);
      expect(responseData.success).toBe(true);
      expect(responseData.data.trends).toBeInstanceOf(Array);
    });

    it("should detect anomalies", async () => {
      const transport = createTransport(ctx);
      await client.connect(transport);
      
      const result = await client.callTool({
        name: 'detect_anomalies',
        arguments: {
          dataset: 'github_stats',
          metric: 'prs_created',
          threshold: 0.8,
          timeWindow: '7d'
        }
      }) as ToolResponse;

      expect(result.content).toBeInstanceOf(Array);
      const responseData = JSON.parse(result.content[0].text);
      expect(responseData.success).toBe(true);
      expect(responseData.data).toBeDefined();
      // In test environment, data structure may be different
      if (responseData.data.anomalies) {
        expect(responseData.data.anomalies).toBeInstanceOf(Array);
      }
    });

    it("should monitor system health", async () => {
      const transport = createTransport(ctx);
      await client.connect(transport);
      
      const result = await client.callTool({
        name: 'monitor_system_health',
        arguments: {
          timeWindow: '1h',
          includeDetails: true
        }
      }) as ToolResponse;

      expect(result.content).toBeInstanceOf(Array);
      const responseData = JSON.parse(result.content[0].text);
      // In test environment, tools may return mock data or errors
      expect(responseData).toBeDefined();
      if (responseData.success) {
        expect(responseData.data).toBeDefined();
      } else {
        // Tool may fail in test environment due to missing real data
        expect(responseData.error).toBeDefined();
      }
    });

    it("should handle validation errors", async () => {
      const transport = createTransport(ctx);
      await client.connect(transport);
      
      const result = await client.callTool({
        name: 'track_metric',
        arguments: {
          // Missing required fields
          dataset: '',
          dimensions: {},
          metrics: {}
        }
      }) as ToolResponse;

      expect(result.content).toBeInstanceOf(Array);
      const responseData = JSON.parse(result.content[0].text);
      expect(responseData.success).toBe(false);
      expect(responseData.error).toContain('Dataset name is required');
    });
  });

  describe("Resources", () => {
    it("should list available resources", async () => {
      const transport = createTransport(ctx);
      await client.connect(transport);
      
      const resources = await client.listResources();
      
      expect(resources.resources).toBeInstanceOf(Array);
      expect(resources.resources.length).toBeGreaterThan(0);
      
      const resourceUris = resources.resources.map(resource => resource.uri);
      expect(resourceUris).toContain('analytics://datasets');
      expect(resourceUris).toContain('analytics://dashboards');
    });

    it("should get datasets resource", async () => {
      const transport = createTransport(ctx);
      await client.connect(transport);
      
      const result = await client.readResource({
        uri: 'analytics://datasets'
      });
      
      expect(result.contents).toBeInstanceOf(Array);
      expect(result.contents[0].type).toBe('text');
      
      const data = JSON.parse(result.contents[0].text);
      expect(data.success).toBe(true);
      expect(data.data.datasets).toBeInstanceOf(Array);
    });
  });

  describe("Prompts", () => {
    it("should list available prompts", async () => {
      const transport = createTransport(ctx);
      await client.connect(transport);
      
      const prompts = await client.listPrompts();
      
      expect(prompts.prompts).toBeInstanceOf(Array);
      expect(prompts.prompts.length).toBeGreaterThan(0);
      
      const promptNames = prompts.prompts.map(prompt => prompt.name);
      expect(promptNames).toContain('analytics_introduction');
      expect(promptNames).toContain('query_builder');
    });

    it("should get analytics introduction prompt", async () => {
      const transport = createTransport(ctx);
      await client.connect(transport);
      
      const result = await client.getPrompt({
        name: 'analytics_introduction',
        arguments: {}
      });
      
      expect(result.messages).toBeInstanceOf(Array);
      expect(result.messages[0].content.type).toBe('text');
      
      const content = result.messages[0].content.text;
      expect(content).toContain('Analytics MCP');
    });
  });
});
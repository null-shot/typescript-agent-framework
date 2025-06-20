import { Transport } from '@modelcontextprotocol/sdk/shared/transport.js';

/**
 * Minimal interface for MCP server functionality used by McpServerDO
 * This allows both real McpServer and proxy implementations to work with McpServerDO
 */
export interface IMcpServer {
  /**
   * Connect a transport to the server
   * This is the primary method that McpServerDO calls to establish client connections
   */
  connect(transport: Transport): Promise<void>;
} 
import { Implementation } from '@modelcontextprotocol/sdk/types.js';
import { McpHonoServerDO } from '@xava-labs/mcp';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { TodoRepository } from './repository';
import { setupServerTools } from './tools';
import { setupServerResources } from './resources';

/**
 * TodoMcpServer extends McpHonoServerDO for CRUD operations on todo items
 */
export class TodoMcpServer extends McpHonoServerDO {
  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
  }

  /**
   * Implementation of the required abstract method
   */
  getImplementation(): Implementation {
    return {
      name: 'TodoMcpServer',
      version: '1.0.0',
    };
  }

  /**
   * Implements the required abstract configureServer method
   * Registers CRUD tools for the MCP server
   */
  configureServer(server: McpServer): void {
    const repository = new TodoRepository(this.ctx);
    // Initialize the database on startup
    this.ctx.blockConcurrencyWhile(async () => {
      repository.initializeDatabase();
    });
    
    // Create and set up tools and resources with our repository
    setupServerTools(server, repository);
    setupServerResources(server, repository);
  }
} 
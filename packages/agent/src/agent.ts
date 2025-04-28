import { CoreMessage, LanguageModel, streamText, wrapLanguageModel, StreamTextResult, ToolSet } from 'ai';
import { DurableObject } from 'cloudflare:workers';
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { cors } from 'hono/cors';
import { AgentEnv } from './env';
import { ExternalService, Service, MiddlewareService, isExternalService, isMiddlewareService, StreamTextParams } from './service';


/**
 * Base Agent class which processes messages for the given payload type
 */
export abstract class Agent<E extends AgentEnv = AgentEnv> extends DurableObject {
  protected env: E;
  private app: Hono<{ Bindings: E }>;
  protected services: Service[];
  protected middleware: MiddlewareService[] = [];
  protected model: LanguageModel;

  constructor(state: DurableObjectState, env: E, model: LanguageModel, services: Service[] = []) {
    super(state, env);
    this.env = env;
    this.app = new Hono<{ Bindings: E }>();
    this.services = services;
    this.model = model;
    
    // Setup routes
    this.setupRoutes(this.app);
    this.model = model;

    state.blockConcurrencyWhile(async () => {
      // Initialize services before setting up routes
      await this.initializeServices();

      // Wrap the language model with middleware if needed
      this.model = wrapLanguageModel({
        model: this.model,
        middleware: this.middleware
      });
    });
  }

  /**
   * Setup services for the agent
   * This can be overridden by subclasses to add custom services
   */
  protected async initializeServices(): Promise<void> {
    // Initialize all services
    for (const service of this.services) {
      console.log("Initializing service", service);
      if (service.initialize) {
        await service.initialize();
      }
      
      // Register routes for external services
      if (isExternalService(service)) {
        service.registerRoutes(this.app);
      }

      // Register middleware for middleware services
      if (isMiddlewareService(service)) {
        this.middleware.push(service);
      }
    }
  }

  /**
   * Setup Hono routes
   */
  protected setupRoutes(app: Hono<{ Bindings: E }>) {
    // Message processing route with sessionId as URL parameter
    app.post('/agent/chat/:sessionId', async (c) => {
      try {
        // Get sessionId from URL params or generate a new one
        const sessionId = c.req.param('sessionId')

        if (!sessionId) {
          throw new HTTPException(400, {
            message: 'Session ID is required'
          });
        }

        // Get the payload from the request
        const { messages } = await c.req.json();

        if (!messages || messages.length === 0) {
          throw new HTTPException(400, {
            message: 'Payload must be a valid CoreMessage[] JSON Object CoreMessage[]'
          });
        }
        
        const response =  await this.processMessage(messages, sessionId);

        response.headers.set('X-Session-Id', sessionId);

        return response;
      } catch (error) {
        console.error('Error processing message:', error);
        
        // Handle JSON parsing errors specifically
        if (error instanceof SyntaxError) {
          throw new HTTPException(400, {
            message: 'Invalid JSON in request body'
          });
        }
        // Handle other errors
        throw new HTTPException(500, {
          message: 'Internal server error'
        });
      }
    });

    // Default 404 route
    app.notFound(() => {
      return new Response('Not found', { status: 404 });
    });
  }

  /**
   * Main fetch handler for the Agent Durable Object
   */
  async fetch(request: Request): Promise<Response> {
    return this.app.fetch(request);
  }

  /**
   * Process an incoming message
   * This should be implemented by subclasses
   */
  abstract processMessage(message: CoreMessage[], sessionId: string): Promise<Response>;

  /**
   * Stream text with middleware support
   * This method applies the tools transformation middleware
   */
  protected async streamText(
    sessionId: string,
    options: Partial<StreamTextParams> = {}
  ): Promise<StreamTextResult<ToolSet, string>> {
    // Create initial parameters
    let params: StreamTextParams = {
      model: this.model,
      experimental_generateMessageId: () => `${sessionId}-${crypto.randomUUID()}`,
      ...options
    };

    // If tools are provided, apply middleware transformations
    if (params.tools) {
      for (const middleware of this.middleware) {
        if (middleware.transformStreamTextTools) {
          params.tools = await middleware.transformStreamTextTools(params.tools);
        }
      }
    }

    // Call streamText with transformed parameters
    return streamText(params);
  }
}
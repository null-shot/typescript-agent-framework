import { Message } from '@ai-sdk/react';
import { MCPServerDirectory, MCPServerConfigData } from '@/types/mcp-server';

// Chat session storage
const CHAT_STORAGE_PREFIX = 'chat_session_';

export function saveChat(sessionId: string, messages: Message[]) {
  try {
    localStorage.setItem(
      `${CHAT_STORAGE_PREFIX}${sessionId}`,
      JSON.stringify(messages)
    );
  } catch (error) {
    console.error('Failed to save chat:', error);
  }
}

export function loadChat(sessionId: string): Message[] {
  try {
    const stored = localStorage.getItem(`${CHAT_STORAGE_PREFIX}${sessionId}`);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Failed to load chat:', error);
    return [];
  }
}

export function deleteChat(sessionId: string) {
  try {
    localStorage.removeItem(`${CHAT_STORAGE_PREFIX}${sessionId}`);
  } catch (error) {
    console.error('Failed to delete chat:', error);
  }
}

// Proxy ID storage
const PROXY_ID_KEY = 'playground_proxy_id';

export function generateProxyId(): string {
  return crypto.randomUUID();
}

export function getOrCreateProxyId(): string {
  try {
    if (typeof window === 'undefined') {
      // Server-side rendering - return a temporary ID
      return 'temp-' + Math.random().toString(36).substring(2, 15);
    }
    
    const stored = localStorage.getItem(PROXY_ID_KEY);
    if (stored) {
      return stored;
    }
    
    // Generate new proxy ID and save it
    const newProxyId = generateProxyId();
    localStorage.setItem(PROXY_ID_KEY, newProxyId);
    console.log('Generated new proxyId:', newProxyId);
    return newProxyId;
  } catch (error) {
    console.error('Failed to get or create proxy ID:', error);
    return generateProxyId(); // Fallback to non-persistent ID
  }
}

export function getProxyId(): string | null {
  try {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(PROXY_ID_KEY);
  } catch (error) {
    console.error('Failed to get proxy ID:', error);
    return null;
  }
}

export function saveProxyId(proxyId: string): void {
  try {
    if (typeof window === 'undefined') return;
    localStorage.setItem(PROXY_ID_KEY, proxyId);
  } catch (error) {
    console.error('Failed to save proxy ID:', error);
  }
}

// Helper function to construct proxy URLs with proxyId
export function buildProxyUrl(baseUrl: string, proxyId?: string): string {
  try {
    const url = new URL(baseUrl);
    const finalProxyId = proxyId || getOrCreateProxyId();
    url.searchParams.set('proxyId', finalProxyId);
    return url.toString();
  } catch (error) {
    console.error('Failed to build proxy URL:', error);
    return baseUrl; // Fallback to original URL
  }
}

// MCP Directory storage
const MCP_DIRECTORY_KEY = 'mcp_directory';

export function saveMCPDirectory(directory: MCPServerDirectory) {
  try {
    localStorage.setItem(MCP_DIRECTORY_KEY, JSON.stringify(directory));
  } catch (error) {
    console.error('Failed to save MCP directory:', error);
  }
}

export function loadMCPDirectory(): MCPServerDirectory | null {
  try {
    const stored = localStorage.getItem(MCP_DIRECTORY_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.error('Failed to load MCP directory:', error);
    return null;
  }
}

// AI Model Configuration storage - separate configs per provider
const AI_MODEL_CONFIG_PREFIX = 'ai_model_config_';
const CURRENT_PROVIDER_KEY = 'current_ai_provider';

export interface AIModelConfig {
  provider: 'openai' | 'anthropic';
  apiKey: string;
  model: string;
  temperature?: number;
  maxTokens?: number;
  maxSteps?: number;
  systemPrompt?: string;
}

interface ProviderConfig {
  apiKey: string;
  model: string;
  temperature?: number;
  maxTokens?: number;
  maxSteps?: number;
  systemPrompt?: string;
}

export function saveAIModelConfig(config: AIModelConfig) {
  try {
    if (typeof window === 'undefined') return;
    // Save the provider-specific config
    const providerConfig: ProviderConfig = {
      apiKey: config.apiKey,
      model: config.model,
      temperature: config.temperature,
      maxTokens: config.maxTokens,
      maxSteps: config.maxSteps,
      systemPrompt: config.systemPrompt
    };
    localStorage.setItem(
      `${AI_MODEL_CONFIG_PREFIX}${config.provider}`, 
      JSON.stringify(providerConfig)
    );
    
    // Save the current provider
    localStorage.setItem(CURRENT_PROVIDER_KEY, config.provider);
  } catch (error) {
    console.error('Failed to save AI model config:', error);
  }
}

export function loadAIModelConfig(): AIModelConfig | null {
  try {
    if (typeof window === 'undefined') return null;
    // Get the current provider
    const currentProvider = localStorage.getItem(CURRENT_PROVIDER_KEY) as 'openai' | 'anthropic' || 'openai';
    
    // Get the provider-specific config
    const stored = localStorage.getItem(`${AI_MODEL_CONFIG_PREFIX}${currentProvider}`);
    if (!stored) return null;
    
    const providerConfig: ProviderConfig = JSON.parse(stored);
    
    return {
      provider: currentProvider,
      apiKey: providerConfig.apiKey,
      model: providerConfig.model,
      temperature: providerConfig.temperature,
      maxTokens: providerConfig.maxTokens,
      maxSteps: providerConfig.maxSteps,
      systemPrompt: providerConfig.systemPrompt
    };
  } catch (error) {
    console.error('Failed to load AI model config:', error);
    return null;
  }
}

export function loadProviderConfig(provider: 'openai' | 'anthropic'): ProviderConfig | null {
  try {
    const stored = localStorage.getItem(`${AI_MODEL_CONFIG_PREFIX}${provider}`);
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.error(`Failed to load ${provider} config:`, error);
    return null;
  }
}

export function saveCurrentProvider(provider: 'openai' | 'anthropic') {
  try {
    localStorage.setItem(CURRENT_PROVIDER_KEY, provider);
  } catch (error) {
    console.error('Failed to save current provider:', error);
  }
}

export function getCurrentProvider(): 'openai' | 'anthropic' {
  try {
    if (typeof window === 'undefined') return 'openai';
    return (localStorage.getItem(CURRENT_PROVIDER_KEY) as 'openai' | 'anthropic') || 'openai';
  } catch (error) {
    console.error('Failed to get current provider:', error);
    return 'openai';
  }
}

export function deleteAIModelConfig(provider?: 'openai' | 'anthropic') {
  try {
    if (provider) {
      localStorage.removeItem(`${AI_MODEL_CONFIG_PREFIX}${provider}`);
    } else {
      // Delete all provider configs
      localStorage.removeItem(`${AI_MODEL_CONFIG_PREFIX}openai`);
      localStorage.removeItem(`${AI_MODEL_CONFIG_PREFIX}anthropic`);
      localStorage.removeItem(CURRENT_PROVIDER_KEY);
    }
  } catch (error) {
    console.error('Failed to delete AI model config:', error);
  }
}

// Get current model configuration for API requests
export function getCurrentModelConfig(): AIModelConfig | null {
  const config = loadAIModelConfig();
  
  // Validate that we have all required fields
  if (config && config.provider && config.apiKey && config.model) {
    return config;
  }
  
  return null;
}

// MCP Configuration storage
const MCP_CONFIG_PREFIX = 'mcp_config_';

export function saveMCPConfig(config: MCPServerConfigData) {
  try {
    localStorage.setItem(
      `${MCP_CONFIG_PREFIX}${config.serverId}`,
      JSON.stringify(config)
    );
  } catch (error) {
    console.error('Failed to save MCP config:', error);
  }
}

export function loadMCPConfig(serverId: string): MCPServerConfigData | null {
  try {
    const stored = localStorage.getItem(`${MCP_CONFIG_PREFIX}${serverId}`);
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.error('Failed to load MCP config:', error);
    return null;
  }
}

export function deleteMCPConfig(serverId: string) {
  try {
    localStorage.removeItem(`${MCP_CONFIG_PREFIX}${serverId}`);
  } catch (error) {
    console.error('Failed to delete MCP config:', error);
  }
}

export function getAllMCPConfigs(): Record<string, MCPServerConfigData> {
  try {
    const configs: Record<string, MCPServerConfigData> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(MCP_CONFIG_PREFIX)) {
        const serverId = key.replace(MCP_CONFIG_PREFIX, '');
        const config = loadMCPConfig(serverId);
        if (config) {
          configs[serverId] = config;
        }
      }
    }
    return configs;
  } catch (error) {
    console.error('Failed to load all MCP configs:', error);
    return {};
  }
}

export function updateMCPConfigStatus(serverId: string, updates: Partial<Pick<MCPServerConfigData, 'isEnabled' | 'lastUpdated'>>) {
  try {
    const config = loadMCPConfig(serverId);
    if (config) {
      const updatedConfig = {
        ...config,
        ...updates,
        lastUpdated: new Date().toISOString()
      };
      saveMCPConfig(updatedConfig);
    }
  } catch (error) {
    console.error('Failed to update MCP config status:', error);
  }
} 
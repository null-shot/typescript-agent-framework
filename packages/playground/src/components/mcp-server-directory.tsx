"use client";

import React, { useState, useEffect, useMemo } from "react";
import { cn } from "@/lib/utils";
import { MCPServer, MCPServerConfigData } from "@/types/mcp-server";
import { MCPServerItem } from "./mcp-server-item";
import { MCPConfigurationDrawer } from "./mcp-configuration-drawer";
import { 
  saveMCPDirectory, 
  loadMCPDirectory,
  updateMCPConfigStatus,
  loadMCPConfig
} from "@/lib/storage";
import { 
  initializeSearch, 
  MCPServerSearch 
} from "@/lib/search";
import { mockMCPDirectory } from "@/data/mock-mcp-servers";
import { useMcpServerManager } from "@/hooks/use-mcp-server-manager";

export interface MCPServerDirectoryProps {
  className?: string;
  onServerToggle?: (server: MCPServer, enabled: boolean) => void;
  onServerCountChange?: (count: number) => void;
}

export function MCPServerDirectory({
  className,
  onServerToggle,
  onServerCountChange
}: MCPServerDirectoryProps) {
  const [servers, setServers] = useState<MCPServer[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [searchInstance, setSearchInstance] = useState<MCPServerSearch | null>(null);
  
  // Configuration drawer state
  const [configDrawerOpen, setConfigDrawerOpen] = useState(false);
  const [selectedServer, setSelectedServer] = useState<MCPServer | null>(null);

  // Use the WebSocket-based MCP server manager
  const { 
    servers: installedMcpServers, 
    connected: isConnected, 
    addServer, 
    deleteServer,
    isServerLoading
  } = useMcpServerManager();



  // Create a set of installed server IDs for quick lookup
  const installedServers = useMemo(() => {
    return new Set(installedMcpServers.map(server => server.uniqueName));
  }, [installedMcpServers]);

  // Update server count when installed servers change
  useEffect(() => {
    onServerCountChange?.(installedServers.size);
  }, [installedServers.size, onServerCountChange]);

  // Initialize data and search
  useEffect(() => {
    const initializeData = async () => {
      setIsLoading(true);
      
      // Try to load from localStorage first
      let directory = loadMCPDirectory();
      
      // If no cached data, use mock data
      if (!directory) {
        directory = mockMCPDirectory;
        saveMCPDirectory(directory);
      }
      
      // For now, always use fresh mock data to ensure we have the latest inputs
      directory = mockMCPDirectory;
      saveMCPDirectory(directory);
      
      setServers(directory.servers);
      
      // Initialize search
      const search = initializeSearch(directory.servers);
      setSearchInstance(search);
      
      setIsLoading(false);
    };
    
    initializeData();
  }, []);

  // Get filtered and searched servers
  const filteredServers = useMemo(() => {
    if (!searchInstance) return servers;
    
    let results = servers;
    
    // Apply search if query exists
    if (searchQuery.trim()) {
      results = searchInstance.search(searchQuery);
    }
    
    // Apply category filter
    if (selectedCategory) {
      results = results.filter(server => server.category === selectedCategory);
    }
    
    return results;
  }, [servers, searchQuery, selectedCategory, searchInstance]);

  // Get unique categories for filtering
  const categories = useMemo(() => {
    if (!searchInstance) return [];
    return searchInstance.getCategories();
  }, [searchInstance]);

  // Utility function to substitute input values in env vars and args
  const substituteInputValues = (
    config: MCPServerConfigData, 
    template: string
  ): string => {
    return template.replace(/\$\{input:([^}]+)\}/g, (match, inputId) => {
      return config.inputs[inputId] || match;
    });
  };

  const handleServerInstall = (server: MCPServer) => {
    setSelectedServer(server);
    setConfigDrawerOpen(true);
  };

  const handleServerConfigure = (server: MCPServer) => {
    setSelectedServer(server);
    setConfigDrawerOpen(true);
  };

  const handleConfigurationSave = async (server: MCPServer, config: MCPServerConfigData) => {
    try {
      // Get the MCP server config (backward compatibility)
      const mcpConfig = server.mcpServerConfig || (
        server.mcp_server_config ? 
          Object.values(server.mcp_server_config.mcpServers)[0] : 
          null
      );
      
      if (!mcpConfig) {
        throw new Error(`No valid configuration found for server: ${server.name || server.unique_name}`);
      }
      
      // Prepare the server configuration with substituted values
      const serverConfig = {
        uniqueName: server.id,
        command: mcpConfig.command,
        args: mcpConfig.args.map(arg => 
          substituteInputValues(config, arg)
        ),
        env: Object.fromEntries(
          Object.entries(mcpConfig.env || {}).map(([key, value]) => [
            key,
            substituteInputValues(config, value)
          ])
        )
      };

      // Install the MCP server
      const success = await addServer(serverConfig);
      
      if (success) {
        // Update the configuration to mark as enabled
        updateMCPConfigStatus(server.id, { isEnabled: true });
        
        console.log(`Successfully installed/updated MCP server: ${server.name}`);
        onServerToggle?.(server, true);
      } else {
        console.error(`Failed to install/update MCP server: ${server.name}`);
        throw new Error(`Failed to install/update MCP server: ${server.name}`);
      }
    } catch (error) {
      console.error('Error installing/updating MCP server:', error);
      throw error; // Re-throw to let the drawer handle the error
    }
  };

  const handleServerToggle = async (server: MCPServer, enabled: boolean) => {
    console.log(`Toggle request: ${server.name}, enabled: ${enabled}, hasInputs: ${!!server.inputs}`);
    
    if (enabled) {
      // For servers that require configuration, load saved config and reinstall
      if (server.inputs && server.inputs.length > 0) {
        try {
          const savedConfig = loadMCPConfig(server.id);
          
          if (!savedConfig || !savedConfig.isConfigured) {
            console.log(`No saved config found for ${server.name}, opening configuration drawer`);
            // No saved configuration, open the configuration drawer
            handleServerInstall(server);
            return;
          }
          
          console.log(`Re-enabling configured server: ${server.name}`);
          
          // Get the MCP server config (backward compatibility)
          const mcpConfig = server.mcpServerConfig || (
            server.mcp_server_config ? 
              Object.values(server.mcp_server_config.mcpServers)[0] : 
              null
          );
          
          if (!mcpConfig) {
            console.error(`No valid configuration found for server: ${server.name || server.unique_name}`);
            alert(`No valid configuration found for server: ${server.name || server.unique_name}`);
            return;
          }
          
          // Prepare the server configuration with substituted values
          const serverConfig = {
            uniqueName: server.id,
            command: mcpConfig.command,
            args: mcpConfig.args.map(arg => 
              substituteInputValues(savedConfig, arg)
            ),
            env: Object.fromEntries(
              Object.entries(mcpConfig.env || {}).map(([key, value]) => [
                key,
                substituteInputValues(savedConfig, value)
              ])
            )
          };

          // Install the MCP server
          const success = await addServer(serverConfig);
          
          if (success) {
            // Update the configuration to mark as enabled
            updateMCPConfigStatus(server.id, { isEnabled: true });
            
            console.log(`Successfully re-enabled MCP server: ${server.name}`);
            onServerToggle?.(server, enabled);
          } else {
            console.error(`Failed to re-enable MCP server: ${server.name}`);
            alert(`Failed to re-enable MCP server: ${server.name}`);
          }
        } catch (error) {
          console.error('Error re-enabling configured MCP server:', error);
          alert('Failed to re-enable MCP server due to network error');
        }
      } else {
        // Handle non-configured servers (existing logic)
        try {
          // Get the MCP server config (backward compatibility)
          const mcpConfig = server.mcpServerConfig || (
            server.mcp_server_config ? 
              Object.values(server.mcp_server_config.mcpServers)[0] : 
              null
          );
          
          if (!mcpConfig) {
            console.error(`No valid configuration found for server: ${server.name || server.unique_name}`);
            alert(`No valid configuration found for server: ${server.name || server.unique_name}`);
            return;
          }
          
          const success = await addServer({
            uniqueName: server.id,
            command: mcpConfig.command,
            args: mcpConfig.args,
            env: mcpConfig.env || {}
          });
          
          if (success) {
            console.log(`Successfully added MCP server: ${server.name}`);
            onServerToggle?.(server, enabled);
          } else {
            console.error(`Failed to add MCP server: ${server.name}`);
            alert(`Failed to add MCP server: ${server.name}`);
          }
        } catch (error) {
          console.error('Error adding MCP server:', error);
          alert('Failed to add MCP server due to network error');
        }
      }
    } else {
      try {
        const success = await deleteServer(server.id);
        
        if (success) {
          // Update local config to mark as disabled
          updateMCPConfigStatus(server.id, { isEnabled: false });
          
          console.log(`Successfully removed MCP server: ${server.name}`);
          onServerToggle?.(server, enabled);
        } else {
          console.error(`Failed to remove MCP server: ${server.name}`);
          alert(`Failed to remove MCP server: ${server.name}`);
        }
      } catch (error) {
        console.error('Error removing MCP server:', error);
        alert('Failed to remove MCP server due to network error');
      }
    }
  };

  const isServerEnabled = (server: MCPServer): boolean => {
    return installedServers.has(server.id);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category === selectedCategory ? "" : category);
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCategory("");
  };

  if (isLoading) {
    return (
      <div className={cn("p-6 space-y-6", className)}>
        <div className="animate-pulse space-y-6">
          <div className="space-y-3">
            <div className="h-8 bg-[#17181A] rounded-lg" />
            <div className="h-4 bg-[#17181A] rounded-lg w-3/4" />
          </div>
          <div className="h-10 bg-[#17181A] rounded-lg" />
          <div className="h-8 bg-[#17181A] rounded-lg" />
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-[#17181A] rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Header */}
      <div className="p-6">
        
        {/* Search */}
        <div className="relative mb-4">
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="I want a MCP Server that can..."
            className="w-full bg-[#323546] border-none rounded-lg px-3 py-2 pl-9 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-0"
          />
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="rgba(255, 255, 255, 0.6)"
            strokeWidth="1.2"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
        </div>

        {/* Category filter */}
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => handleCategoryChange(category)}
                className={cn(
                  "px-3 py-1 text-xs rounded-full border-none transition-all duration-200 h-6 flex items-center",
                  selectedCategory === category
                    ? "bg-[rgba(114,255,192,0.1)] border-[rgba(114,255,192,0.3)] text-[rgba(114,255,192,0.9)]"
                    : "bg-[#323546] text-white hover:bg-[#3A3E54]"
                )}
              >
                {category}
              </button>
            ))}
          </div>
          
          {/* Clear filters */}
          {(searchQuery || selectedCategory) && (
            <button
              onClick={clearFilters}
              className="text-xs text-white/40 hover:text-white/60 transition-colors"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* MCP Indicator */}
      <div className="px-6 py-3">
        <div className="flex items-center justify-between">
          <span className="font-['Space_Grotesk'] font-normal text-sm text-white">
            Showing {filteredServers.length} of {servers.length} MCPs
            {searchQuery && ` matching "${searchQuery}"`}
            {selectedCategory && ` in "${selectedCategory}"`}
          </span>
        </div>
      </div>

      {/* Server Cards Grid */}
      <div className="flex-1 overflow-y-auto p-6">
        {filteredServers.length === 0 ? (
          <div className="text-center py-12 text-white/40">
            <svg
              className="mx-auto mb-4 text-white/20"
              width="64"
              height="64"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <p className="text-lg mb-2">No servers found</p>
            <p className="text-sm">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredServers.map((server) => (
              <MCPServerItem
                key={server.id}
                server={server}
                isEnabled={isServerEnabled(server)}
                isLoading={isServerLoading(server.id)}
                onInstall={handleServerInstall}
                onConfigure={handleServerConfigure}
                onToggle={handleServerToggle}
              />
            ))}
          </div>
        )}
      </div>

      {/* Configuration Drawer */}
      <MCPConfigurationDrawer
        server={selectedServer}
        isOpen={configDrawerOpen}
        onClose={() => {
          setConfigDrawerOpen(false);
          setSelectedServer(null);
        }}
        onSave={handleConfigurationSave}
        isLoading={selectedServer ? isServerLoading(selectedServer.id) : false}
      />
    </div>
  );
} 
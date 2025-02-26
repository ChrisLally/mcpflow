'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { ServerForm } from '@/components/mcp-servers/server-form'
import { ServerList } from '@/components/mcp-servers/server-list'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface MCPServer {
  id: string
  name: string
  description: string | null
  repo_url: string
  repo_branch: string
  config: Record<string, unknown>
  is_public: boolean
  is_configured: boolean
}

type ServerFormData = {
  name: string
  description: string | null
  repo_url: string
  repo_branch: string
  config: Record<string, unknown>
  is_public: boolean
}

export default function MCPServersPage() {
  const [servers, setServers] = useState<MCPServer[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedServer, setSelectedServer] = useState<MCPServer | null>(null)
  const supabase = createClientComponentClient()

  const loadServers = useCallback(async () => {
    try {
      setIsLoading(true)
      const { data, error } = await supabase
        .from('available_mcp_servers')
        .select('*')
      
      if (error) throw error
      setServers(data || [])
    } catch (error) {
      console.error('Error loading MCP servers:', error)
    } finally {
      setIsLoading(false)
    }
  }, [supabase])

  const handleSubmit = async (data: ServerFormData) => {
    try {
      if (selectedServer) {
        // Update existing server
        const { error } = await supabase
          .from('_server_configs')
          .update(data)
          .eq('id', selectedServer.id)
        
        if (error) throw error
      } else {
        // Create new server
        const { error } = await supabase
          .from('_server_configs')
          .insert([data])
        
        if (error) throw error
      }

      setIsDialogOpen(false)
      setSelectedServer(null)
      loadServers()
    } catch (error) {
      console.error('Error saving MCP server:', error)
      throw error
    }
  }

  const handleDelete = async (serverId: string) => {
    try {
      const { error } = await supabase
        .from('_server_configs')
        .delete()
        .eq('id', serverId)
      
      if (error) throw error
      loadServers()
    } catch (error) {
      console.error('Error deleting MCP server:', error)
      throw error
    }
  }

  const handleEdit = (server: MCPServer) => {
    setSelectedServer(server)
    setIsDialogOpen(true)
  }

  useEffect(() => {
    loadServers()
  }, [loadServers])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">MCP Servers</h1>
          <p className="text-muted-foreground">
            Manage your Model Context Protocol server configurations
          </p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Server
        </Button>
      </div>

      {isLoading ? (
        <div className="flex h-[200px] items-center justify-center">
          <div className="text-muted-foreground">Loading servers...</div>
        </div>
      ) : servers.length === 0 ? (
        <div className="flex h-[200px] items-center justify-center">
          <div className="text-muted-foreground">No MCP servers configured</div>
        </div>
      ) : (
        <ServerList
          servers={servers}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedServer ? 'Edit Server' : 'Add Server'}
            </DialogTitle>
          </DialogHeader>
          <ServerForm
            initialData={selectedServer}
            onSubmit={handleSubmit}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
} 
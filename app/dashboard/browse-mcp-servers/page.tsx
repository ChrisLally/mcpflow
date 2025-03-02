'use client'

import { useEffect, useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { useSupabase } from '@/components/providers/supabase-provider'
import { toast } from 'sonner'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'

interface MCPServerConfig {
  id: string
  name: string
  description: string | null
  category: string
  popularity: number
  last_updated: string
  config_json: Record<string, unknown>
}

export default function BrowseMCPServersPage() {
  const supabase = useSupabase()
  const [serverConfigs, setServerConfigs] = useState<MCPServerConfig[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedConfig, setSelectedConfig] = useState<MCPServerConfig | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isAdding, setIsAdding] = useState(false)

  const loadServerConfigs = useCallback(async () => {
    try {
      setIsLoading(true)
      // In a real implementation, this would fetch from a read-only table or external source
      const { data, error } = await supabase
        .from('public_mcp_configs')
        .select('*')
      
      if (error) throw error
      setServerConfigs(data || [])
    } catch (error) {
      console.error('Error loading MCP server configurations:', error)
      if (error instanceof Error) {
        toast.error('Error loading configurations', {
          description: error.message
        })
      }
    } finally {
      setIsLoading(false)
    }
  }, [supabase])

  const handleAddToMyServers = async (config: MCPServerConfig) => {
    try {
      setIsAdding(true)
      
      // Create a new entry in _server_configs
      const { error } = await supabase
        .from('_server_configs')
        .insert([{
          name: config.name,
          description: config.description,
          config: config.config_json,
          status: 'inactive' // Default to inactive
        }])
      
      if (error) throw error
      
      toast.success('Configuration added to My Servers')
      setIsDialogOpen(false)
    } catch (error) {
      console.error('Error adding configuration:', error)
      if (error instanceof Error) {
        toast.error('Error adding configuration', {
          description: error.message
        })
      }
    } finally {
      setIsAdding(false)
    }
  }

  useEffect(() => {
    loadServerConfigs()
  }, [loadServerConfigs])

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Browse MCP Servers</h1>
          <p className="text-muted-foreground">
            Explore and adopt MCP server configurations
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex h-[200px] items-center justify-center">
          <div className="text-muted-foreground">Loading configurations...</div>
        </div>
      ) : serverConfigs.length === 0 ? (
        <div className="flex h-[200px] items-center justify-center">
          <div className="text-muted-foreground">No public configurations available</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {serverConfigs.map((config) => (
            <Card key={config.id} className="overflow-hidden">
              <CardHeader>
                <CardTitle>{config.name}</CardTitle>
                <CardDescription>{config.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2 mb-4">
                  <Badge>{config.category}</Badge>
                  <Badge variant="outline">{config.popularity} users</Badge>
                  <Badge variant="secondary">
                    Updated {new Date(config.last_updated).toLocaleDateString()}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {config.description}
                </p>
              </CardContent>
              <CardFooter>
                <Button 
                  onClick={() => {
                    setSelectedConfig(config)
                    setIsDialogOpen(true)
                  }}
                  className="w-full"
                >
                  View Details
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{selectedConfig?.name}</DialogTitle>
            <DialogDescription>
              {selectedConfig?.description}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium">Configuration Preview</h4>
              <pre className="mt-2 w-full rounded-md bg-slate-950 p-4 overflow-auto text-xs text-white">
                {selectedConfig && JSON.stringify(selectedConfig.config_json, null, 2)}
              </pre>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => selectedConfig && handleAddToMyServers(selectedConfig)}
              disabled={isAdding}
            >
              {isAdding ? 'Adding...' : 'Add to My Servers'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 
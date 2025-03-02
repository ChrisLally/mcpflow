'use client'

import { useEffect, useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Plus, Play, Pause, ExternalLink } from 'lucide-react'
import { useSupabase } from '@/components/providers/supabase-provider'
import { toast } from 'sonner'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Textarea } from '@/components/ui/textarea'

interface ServerConfig {
  id: string
  name: string
  description: string | null
  hosted_url: string | null
  status: 'running' | 'stopped' | 'error'
  config_json: Record<string, unknown>
  created_at: string
  updated_at: string
}

export default function MyServersPage() {
  const supabase = useSupabase()
  const [servers, setServers] = useState<ServerConfig[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedServer, setSelectedServer] = useState<ServerConfig | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isConfigDialogOpen, setIsConfigDialogOpen] = useState(false)
  const [configJson, setConfigJson] = useState('')
  const [isUpdating, setIsUpdating] = useState(false)

  const loadServers = useCallback(async () => {
    try {
      setIsLoading(true)
      const { data, error } = await supabase
        .from('_server_configs')
        .select('*')
      
      if (error) throw error
      setServers(data || [])
    } catch (error) {
      console.error('Error loading servers:', error)
      if (error instanceof Error) {
        toast.error('Error loading servers', {
          description: error.message
        })
      }
    } finally {
      setIsLoading(false)
    }
  }, [supabase])

  const handleStatusChange = async (serverId: string, newStatus: 'running' | 'stopped') => {
    try {
      setIsUpdating(true)
      const { error } = await supabase
        .from('_server_configs')
        .update({ status: newStatus })
        .eq('id', serverId)
      
      if (error) throw error
      
      toast.success(`Server ${newStatus === 'running' ? 'started' : 'stopped'} successfully`)
      loadServers()
    } catch (error) {
      console.error(`Error ${newStatus === 'running' ? 'starting' : 'stopping'} server:`, error)
      if (error instanceof Error) {
        toast.error(`Error ${newStatus === 'running' ? 'starting' : 'stopping'} server`, {
          description: error.message
        })
      }
    } finally {
      setIsUpdating(false)
    }
  }

  const handleDelete = async (serverId: string) => {
    try {
      setIsUpdating(true)
      const { error } = await supabase
        .from('_server_configs')
        .delete()
        .eq('id', serverId)
      
      if (error) throw error
      
      toast.success('Server deleted successfully')
      loadServers()
    } catch (error) {
      console.error('Error deleting server:', error)
      if (error instanceof Error) {
        toast.error('Error deleting server', {
          description: error.message
        })
      }
    } finally {
      setIsUpdating(false)
    }
  }

  const handleEditConfig = (server: ServerConfig) => {
    setSelectedServer(server)
    setConfigJson(JSON.stringify(server.config_json, null, 2))
    setIsConfigDialogOpen(true)
  }

  const handleSaveConfig = async () => {
    if (!selectedServer) return
    
    try {
      setIsUpdating(true)
      
      // Parse the JSON to validate it
      const configObject = JSON.parse(configJson)
      
      const { error } = await supabase
        .from('_server_configs')
        .update({ config_json: configObject })
        .eq('id', selectedServer.id)
      
      if (error) throw error
      
      toast.success('Server configuration updated successfully')
      setIsConfigDialogOpen(false)
      loadServers()
    } catch (error) {
      if (error instanceof SyntaxError) {
        toast.error('Invalid JSON format', {
          description: error.message
        })
      } else if (error instanceof Error) {
        toast.error('Error updating configuration', {
          description: error.message
        })
      }
    } finally {
      setIsUpdating(false)
    }
  }

  useEffect(() => {
    loadServers()
  }, [loadServers])

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Servers</h1>
          <p className="text-muted-foreground">
            Manage your hosted MCP servers
          </p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add New Server
        </Button>
      </div>

      {isLoading ? (
        <div className="flex h-[200px] items-center justify-center">
          <div className="text-muted-foreground">Loading servers...</div>
        </div>
      ) : servers.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No Servers Configured</CardTitle>
            <CardDescription>
              You haven&apos;t added any MCP servers yet. Get started by adding a server or browsing available configurations.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center gap-4">
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Server
            </Button>
            <Button variant="outline" asChild>
              <a href="/dashboard/browse-mcp-servers">Browse Configurations</a>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Hosted URL</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {servers.map((server) => (
              <TableRow key={server.id}>
                <TableCell className="font-medium">{server.name}</TableCell>
                <TableCell>{server.description}</TableCell>
                <TableCell>
                  <Badge
                    variant={
                      server.status === 'running'
                        ? 'default'
                        : server.status === 'error'
                        ? 'destructive'
                        : 'secondary'
                    }
                  >
                    {server.status === 'running'
                      ? 'Running'
                      : server.status === 'error'
                      ? 'Error'
                      : 'Stopped'}
                  </Badge>
                </TableCell>
                <TableCell>
                  {server.hosted_url ? (
                    <a
                      href={server.hosted_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center text-blue-600 hover:underline"
                    >
                      {server.hosted_url.replace(/^https?:\/\//, '')}
                      <ExternalLink className="ml-1 h-3 w-3" />
                    </a>
                  ) : (
                    <span className="text-muted-foreground">Not deployed</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    {server.status === 'running' ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleStatusChange(server.id, 'stopped')}
                        disabled={isUpdating}
                      >
                        <Pause className="mr-1 h-3 w-3" />
                        Stop
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleStatusChange(server.id, 'running')}
                        disabled={isUpdating}
                      >
                        <Play className="mr-1 h-3 w-3" />
                        Start
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditConfig(server)}
                    >
                      Edit Config
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm">
                          Delete
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete the server configuration and stop any running instances.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(server.id)}
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* Config Editor Dialog */}
      <Dialog open={isConfigDialogOpen} onOpenChange={setIsConfigDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Server Configuration</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              className="font-mono h-[300px]"
              value={configJson}
              onChange={(e) => setConfigJson(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsConfigDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveConfig} disabled={isUpdating}>
              Save Configuration
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Server Dialog - This would be a more complex form in a real implementation */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Server</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-center text-muted-foreground">
              This is a placeholder for the server creation form.
              <br />
              In a real implementation, this would include fields for name, description, and configuration options.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => {
              toast.info("This is a placeholder. Server creation would happen here.")
              setIsDialogOpen(false)
            }}>
              Add Server
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 
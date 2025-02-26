'use client'

import { useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

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

interface ServerListProps {
  servers: MCPServer[]
  onEdit: (server: MCPServer) => void
  onDelete: (serverId: string) => Promise<void>
}

export function ServerList({ servers, onEdit, onDelete }: ServerListProps) {
  const [isDeleting, setIsDeleting] = useState<string | null>(null)

  const handleDelete = async (serverId: string) => {
    try {
      setIsDeleting(serverId)
      await onDelete(serverId)
      toast.success('MCP server deleted successfully.')
    } catch (error) {
      console.error('Error deleting server:', error)
      toast.error('Failed to delete MCP server.')
    } finally {
      setIsDeleting(null)
    }
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Description</TableHead>
          <TableHead>Repository</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="w-[70px]"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {servers.map((server) => (
          <TableRow key={server.id}>
            <TableCell className="font-medium">{server.name}</TableCell>
            <TableCell>{server.description}</TableCell>
            <TableCell>
              {server.repo_url}
              {server.repo_branch !== 'main' && (
                <Badge variant="secondary" className="ml-2">
                  {server.repo_branch}
                </Badge>
              )}
            </TableCell>
            <TableCell>
              <Badge
                variant={server.is_configured ? 'default' : 'secondary'}
              >
                {server.is_configured ? 'Active' : 'Not Configured'}
              </Badge>
              {server.is_public && (
                <Badge variant="outline" className="ml-2">
                  Public
                </Badge>
              )}
            </TableCell>
            <TableCell>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="h-8 w-8 p-0"
                  >
                    <span className="sr-only">Open menu</span>
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onEdit(server)}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleDelete(server.id)}
                    disabled={isDeleting === server.id}
                    className="text-red-600"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
} 
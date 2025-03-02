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
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

interface Service {
  id: string
  name: string
  description: string
  base_url: string
  auth_header: string
  config: Record<string, unknown>
}

interface ServiceListProps {
  services: Service[]
  onEdit: (service: Service) => void
  onDelete: (serviceId: string) => Promise<void>
}

export function ServiceList({ services, onEdit, onDelete }: ServiceListProps) {
  const [isDeleting, setIsDeleting] = useState<string | null>(null)

  const handleDelete = async (serviceId: string) => {
    try {
      setIsDeleting(serviceId)
      await onDelete(serviceId)
      toast.success('Service deleted successfully.')
    } catch (error) {
      console.error('Error deleting service:', error)
      toast.error('Failed to delete service.')
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
          <TableHead>Base URL</TableHead>
          <TableHead>Auth Header</TableHead>
          <TableHead className="w-[70px]"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {services.map((service) => (
          <TableRow key={service.id}>
            <TableCell className="font-medium">{service.name}</TableCell>
            <TableCell>{service.description}</TableCell>
            <TableCell>{service.base_url}</TableCell>
            <TableCell>{service.auth_header}</TableCell>
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
                  <DropdownMenuItem onClick={() => onEdit(service)}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleDelete(service.id)}
                    disabled={isDeleting === service.id}
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
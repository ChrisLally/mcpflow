'use client'

import { useEffect, useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { useSupabase } from '@/components/providers/supabase-provider'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
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

interface Service {
  id: string
  name: string
  description: string
  base_url: string
  auth_header: string
  config: Record<string, unknown>
}

export default function ServicesPage() {
  const supabase = useSupabase()
  const [services, setServices] = useState<Service[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  
  // Form state
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [baseUrl, setBaseUrl] = useState('')
  const [authHeader, setAuthHeader] = useState('Authorization')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const loadServices = useCallback(async () => {
    try {
      setIsLoading(true)
      const { data, error } = await supabase
        .from('_services')
        .select('*')
      
      if (error) throw error
      setServices(data || [])
    } catch (error) {
      console.error('Error loading services:', error)
      if (error instanceof Error) {
        toast.error('Error loading services', {
          description: error.message
        })
      }
    } finally {
      setIsLoading(false)
    }
  }, [supabase])

  const handleSubmit = async () => {
    if (!name || !description || !baseUrl) {
      toast.error('Please fill in all required fields')
      return
    }

    setIsSubmitting(true)
    try {
      const serviceData = {
        name: name.toLowerCase(),
        description,
        base_url: baseUrl,
        auth_header: authHeader,
        config: {}
      }

      if (selectedService) {
        // Update existing service
        const { error } = await supabase
          .from('_services')
          .update(serviceData)
          .eq('id', selectedService.id)
        
        if (error) throw error
        toast.success('Service updated successfully')
      } else {
        // Create new service
        const { error } = await supabase
          .from('_services')
          .insert([serviceData])
        
        if (error) throw error
        toast.success('Service added successfully')
      }

      setIsDialogOpen(false)
      resetForm()
      loadServices()
    } catch (error) {
      console.error('Error saving service:', error)
      if (error instanceof Error) {
        toast.error('Error saving service', {
          description: error.message
        })
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (serviceId: string) => {
    try {
      // Check if service is in use by any API keys
      const { data: apiKeys, error: checkError } = await supabase
        .from('_api_keys')
        .select('id')
        .eq('service', services.find(s => s.id === serviceId)?.name)
        .limit(1)
      
      if (checkError) throw checkError
      
      if (apiKeys && apiKeys.length > 0) {
        toast.error('Cannot delete service', {
          description: 'This service is in use by one or more API keys'
        })
        return
      }

      const { error } = await supabase
        .from('_services')
        .delete()
        .eq('id', serviceId)
      
      if (error) throw error
      toast.success('Service deleted successfully')
      loadServices()
    } catch (error) {
      console.error('Error deleting service:', error)
      if (error instanceof Error) {
        toast.error('Error deleting service', {
          description: error.message
        })
      }
    }
  }

  const handleEdit = (service: Service) => {
    setSelectedService(service)
    setName(service.name)
    setDescription(service.description || '')
    setBaseUrl(service.base_url || '')
    setAuthHeader(service.auth_header || 'Authorization')
    setIsDialogOpen(true)
  }

  const resetForm = () => {
    setSelectedService(null)
    setName('')
    setDescription('')
    setBaseUrl('')
    setAuthHeader('Authorization')
  }

  useEffect(() => {
    loadServices()
  }, [loadServices])

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Services</h1>
          <p className="text-muted-foreground">
            Manage your API service integrations
          </p>
        </div>
        <Button 
          onClick={() => {
            resetForm()
            setIsDialogOpen(true)
          }}
          className="px-4 py-2"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Service
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Available Services</CardTitle>
          <CardDescription>
            Services that can be used with API keys
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex h-[200px] items-center justify-center">
              <div className="text-muted-foreground">Loading services...</div>
            </div>
          ) : services.length === 0 ? (
            <div className="flex h-[200px] items-center justify-center">
              <div className="text-muted-foreground">No services configured</div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Base URL</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {services.map((service) => (
                  <TableRow key={service.id}>
                    <TableCell className="font-medium">{service.name}</TableCell>
                    <TableCell>{service.description}</TableCell>
                    <TableCell>{service.base_url}</TableCell>
                    <TableCell className="flex space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleEdit(service)}
                      >
                        Edit
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="sm">Delete</Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This will permanently delete the service.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(service.id)}>
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedService ? 'Edit Service' : 'Add Service'}
            </DialogTitle>
            <DialogDescription>
              Configure a service for API key integration
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium">Name</label>
              <input 
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="openai" 
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Lowercase name without spaces (e.g., openai, anthropic)
              </p>
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">Description</label>
              <input 
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="OpenAI API" 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">Base URL</label>
              <input 
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="https://api.openai.com/v1" 
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">Auth Header</label>
              <input 
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Authorization" 
                value={authHeader}
                onChange={(e) => setAuthHeader(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Header name used for authentication (default: Authorization)
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button 
              onClick={handleSubmit} 
              disabled={isSubmitting}
            >
              {isSubmitting ? "Saving..." : selectedService ? "Update" : "Add"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 
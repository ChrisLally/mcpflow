'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

const serviceFormSchema = z.object({
  name: z.string().min(1, 'Name is required').regex(/^[a-z0-9-]+$/, 'Name must be lowercase with no spaces'),
  description: z.string().min(1, 'Description is required'),
  base_url: z.string().url('Must be a valid URL'),
  auth_header: z.string().default('Authorization'),
  config: z.record(z.unknown()).default({}),
})

export type ServiceFormData = z.infer<typeof serviceFormSchema>

interface ServiceFormProps {
  initialData?: ServiceFormData | null
  onSubmit: (data: ServiceFormData) => Promise<void>
}

export function ServiceForm({ initialData, onSubmit }: ServiceFormProps) {
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<ServiceFormData>({
    resolver: zodResolver(serviceFormSchema),
    defaultValues: {
      name: initialData?.name || '',
      description: initialData?.description || '',
      base_url: initialData?.base_url || '',
      auth_header: initialData?.auth_header || 'Authorization',
      config: initialData?.config || {},
    },
  })

  const handleSubmit = async (data: ServiceFormData) => {
    try {
      setIsLoading(true)
      await onSubmit(data)
      toast.success('Service configuration saved successfully.')
    } catch (error) {
      console.error('Error saving service:', error)
      toast.error('Failed to save service configuration.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Service Name</FormLabel>
              <FormControl>
                <Input placeholder="openai" {...field} />
              </FormControl>
              <FormDescription>
                A unique identifier for this service (lowercase, no spaces)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="OpenAI API"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                A human-readable description of this service
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="base_url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Base URL</FormLabel>
              <FormControl>
                <Input
                  placeholder="https://api.openai.com/v1"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                The base URL for the service API
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="auth_header"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Auth Header</FormLabel>
              <FormControl>
                <Input placeholder="Authorization" {...field} />
              </FormControl>
              <FormDescription>
                The header used for authentication (default: Authorization)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Service
        </Button>
      </form>
    </Form>
  )
} 
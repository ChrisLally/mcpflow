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
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

const serverFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().nullable(),
  repo_url: z.string().url('Must be a valid URL'),
  repo_branch: z.string().default('main'),
  config: z.record(z.unknown()).default({}),
  is_public: z.boolean().default(false),
})

export type ServerFormData = z.infer<typeof serverFormSchema>

interface ServerFormProps {
  initialData?: ServerFormData | null
  onSubmit: (data: ServerFormData) => Promise<void>
}

export function ServerForm({ initialData, onSubmit }: ServerFormProps) {
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<ServerFormData>({
    resolver: zodResolver(serverFormSchema),
    defaultValues: {
      name: initialData?.name || '',
      description: initialData?.description || null,
      repo_url: initialData?.repo_url || '',
      repo_branch: initialData?.repo_branch || 'main',
      config: initialData?.config || {},
      is_public: initialData?.is_public || false,
    },
  })

  const handleSubmit = async (data: ServerFormData) => {
    try {
      setIsLoading(true)
      await onSubmit(data)
      toast.success('MCP server configuration saved successfully.')
    } catch (error) {
      console.error('Error saving server:', error)
      toast.error('Failed to save MCP server configuration.')
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
              <FormLabel>Server Name</FormLabel>
              <FormControl>
                <Input placeholder="github-mcp" {...field} />
              </FormControl>
              <FormDescription>
                A unique identifier for this MCP server
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
                  placeholder="GitHub MCP server for accessing repositories and issues"
                  {...field}
                  value={field.value || ''}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => field.onChange(e.target.value || null)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="repo_url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Repository URL</FormLabel>
              <FormControl>
                <Input
                  placeholder="https://github.com/modelcontextprotocol/server-github"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                The GitHub repository containing the MCP server implementation
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="repo_branch"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Branch</FormLabel>
              <FormControl>
                <Input placeholder="main" {...field} />
              </FormControl>
              <FormDescription>
                The branch to use for the server implementation
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="is_public"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Public Server</FormLabel>
                <FormDescription>
                  Make this server configuration available to all users
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Server
        </Button>
      </form>
    </Form>
  )
} 
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useSupabase } from '../providers/supabase-provider';
import { Button } from '../ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../ui/form';
import { Input } from '../ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { toast } from 'sonner';

// Form validation schema
const apiKeySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  key: z.string().min(1, 'API Key is required'),
  service: z.string().min(1, 'Service is required'),
});

type ApiKeyFormValues = z.infer<typeof apiKeySchema>;

interface Service {
  name: string;
  description: string;
}

interface ApiKeyFormProps {
  onSuccess?: () => void;
  initialData?: ApiKeyFormValues;
  services: Service[];
}

export function ApiKeyForm({ onSuccess, initialData, services }: ApiKeyFormProps) {
  const supabase = useSupabase();
  const [isLoading, setIsLoading] = useState(false);

  // Initialize form with react-hook-form
  const form = useForm<ApiKeyFormValues>({
    resolver: zodResolver(apiKeySchema),
    defaultValues: initialData || {
      name: '',
      key: '',
      service: '',
    },
  });

  // Handle form submission
  const onSubmit = async (values: ApiKeyFormValues) => {
    setIsLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error('You must be logged in to add an API key');

      // Encrypt the API key using the server endpoint
      const response = await fetch('/api/encrypt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ apiKey: values.key }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to encrypt API key');
      }

      const { encryptedKey } = await response.json();

      const { error } = await supabase
        .from('_api_keys')
        .insert({
          name: values.name,
          encrypted_key: encryptedKey,
          service: values.service.toLowerCase(),
          user_id: user.id,
        });

      if (error) throw error;

      toast.success('API key has been saved securely');
      form.reset();
      onSuccess?.();
    } catch (error) {
      if (error instanceof Error) {
        toast.error('Error', {
          description: error.message
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="Development API Key" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="service"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Service</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a service" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {services.map((service) => (
                    <SelectItem key={service.name} value={service.name}>
                      {service.name} - {service.description}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="key"
          render={({ field }) => (
            <FormItem>
              <FormLabel>API Key</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  placeholder="Enter your API key"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Saving...' : 'Save API Key'}
        </Button>
      </form>
    </Form>
  );
} 
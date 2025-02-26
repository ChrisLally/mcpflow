'use client';

import { useEffect, useState } from 'react';
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

interface ApiKeyFormProps {
  onSuccess?: () => void;
  initialData?: ApiKeyFormValues;
}

export function ApiKeyForm({ onSuccess, initialData }: ApiKeyFormProps) {
  const { supabase } = useSupabase();
  const [isLoading, setIsLoading] = useState(false);
  const [services, setServices] = useState<{ id: string; name: string }[]>([]);

  // Initialize form with react-hook-form
  const form = useForm<ApiKeyFormValues>({
    resolver: zodResolver(apiKeySchema),
    defaultValues: initialData || {
      name: '',
      key: '',
      service: '',
    },
  });

  // Load available services
  const loadServices = async () => {
    const { data, error } = await supabase
      .from('_services')
      .select('id, name');
    
    if (error) {
      toast.error('Error loading services', {
        description: error.message
      });
      return;
    }

    setServices(data || []);
  };

  // Load services on mount
  useEffect(() => {
    loadServices();
  }, []);

  // Handle form submission
  const onSubmit = async (values: ApiKeyFormValues) => {
    setIsLoading(true);
    try {
      // TODO: Implement client-side encryption of the API key
      const encryptedKey = values.key; // Replace with actual encryption

      const { error } = await supabase.from('_api_keys').insert({
        name: values.name,
        encrypted_key: encryptedKey,
        service: values.service,
      });

      if (error) throw error;

      toast.success('API key has been saved');
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
                    <SelectItem key={service.id} value={service.id}>
                      {service.name}
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
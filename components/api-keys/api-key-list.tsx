'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSupabase } from '../providers/supabase-provider';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import { Button } from '../ui/button';
import { toast } from 'sonner';
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
} from '../ui/alert-dialog';

interface ApiKey {
  id: string;
  name: string;
  service: string;
  created_at: string;
  updated_at: string;
}

export function ApiKeyList() {
  const supabase = useSupabase();
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load API keys
  const loadApiKeys = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('_api_keys')
        .select(`
          id,
          name,
          service,
          created_at,
          updated_at
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setApiKeys(data || []);
    } catch (error) {
      if (error instanceof Error) {
        toast.error('Error loading API keys', {
          description: error.message
        });
      }
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  // Delete API key
  const deleteApiKey = async (id: string) => {
    try {
      const { error } = await supabase
        .from('_api_keys')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('API key has been deleted');

      // Reload the list
      loadApiKeys();
    } catch (error) {
      if (error instanceof Error) {
        toast.error('Error deleting API key', {
          description: error.message
        });
      }
    }
  };

  // Load API keys on component mount
  useEffect(() => {
    loadApiKeys();
  }, [loadApiKeys]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Service</TableHead>
            <TableHead>Created</TableHead>
            <TableHead>Last Updated</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {apiKeys.map((apiKey) => (
            <TableRow key={apiKey.id}>
              <TableCell>{apiKey.name}</TableCell>
              <TableCell>{apiKey.service}</TableCell>
              <TableCell>{new Date(apiKey.created_at).toLocaleDateString()}</TableCell>
              <TableCell>{new Date(apiKey.updated_at).toLocaleDateString()}</TableCell>
              <TableCell>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm">Delete</Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete the API key.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => deleteApiKey(apiKey.id)}>
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
    </div>
  );
} 
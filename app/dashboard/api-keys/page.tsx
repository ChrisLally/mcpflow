'use client';

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ApiKeyList } from "@/components/api-keys/api-key-list";
import { useSupabase } from "@/components/providers/supabase-provider";
import { toast } from "sonner";

interface Service {
  name: string;
  description: string;
}

export default function APIKeysPage() {
  const supabase = useSupabase();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [apiKeyName, setApiKeyName] = useState("");
  const [apiKeyValue, setApiKeyValue] = useState("");
  const [selectedService, setSelectedService] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [services, setServices] = useState<Service[]>([]);
  const [isLoadingServices, setIsLoadingServices] = useState(true);

  // Fetch available services from the database
  useEffect(() => {
    const fetchServices = async () => {
      setIsLoadingServices(true);
      try {
        const { data, error } = await supabase
          .from('_services')
          .select('name, description');

        if (error) throw error;
        
        if (data && data.length > 0) {
          setServices(data);
          setSelectedService(data[0].name); // Set first service as default
        }
      } catch (error) {
        if (error instanceof Error) {
          toast.error('Error loading services', {
            description: error.message
          });
        }
      } finally {
        setIsLoadingServices(false);
      }
    };

    fetchServices();
  }, [supabase]);

  const handleAddApiKey = async () => {
    if (!apiKeyName || !apiKeyValue || !selectedService) {
      toast.error("Please provide all required fields");
      return;
    }

    setIsSubmitting(true);
    try {
      // Get the current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("You must be logged in to add an API key");
        return;
      }

      // Encrypt the API key using the server endpoint
      const response = await fetch('/api/encrypt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ apiKey: apiKeyValue }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to encrypt API key');
      }

      const { encryptedKey } = await response.json();

      // Save the encrypted key to Supabase
      const { error } = await supabase
        .from('_api_keys')
        .insert({
          name: apiKeyName,
          encrypted_key: encryptedKey,
          service: selectedService.toLowerCase(),
          user_id: user.id,
        });

      if (error) throw error;

      toast.success('API key has been saved securely');
      setIsDialogOpen(false);
      setApiKeyName("");
      setApiKeyValue("");
      if (services.length > 0) {
        setSelectedService(services[0].name);
      }
      
      // Trigger a refresh of the API key list
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      if (error instanceof Error) {
        toast.error('Error adding API key', {
          description: error.message
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">API Keys</h1>
          <p className="text-muted-foreground">
            Manage your API keys and service integrations
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="px-4 py-2">
              <Plus className="mr-2 h-4 w-4" />
              Add API Key
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add New API Key</DialogTitle>
              <DialogDescription>
                Enter a name and the API key you want to encrypt and store.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <label className="text-sm font-medium">Name</label>
                <input 
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="Development API Key" 
                  value={apiKeyName}
                  onChange={(e) => setApiKeyName(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium">Service</label>
                <select 
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={selectedService}
                  onChange={(e) => setSelectedService(e.target.value)}
                  disabled={isLoadingServices || services.length === 0}
                >
                  {isLoadingServices ? (
                    <option>Loading services...</option>
                  ) : services.length === 0 ? (
                    <option>No services available</option>
                  ) : (
                    services.map((service) => (
                      <option key={service.name} value={service.name}>
                        {service.name} - {service.description}
                      </option>
                    ))
                  )}
                </select>
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium">API Key</label>
                <input 
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  type="password"
                  placeholder="Enter your API key" 
                  value={apiKeyValue}
                  onChange={(e) => setApiKeyValue(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button 
                onClick={handleAddApiKey} 
                disabled={isSubmitting || isLoadingServices || services.length === 0}
              >
                {isSubmitting ? "Adding..." : "Add Key"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Your API Keys</CardTitle>
            <CardDescription>
              View and manage your encrypted API keys
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ApiKeyList key={refreshTrigger} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 
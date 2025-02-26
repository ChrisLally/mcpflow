'use client';

import { useState } from 'react';
import { ApiKeyForm } from '@/components/api-keys/api-key-form';
import { ApiKeyList } from '@/components/api-keys/api-key-list';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

export default function ApiKeysPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleSuccess = () => {
    setIsDialogOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">API Keys</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>Add API Key</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New API Key</DialogTitle>
            </DialogHeader>
            <ApiKeyForm onSuccess={handleSuccess} />
          </DialogContent>
        </Dialog>
      </div>

      <ApiKeyList />
    </div>
  );
} 
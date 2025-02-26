'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { useSupabase } from '@/components/providers/supabase-provider';
import { useRouter } from 'next/navigation';

interface KMSTestResult {
  success: boolean;
  encryptedKey: string;
  keyLength: number;
  encryptedLength: number;
  matches: boolean;
}

export default function TestKMSPage() {
  const supabase = useSupabase();
  const router = useRouter();
  const [testKey, setTestKey] = useState('');
  const [result, setResult] = useState<KMSTestResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Please sign in to use this feature');
        router.push('/login');
      }
    };
    
    checkAuth();
  }, [supabase, router]);

  const testKMS = async () => {
    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Please sign in to use this feature');
        router.push('/login');
        return;
      }

      const response = await fetch('/api/test-kms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        credentials: 'include',
        body: JSON.stringify({ testKey }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to test KMS');
      }

      const data = await response.json();
      setResult(data);

      if (data.success) {
        toast.success('KMS encryption/decryption test successful!');
      } else {
        toast.error('KMS test failed - decrypted value does not match original');
      }
    } catch (error) {
      if (error instanceof Error) {
        toast.error('Error testing KMS', {
          description: error.message
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-2xl font-bold">Test KMS Encryption/Decryption</h1>
      
      <div className="space-y-4 max-w-lg">
        <div className="space-y-2">
          <label className="text-sm font-medium">Test Key</label>
          <Input
            value={testKey}
            onChange={(e) => setTestKey(e.target.value)}
            placeholder="Enter a test key to encrypt/decrypt"
          />
        </div>

        <Button onClick={testKMS} disabled={isLoading || !testKey}>
          {isLoading ? 'Testing...' : 'Test KMS'}
        </Button>

        {result && (
          <div className="mt-8 space-y-4">
            <h2 className="text-xl font-semibold">Results</h2>
            <div className="bg-secondary p-4 rounded-lg space-y-2">
              <p><strong>Success:</strong> {result.success ? 'Yes' : 'No'}</p>
              <p><strong>Original Length:</strong> {result.keyLength}</p>
              <p><strong>Encrypted Length:</strong> {result.encryptedLength}</p>
              <p className="break-all"><strong>Encrypted Key:</strong> {result.encryptedKey}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 
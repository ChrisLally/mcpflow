import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { ApiKeyForm } from './api-key-form';

export async function ApiKeyFormWrapper() {
  const supabase = createServerComponentClient({ cookies });

  const { data: services, error } = await supabase
    .from('_services')
    .select('name, description');

  if (error) {
    console.error('Error loading services:', error);
    return (
      <div className="p-4 text-red-500">
        Failed to load services. Please try again later.
      </div>
    );
  }

  return <ApiKeyForm services={services || []} />;
} 
import { NextResponse } from 'next/server';
import { encryptCredential } from '@/lib/kms';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    // Get the current user from Supabase
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get the API key from the request body
    const { apiKey } = await request.json();

    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key is required' },
        { status: 400 }
      );
    }

    // Encrypt the API key
    const encryptedKey = await encryptCredential(apiKey);

    return NextResponse.json({ encryptedKey });
  } catch (error) {
    console.error('Error encrypting API key:', error);
    return NextResponse.json(
      { error: 'Failed to encrypt API key' },
      { status: 500 }
    );
  }
} 
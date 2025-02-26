import { NextResponse } from 'next/server';
import { encryptCredential, decryptCredential } from '@/lib/kms';
import { createServerClient, CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    // Get the cookie store and await it
    const cookieStore = await cookies();
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: CookieOptions) {
            cookieStore.set({ name, value, ...options });
          },
          remove(name: string, options: CookieOptions) {
            cookieStore.delete({ name, ...options });
          },
        },
      }
    );

    // Get the authorization header
    const authHeader = request.headers.get('Authorization');
    console.log('Auth header:', authHeader ? 'Present' : 'Missing');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      );
    }

    // Extract the token
    const token = authHeader.split(' ')[1];
    console.log('Token length:', token.length);
    
    // Verify the token
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError) {
      console.error('Auth error:', authError);
      return NextResponse.json(
        { error: `Authentication error: ${authError.message}` },
        { status: 401 }
      );
    }
    
    if (!user) {
      return NextResponse.json(
        { error: 'No user found with provided token' },
        { status: 401 }
      );
    }

    console.log('User authenticated:', user.id);

    // Get the test key from the request body
    const body = await request.json();
    console.log('Request body:', body);
    
    const { testKey } = body;
    if (!testKey) {
      return NextResponse.json(
        { error: 'Test key is required' },
        { status: 400 }
      );
    }

    // Test encryption
    console.log('Starting encryption...');
    const encryptedKey = await encryptCredential(testKey);
    console.log('Encryption successful, length:', encryptedKey.length);

    // Test decryption
    console.log('Starting decryption...');
    const decryptedKey = await decryptCredential(encryptedKey);
    console.log('Decryption successful, matches original:', testKey === decryptedKey);

    return NextResponse.json({
      success: true,
      encryptedKey,
      keyLength: testKey.length,
      encryptedLength: encryptedKey.length,
      matches: testKey === decryptedKey
    });
  } catch (error: unknown) {
    console.error('Detailed error:', error);
    
    if (error instanceof Error) {
      // Check for KMS permission errors
      if (error.message.includes('PERMISSION_DENIED')) {
        return NextResponse.json(
          { 
            error: 'Google Cloud KMS permission denied',
            details: 'Please ensure your service account has the required KMS permissions',
            message: error.message
          },
          { status: 403 }
        );
      }
      
      return NextResponse.json(
        { 
          error: 'Failed to test KMS encryption/decryption',
          details: error.message,
          type: error.name
        },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { 
        error: 'An unknown error occurred',
        details: 'Please check the server logs for more information'
      },
      { status: 500 }
    );
  }
} 
import { NextResponse } from 'next/server';
import { decryptCredential } from '@/lib/kms';
import { createServerClient, CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

interface MCPRequest {
  service: string;
  path: string;
  method: string;
  headers?: Record<string, string>;
  body?: Record<string, unknown>;
  apiKeyId: string;
}

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

    // Authenticate user
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication failed' },
        { status: 401 }
      );
    }

    // Parse request body
    const body: MCPRequest = await request.json();
    const { service, path, method, headers = {}, body: requestBody, apiKeyId } = body;

    // Validate required fields
    if (!service || !path || !method || !apiKeyId) {
      return NextResponse.json(
        { error: 'Missing required fields: service, path, method, and apiKeyId are required' },
        { status: 400 }
      );
    }

    // Get API key and service details
    const { data: apiKey, error: apiKeyError } = await supabase
      .from('_api_keys')
      .select('encrypted_key, service')
      .eq('id', apiKeyId)
      .eq('user_id', user.id)
      .single();

    if (apiKeyError || !apiKey) {
      return NextResponse.json(
        { error: 'API key not found or access denied' },
        { status: 404 }
      );
    }

    if (apiKey.service !== service) {
      return NextResponse.json(
        { error: 'API key does not match requested service' },
        { status: 400 }
      );
    }

    // Get service configuration
    const { data: serviceConfig, error: serviceError } = await supabase
      .from('_services')
      .select('base_url, auth_header')
      .eq('name', service)
      .single();

    if (serviceError || !serviceConfig) {
      return NextResponse.json(
        { error: 'Service configuration not found' },
        { status: 404 }
      );
    }

    // Decrypt the API key
    const decryptedKey = await decryptCredential(apiKey.encrypted_key);

    // Prepare the request to the target service
    const targetUrl = new URL(path, serviceConfig.base_url).toString();
    const requestHeaders: Record<string, string> = {
      ...headers,
      [serviceConfig.auth_header || 'Authorization']: `Bearer ${decryptedKey}`,
    };

    if (requestBody) {
      requestHeaders['Content-Type'] = 'application/json';
    }

    const requestInit: RequestInit = {
      method,
      headers: requestHeaders,
    };

    if (requestBody) {
      requestInit.body = JSON.stringify(requestBody);
    }

    // Start timing the request
    const startTime = Date.now();

    // Make the request to the target service
    const serviceResponse = await fetch(targetUrl, requestInit);
    const responseData = await serviceResponse.json();

    // Calculate request duration
    const duration = Date.now() - startTime;

    // Log API usage
    await supabase.from('_api_usage').insert({
      user_id: user.id,
      api_key_id: apiKeyId,
      service,
      path,
      method,
      status_code: serviceResponse.status,
      duration,
      request_headers: headers,
      response_headers: Object.fromEntries(serviceResponse.headers.entries()),
    });

    // Return the response
    return NextResponse.json({
      status: serviceResponse.status,
      headers: Object.fromEntries(serviceResponse.headers.entries()),
      data: responseData,
    }, {
      status: serviceResponse.status,
    });

  } catch (error: unknown) {
    console.error('MCP Error:', error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { 
          error: 'MCP request failed',
          details: error.message,
        },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: 'An unknown error occurred' },
      { status: 500 }
    );
  }
} 
import { NextResponse } from 'next/server';
import { createServerClient, CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
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

    // Get available services
    const { data: services, error: servicesError } = await supabase
      .from('_services')
      .select('name, description, base_url, auth_header, config');

    if (servicesError) {
      return NextResponse.json(
        { error: 'Failed to fetch services' },
        { status: 500 }
      );
    }

    // Format services according to MCP specification
    const formattedServices = services?.map(service => ({
      id: service.name,
      name: service.name,
      description: service.description,
      version: '1.0',
      capabilities: {
        authentication: {
          type: 'bearer',
          header: service.auth_header || 'Authorization'
        },
        endpoints: [
          {
            path: '/*',
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
            baseUrl: service.base_url
          }
        ],
        config: service.config || {}
      }
    })) || [];

    // Return MCP-compliant response
    return NextResponse.json({
      version: '1.0',
      server: {
        name: 'MCPflow',
        version: '1.0.0',
        capabilities: {
          transports: ['http'],
          features: ['key-management', 'usage-tracking']
        }
      },
      services: formattedServices
    });

  } catch (error: unknown) {
    console.error('Service discovery error:', error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { 
          error: 'Service discovery failed',
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
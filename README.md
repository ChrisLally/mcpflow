# MCPflow

MCPflow is your gateway to the Model Context Protocol (MCP) ecosystem. It lets you easily connect your AI applications to any MCP service - whether it's GitHub, Spotify, or your own custom services - without the complexity of setting up and managing individual MCP servers.

## Quick Start for Users

0. **Get Your User Token**
   - Visit https://mcpflow.vercel.app
   - Click "Sign In" and create an account
   - Go to "Account Settings" to get your access token
   - Save this token as `your-user-token`

1. **View Available Services**
```bash
# List all available MCP services
curl -X GET https://mcpflow.vercel.app/api/mcp/services \
  -H "Authorization: Bearer your-user-token"
```

2. **Add Your API Keys**
   - Visit https://mcpflow.vercel.app/dashboard
   - Click "Add New API Key"
   - Select a service (e.g., GitHub)
   - Paste your API key
   - Save the generated `apiKeyId` for later use

3. **Use Any Service**
```typescript
// Example: Using GitHub through MCPflow
const response = await fetch('https://mcpflow.vercel.app/api/mcp', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer your-user-token',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    service: 'github',        // Service name from step 1
    apiKeyId: 'your-key-id', // From step 2
    path: '/user',           // API endpoint you want to call
    method: 'GET'
  })
});
```

That's it! MCPflow handles the rest. Need more details? Read on.

## What is MCP?

The Model Context Protocol (MCP) is an open protocol that standardizes how applications provide context to LLMs. Think of MCP like a USB-C port for AI applications - it provides a standardized way to connect AI models to different data sources and tools.

## Why MCPflow?

MCPflow simplifies connecting to MCP services:

- 🔗 Connect to any MCP service through a single endpoint
- 🔐 Securely store and manage API keys for all your services
- 🎯 No need to set up individual MCP servers for each service
- 📊 Track usage across all your MCP integrations
- 👥 Share access to services with your team
- 🚀 Get started in minutes, not hours

## Architecture

MCPflow acts as your central hub for MCP services:

```
┌─────────────┐     ┌──────────────┐     ┌─────────────────┐
│ MCP Clients │     │   MCPflow    │     │  MCP Services   │
│   Claude    │ ──► │ Integration  │ ──► │  • GitHub MCP   │
│   IDEs     │     │     Hub      │     │  • Spotify MCP  │
└─────────────┘     └──────────────┘     │  • Custom MCPs │
                         │               └─────────────────┘
                    ┌────┴────┐
                    │ Secure  │
                    │Key Vault│
                    └─────────┘
```

## Prerequisites

Before you begin, ensure you have:

1. Node.js 18+ installed
2. A Supabase account and project
3. A Google Cloud project with KMS enabled
4. Google Cloud service account with KMS permissions

## Environment Setup

Create a `.env.local` file with the following variables:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL="your-supabase-project-url"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-supabase-anon-key"

# Google Cloud KMS Configuration
GOOGLE_CLOUD_PROJECT_ID="your-project-id"
GOOGLE_CLOUD_KMS_KEY="projects/your-project/locations/your-location/keyRings/your-keyring/cryptoKeys/your-key"

# Option 1: Use service account key file
GOOGLE_APPLICATION_CREDENTIALS="/path/to/your/service-account-key.json"

# Option 2: Use inline credentials
GOOGLE_CREDENTIALS='{"type":"service_account","project_id":"...","private_key":"...","client_email":"...",...}'
```

## Getting Started

1. Install dependencies:
```bash
npm install
# or
yarn
# or
pnpm install
```

2. Initialize the database:
   - Run the SQL migrations in `components/providers/supabase.sql`
   - This will set up tables for:
     - `_api_keys`: Encrypted API key storage
     - `_services`: Available API services
     - `_api_usage`: Request tracking

3. Run the development server:
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

4. Open [http://localhost:3000](http://localhost:3000) with your browser

## Using with MCP Clients

MCPflow makes it easy to use any MCP service. Here's how:

1. Configure your MCP client to use MCPflow as your integration hub:
```json
{
  "mcpServers": {
    "mcpflow": {
      "url": "http://localhost:3000/api/mcp",
      "auth": {
        "type": "bearer",
        "token": "your-user-token"
      }
    }
  }
}
```

2. Start using any supported MCP service right away:

```typescript
// Use GitHub MCP
const githubResponse = await mcpClient.execute('mcpflow', {
  service: 'github',
  apiKeyId: 'your-github-key-id',
  path: '/repos/owner/repo/issues',
  method: 'POST',
  body: {
    title: 'New Issue',
    body: 'Issue description'
  }
});

// Use Spotify MCP
const spotifyResponse = await mcpClient.execute('mcpflow', {
  service: 'spotify',
  apiKeyId: 'your-spotify-key-id',
  path: '/v1/me/player/play',
  method: 'PUT'
});
```

No additional setup required - MCPflow handles the connection to each service!

## Testing MCPflow

### 1. Local Testing with MCP Inspector

Install the MCP Inspector:
```bash
npm install -g @modelcontextprotocol/inspector
```

Test your MCPflow server:
```bash
mcp-inspector http://localhost:3000/api/mcp
```

### 2. Testing with Claude Desktop

1. Add MCPflow to Claude Desktop's configuration:
```json
{
  "mcpServers": {
    "mcpflow": {
      "url": "http://localhost:3000/api/mcp",
      "auth": {
        "type": "bearer",
        "token": "your-user-token"
      }
    }
  }
}
```

2. Test available services:
```bash
curl -X GET http://localhost:3000/api/mcp/services \
  -H "Authorization: Bearer your-user-token"
```

### 3. Manual API Testing

Test the encryption endpoint:
```bash
curl -X POST http://localhost:3000/api/test-kms \
  -H "Authorization: Bearer your-user-token" \
  -H "Content-Type: application/json" \
  -d '{"testKey": "your-test-key"}'
```

Test the MCP endpoint:
```bash
curl -X POST http://localhost:3000/api/mcp \
  -H "Authorization: Bearer your-user-token" \
  -H "Content-Type: application/json" \
  -d '{
    "service": "openai",
    "apiKeyId": "your-api-key-id",
    "path": "/v1/chat/completions",
    "method": "POST",
    "body": {
      "model": "gpt-4",
      "messages": [{"role": "user", "content": "Hello!"}]
    }
  }'
```

## Current MCP Service Support

MCPflow currently supports these MCP services:

✅ GitHub MCP - Full GitHub API access
✅ Custom MCP Services - Connect to your own MCP servers

Coming soon:
🔜 Spotify MCP
🔜 OpenAI MCP
🔜 Anthropic MCP
🔜 More services based on community demand

Want to add support for a new service? Open an issue or contribute!

## Security Features

- API keys are encrypted at rest using Google Cloud KMS
- Row Level Security ensures users can only access their own keys
- Supabase authentication for user management
- MCP protocol compliance for standardized access

## Learn More

- [MCP Documentation](https://modelcontextprotocol.io)
- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Google Cloud KMS Documentation](https://cloud.google.com/kms/docs)

## Deploy on Vercel

The easiest way to deploy MCPflow is to use the [Vercel Platform](https://vercel.com/new).

Make sure to configure the following environment variables in your Vercel project:
- All variables from `.env.local`
- Additional production-specific configurations

## Contributing

MCPflow is an open-source implementation of the MCP server specification. Contributions are welcome! Please feel free to submit a Pull Request.

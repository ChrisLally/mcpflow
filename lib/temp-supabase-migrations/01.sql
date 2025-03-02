-- Create _services table if it doesn't exist
CREATE TABLE IF NOT EXISTS public._services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    base_url TEXT NOT NULL,
    auth_header TEXT DEFAULT 'Authorization',
    config JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    is_active BOOLEAN DEFAULT true NOT NULL
);

-- Create _api_usage table for the Usage & Monitoring page
CREATE TABLE IF NOT EXISTS public._api_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    server_id UUID REFERENCES public._server_configs(id) ON DELETE CASCADE,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT now(),
    endpoint TEXT NOT NULL,
    method TEXT NOT NULL,
    status INTEGER NOT NULL,
    response_time INTEGER NOT NULL, -- in milliseconds
    request_body JSONB,
    response_body JSONB
);

-- Insert demo services
INSERT INTO public._services (name, description, base_url, auth_header, config, user_id, is_active)
VALUES 
    ('github', 'GitHub API Service', 'https://api.github.com', 'Authorization', 
    '{
        "version": "2022-11-28",
        "accept_header": "application/vnd.github+json",
        "rate_limit": {
            "requests_per_hour": 5000,
            "graphql_requests_per_hour": 5000
        },
        "endpoints": {
            "repos": "/repos/{owner}/{repo}",
            "user": "/users/{username}",
            "search": "/search/repositories"
        }
    }'::jsonb, NULL, true),
    
    ('openai', 'OpenAI API Service', 'https://api.openai.com/v1', 'Authorization', 
    '{
        "models": {
            "gpt-4": {
                "context_window": 8192,
                "training_data": "Up to Apr 2023"
            },
            "gpt-3.5-turbo": {
                "context_window": 4096,
                "training_data": "Up to Sep 2021"
            }
        },
        "endpoints": {
            "chat": "/chat/completions",
            "embeddings": "/embeddings",
            "images": "/images/generations"
        }
    }'::jsonb, NULL, true),
    
    ('anthropic', 'Anthropic Claude API', 'https://api.anthropic.com/v1', 'x-api-key', 
    '{
        "models": {
            "claude-3-opus": {
                "context_window": 200000,
                "training_data": "Up to Aug 2023"
            },
            "claude-3-sonnet": {
                "context_window": 180000,
                "training_data": "Up to Aug 2023"
            },
            "claude-3-haiku": {
                "context_window": 150000,
                "training_data": "Up to Aug 2023"
            }
        },
        "endpoints": {
            "messages": "/messages"
        },
        "version": "2023-06-01"
    }'::jsonb, NULL, true);

-- Insert sample API usage data for the Usage & Monitoring page
INSERT INTO public._api_usage (server_id, endpoint, method, status, response_time)
SELECT 
    id as server_id,
    '/api/v1/chat' as endpoint,
    'POST' as method,
    200 as status,
    floor(random() * 500 + 100)::integer as response_time
FROM 
    public._server_configs
LIMIT 5;

INSERT INTO public._api_usage (server_id, endpoint, method, status, response_time)
SELECT 
    id as server_id,
    '/api/v1/embeddings' as endpoint,
    'POST' as method,
    200 as status,
    floor(random() * 200 + 50)::integer as response_time
FROM 
    public._server_configs
LIMIT 3;

INSERT INTO public._api_usage (server_id, endpoint, method, status, response_time)
SELECT 
    id as server_id,
    '/api/v1/images' as endpoint,
    'POST' as method,
    429 as status,
    floor(random() * 100 + 300)::integer as response_time
FROM 
    public._server_configs
LIMIT 2;

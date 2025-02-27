-- Add new fields to services table for MCP server configuration
alter table _services
  add column if not exists repo_url text,
  add column if not exists repo_branch text default 'main',
  add column if not exists server_type text default 'standard',
  add column if not exists server_config jsonb default '{}'::jsonb;

-- Create table for custom server configurations
create table if not exists _server_configs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  description text,
  repo_url text not null,
  repo_branch text default 'main',
  config jsonb default '{}'::jsonb,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null,
  is_active boolean default true not null,
  is_public boolean default false not null,
  constraint _server_configs_name_key unique (name)
);

-- Enable RLS on server_configs
alter table _server_configs enable row level security;

-- RLS policies for server_configs
create policy "Users can view their own and public server configs"
  on _server_configs for select
  using (auth.uid() = user_id or is_public = true);

create policy "Users can insert their own server configs"
  on _server_configs for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own server configs"
  on _server_configs for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own server configs"
  on _server_configs for delete
  using (auth.uid() = user_id);

-- Add function to import server from GitHub
create or replace function import_mcp_server(
  p_user_id uuid,
  p_repo_url text,
  p_name text,
  p_description text default null,
  p_config jsonb default '{}'::jsonb
) returns uuid as $$
declare
  v_server_id uuid;
begin
  -- Insert into server_configs
  insert into _server_configs (
    user_id,
    name,
    description,
    repo_url,
    config
  ) values (
    p_user_id,
    p_name,
    p_description,
    p_repo_url,
    p_config
  ) returning id into v_server_id;

  -- Create service entry
  insert into _services (
    user_id,
    name,
    service_url,
    description,
    config,
    repo_url,
    server_type
  ) values (
    p_user_id,
    p_name,
    'dynamic', -- Will be set by the server on startup
    p_description,
    jsonb_build_object(
      'version', '1.0',
      'authentication', jsonb_build_object(
        'type', 'bearer',
        'header', 'Authorization'
      ),
      'endpoints', '[]'::jsonb,
      'capabilities', jsonb_build_object(
        'streaming', false,
        'batch', false
      )
    ),
    p_repo_url,
    'custom'
  );

  return v_server_id;
end;
$$ language plpgsql;

-- Add view for available MCP servers
create or replace view available_mcp_servers as
select
  s.id,
  s.name,
  s.description,
  s.repo_url,
  s.repo_branch,
  s.config,
  s.is_public,
  s.created_at,
  s.updated_at,
  exists(
    select 1
    from _services svc
    where svc.name = s.name
      and svc.user_id = s.user_id
  ) as is_configured
from _server_configs s
where s.is_active = true
  and (s.is_public = true or s.user_id = auth.uid());

-- Grant access to the view
grant select on available_mcp_servers to authenticated;

-- Function to insert system MCP servers
create or replace function insert_system_mcp_servers()
returns void as $$
declare
  v_system_user_id uuid;
begin
  -- Use the existing admin user ID
  v_system_user_id := 'af6e2689-93ab-458e-b56b-26f2675ca8cd'::uuid;
  
  -- Insert example MCP servers
  insert into _server_configs (
    user_id,
    name,
    description,
    repo_url,
    config,
    is_public
  ) values 
    (
      v_system_user_id,
      'github-mcp',
      'Official GitHub MCP Server',
      'https://github.com/modelcontextprotocol/server-github',
      jsonb_build_object(
        'required_env', array['GITHUB_TOKEN'],
        'default_scopes', array['repo', 'user']
      ),
      true
    ),
    (
      v_system_user_id,
      'filesystem-mcp',
      'Official Filesystem MCP Server',
      'https://github.com/modelcontextprotocol/server-filesystem',
      jsonb_build_object(
        'required_env', array['ALLOWED_PATHS']
      ),
      true
    ),
    (
      v_system_user_id,
      'memory-mcp',
      'Official Memory MCP Server',
      'https://github.com/modelcontextprotocol/server-memory',
      jsonb_build_object(
        'required_env', array[]::text[]
      ),
      true
    )
  on conflict (name) do nothing;
end;
$$ language plpgsql;

-- Execute the function to insert system MCP servers
select insert_system_mcp_servers(); 
-- Add MCP-specific fields to services table
alter table _services
  add column if not exists mcp_version text default '1.0',
  add column if not exists mcp_capabilities jsonb default '{
    "transports": ["http"],
    "features": ["key-management", "usage-tracking"]
  }'::jsonb;

-- Update existing services with MCP configurations
update _services
set config = jsonb_build_object(
  'version', coalesce(config->>'version', '1.0'),
  'authentication', jsonb_build_object(
    'type', 'bearer',
    'header', 'Authorization'
  ),
  'endpoints', coalesce(config->'endpoints', '[]'::jsonb),
  'capabilities', coalesce(config->'capabilities', '{}'::jsonb)
)
where user_id is null;

-- Update GitHub service with proper MCP configuration
update _services
set config = jsonb_build_object(
  'version', '1.0',
  'authentication', jsonb_build_object(
    'type', 'bearer',
    'header', 'Authorization'
  ),
  'endpoints', jsonb_build_array(
    jsonb_build_object(
      'path', '/repos/{owner}/{repo}/*',
      'methods', array['GET', 'POST', 'PATCH', 'DELETE'],
      'description', 'Repository operations'
    ),
    jsonb_build_object(
      'path', '/user',
      'methods', array['GET'],
      'description', 'Get authenticated user'
    )
  ),
  'capabilities', jsonb_build_object(
    'streaming', false,
    'batch', false
  )
)
where name = 'github';

-- Add function to validate service configuration
create or replace function validate_service_config()
returns trigger as $$
begin
  -- Ensure config has required fields
  if not (
    new.config ? 'version' and
    new.config ? 'authentication' and
    new.config ? 'endpoints'
  ) then
    raise exception 'Service configuration must include version, authentication, and endpoints';
  end if;

  -- Ensure authentication has required fields
  if not (
    new.config->'authentication' ? 'type' and
    new.config->'authentication' ? 'header'
  ) then
    raise exception 'Service authentication must include type and header';
  end if;

  return new;
end;
$$ language plpgsql;

-- Add trigger for service configuration validation
create trigger validate_service_config_trigger
  before insert or update on _services
  for each row
  execute function validate_service_config();

-- Add view for MCP service discovery
create or replace view mcp_services as
select
  name as id,
  name,
  description,
  mcp_version as version,
  service_url as base_url,
  config->>'version' as api_version,
  config->'authentication' as authentication,
  config->'endpoints' as endpoints,
  config->'capabilities' as capabilities,
  mcp_capabilities as server_capabilities,
  is_active
from _services
where user_id is null
  and is_active = true;

-- Grant access to the view
grant select on mcp_services to authenticated;

-- Add function to list available services for a user
create or replace function get_available_services(p_user_id uuid)
returns table (
  id text,
  name text,
  description text,
  version text,
  base_url text,
  authentication jsonb,
  endpoints jsonb,
  capabilities jsonb,
  has_api_key boolean
) as $$
begin
  return query
  select
    s.name as id,
    s.name,
    s.description,
    s.mcp_version as version,
    s.service_url as base_url,
    s.config->'authentication' as authentication,
    s.config->'endpoints' as endpoints,
    s.config->'capabilities' as capabilities,
    exists(
      select 1
      from _api_keys ak
      where ak.service = s.name
        and ak.user_id = p_user_id
        and ak.is_active = true
    ) as has_api_key
  from _services s
  where s.user_id is null
    and s.is_active = true;
end;
$$ language plpgsql;

-- Grant execute permission on the function
grant execute on function get_available_services to authenticated; 
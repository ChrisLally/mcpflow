-- Drop existing policies to recreate them with updated conditions
drop policy if exists "Users can view their own API keys" on _api_keys;
drop policy if exists "Users can insert their own API keys" on _api_keys;
drop policy if exists "Users can update their own API keys" on _api_keys;
drop policy if exists "Users can delete their own API keys" on _api_keys;

-- Drop existing service policies to recreate them
drop policy if exists "Users can view their own services" on _services;
drop policy if exists "Users can insert their own services" on _services;
drop policy if exists "Users can update their own services" on _services;
drop policy if exists "Users can delete their own services" on _services;

-- Make user_id nullable for system services
alter table _services alter column user_id drop not null;

-- Add unique constraint on service name
alter table _services
  add constraint services_name_unique unique (name);

-- Update the services table to ensure name is lowercase
create or replace function normalize_service_name()
returns trigger as $$
begin
  new.name = lower(new.name);
  return new;
end;
$$ language plpgsql;

create trigger normalize_service_name_trigger
  before insert or update on _services
  for each row
  execute function normalize_service_name();

-- Insert default services (as system services with null user_id)
insert into _services (name, service_url, description, config, user_id)
values 
  ('github', 'https://api.github.com', 'GitHub API for repository management and code operations', 
   '{"required_scopes": ["repo", "user"], "api_version": "2022-11-28"}'::jsonb,
   null),
  ('openai', 'https://api.openai.com/v1', 'OpenAI API for AI models including GPT-4 and DALL-E',
   '{"models": ["gpt-4", "gpt-3.5-turbo", "dall-e-3"]}'::jsonb,
   null),
  ('anthropic', 'https://api.anthropic.com', 'Anthropic API for Claude and other AI models',
   '{"models": ["claude-3-opus", "claude-3-sonnet", "claude-2.1"]}'::jsonb,
   null),
  ('brave', 'https://api.search.brave.com', 'Brave Search API for web, news, and image search',
   '{"endpoints": ["search", "spellcheck", "suggest"]}'::jsonb,
   null)
on conflict (name) do update set
  service_url = excluded.service_url,
  description = excluded.description,
  config = excluded.config;

-- Add service name to api_keys foreign key (after services are inserted)
alter table _api_keys drop constraint if exists api_keys_service_fkey;
alter table _api_keys
  add constraint api_keys_service_fkey
  foreign key (service)
  references _services(name)
  on delete cascade;

-- Add indexes for service lookups
create index if not exists idx_services_name on _services(name);

-- Recreate API keys policies with more permissive select for services
create policy "Users can view their own API keys"
  on _api_keys for select
  using (auth.uid() = user_id);

create policy "Users can insert their own API keys"
  on _api_keys for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own API keys"
  on _api_keys for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own API keys"
  on _api_keys for delete
  using (auth.uid() = user_id);

-- Add more permissive service policies to allow viewing all services
create policy "Users can view all services"
  on _services for select
  using (true);

create policy "Users can insert their own services"
  on _services for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own services"
  on _services for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own services"
  on _services for delete
  using (auth.uid() = user_id); 
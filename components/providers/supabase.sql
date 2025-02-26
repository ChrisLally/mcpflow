-- Enable pgcrypto for UUID generation
create extension if not exists "pgcrypto";

-- API Keys table
create table _api_keys (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  encrypted_key text not null,
  service text not null,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null,
  last_used_at timestamp with time zone,
  is_active boolean default true not null
);

-- Enable RLS on api_keys
alter table _api_keys enable row level security;

-- RLS policies for api_keys
create policy "Users can view their own API keys"
  on _api_keys for select
  using (auth.uid() = user_id);

create policy "Users can insert their own API keys"
  on _api_keys for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own API keys"
  on _api_keys for update
  using (auth.uid() = user_id);

create policy "Users can delete their own API keys"
  on _api_keys for delete
  using (auth.uid() = user_id);

-- Services table (for tracking which external services are configured)
create table _services (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  service_url text not null,
  description text,
  config jsonb default '{}'::jsonb not null,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null,
  is_active boolean default true not null
);

-- Enable RLS on services
alter table _services enable row level security;

-- RLS policies for services
create policy "Users can view their own services"
  on _services for select
  using (auth.uid() = user_id);

create policy "Users can insert their own services"
  on _services for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own services"
  on _services for update
  using (auth.uid() = user_id);

create policy "Users can delete their own services"
  on _services for delete
  using (auth.uid() = user_id);

-- API Usage tracking table
create table _api_usage (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  api_key_id uuid references _api_keys(id) on delete set null,
  service_id uuid references _services(id) on delete set null,
  request_path text not null,
  request_method text not null,
  response_status integer not null,
  duration_ms integer not null,
  created_at timestamp with time zone default now() not null,
  request_headers jsonb default '{}'::jsonb not null,
  response_headers jsonb default '{}'::jsonb not null,
  error_message text
);

-- Enable RLS on api_usage
alter table _api_usage enable row level security;

-- RLS policies for api_usage
create policy "Users can view their own API usage"
  on _api_usage for select
  using (auth.uid() = user_id);

create policy "Users can insert their own API usage"
  on _api_usage for insert
  with check (auth.uid() = user_id);

-- Create indexes for better query performance
create index idx_api_keys_user_id on _api_keys(user_id);
create index idx_api_keys_service on _api_keys(service);
create index idx_services_user_id on _services(user_id);
create index idx_api_usage_user_id on _api_usage(user_id);
create index idx_api_usage_created_at on _api_usage(created_at);
create index idx_api_usage_api_key_id on _api_usage(api_key_id);
create index idx_api_usage_service_id on _api_usage(service_id);

-- Function to update updated_at timestamp
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Add triggers for updated_at
create trigger update_api_keys_updated_at
  before update on _api_keys
  for each row
  execute function update_updated_at_column();

create trigger update_services_updated_at
  before update on _services
  for each row
  execute function update_updated_at_column();

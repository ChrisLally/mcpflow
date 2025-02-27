-- Drop the existing function first
DROP FUNCTION IF EXISTS insert_test_data(uuid);

-- Function to insert test data for a specific user
create or replace function insert_test_data(p_user_id uuid)
returns void as $$
begin
  -- Insert common services
  INSERT INTO _services (user_id, name, service_url, description, config) VALUES
    -- OpenAI
    (p_user_id, 'OpenAI API', 'https://api.openai.com/v1', 'OpenAI API for GPT models and more', jsonb_build_object(
      'version', 'v1',
      'authentication', jsonb_build_object(
        'type', 'bearer',
        'header', 'Authorization'
      ),
      'models', array['gpt-4', 'gpt-3.5-turbo', 'dall-e-3'],
      'endpoints', array['/chat/completions', '/images/generations']
    )),
    -- GitHub
    (p_user_id, 'GitHub API', 'https://api.github.com', 'GitHub REST API for repository management', jsonb_build_object(
      'version', 'v3',
      'authentication', jsonb_build_object(
        'type', 'bearer',
        'header', 'Authorization'
      ),
      'endpoints', array['/repos', '/users', '/search/code']
    )),
    -- Anthropic
    (p_user_id, 'Anthropic API', 'https://api.anthropic.com', 'Anthropic API for Claude models', jsonb_build_object(
      'version', 'v1',
      'authentication', jsonb_build_object(
        'type', 'bearer',
        'header', 'x-api-key'
      ),
      'models', array['claude-3-opus', 'claude-3-sonnet'],
      'endpoints', array['/v1/messages']
    ));

  -- Insert example API keys
  INSERT INTO _api_keys (user_id, name, encrypted_key, service) VALUES
    -- OpenAI example key
    (p_user_id, 'OpenAI Development', 'encrypted_dummy_key_openai_1', 'openai'),
    -- GitHub example key
    (p_user_id, 'GitHub Personal', 'encrypted_dummy_key_github_1', 'github'),
    -- Anthropic example key
    (p_user_id, 'Anthropic Production', 'encrypted_dummy_key_anthropic_1', 'anthropic');

  -- Insert example usage data
  INSERT INTO _api_usage (
    user_id,
    api_key_id,
    service_id,
    request_path,
    request_method,
    response_status,
    duration_ms,
    request_headers,
    response_headers
  ) 
  SELECT 
    p_user_id,
    ak.id,
    s.id,
    CASE ak.service
      WHEN 'openai' THEN '/v1/chat/completions'
      WHEN 'github' THEN '/repos/owner/repo'
      WHEN 'anthropic' THEN '/v1/messages'
      ELSE '/default/endpoint'  -- Fallback to prevent NULL
    END as request_path,
    'POST',
    200,
    floor(random() * 1000 + 100)::integer,
    jsonb_build_object('Authorization', 'Bearer ...', 'Content-Type', 'application/json'),
    jsonb_build_object('x-request-id', gen_random_uuid()::text)
  FROM _api_keys ak
  JOIN _services s ON LOWER(split_part(s.name, ' ', 1)) = ak.service
  WHERE ak.user_id = p_user_id
    AND s.user_id = p_user_id;
end;
$$ language plpgsql;

-- To use this function, you'll need to call it with a user ID, like:
select insert_test_data('af6e2689-93ab-458e-b56b-26f2675ca8cd');

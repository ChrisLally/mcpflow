Given your setup with Supabase (tables _api_keys, _api_usage, _server_configs), Google KMS for encryption, and your own apps for authenticating with external services, I’ll tailor the dashboard sitemap to integrate these specifics. Your _api_keys table (encrypted via Google KMS) will store sensitive authentication data, _api_usage will track API call metrics, and _server_configs will hold MCP server configurations. Since you’re handling authentication via separate apps, the dashboard will focus on managing keys, configs, and hosting while leveraging your external auth flows. Below is the revised sitemap with high-level descriptions, reflecting your tech stack.

Sitemap for Hosted MCP Server Dashboard (Supabase + Google KMS)
1. Home
Purpose: Overview of the service and user-specific insights.
Features:
Welcome message with a brief pitch (e.g., "Host MCP servers with ease").
Quick stats pulled from Supabase:
Active servers (count from _server_configs where status = 'active').
Total API usage (sum from _api_usage).
Recent activity (e.g., latest entry in _server_configs or _api_usage).
Quick actions: "Add New Server," "View Usage," "Browse Configs."
Why: Central starting point with real-time data from your Supabase tables.
2. Browse MCP Servers
Purpose: Explore and adopt MCP server configurations.
Features:
Public catalog of MCP configs (stored in a read-only Supabase table or fetched from an external source).
Filters: Category (e.g., GitHub, Slack), popularity (e.g., usage count), last updated.
Config details: Description, dependencies, and preview (e.g., JSON from _server_configs schema).
"Add to My Servers": Copies config to _server_configs with user ID and default settings.
Why: Simplifies onboarding by letting users import configs into their _server_configs table.
3. My Servers
Purpose: Manage hosted MCP servers linked to _server_configs.
Features:
List of servers from _server_configs: Name, hosted URL, status (e.g., Running, Stopped), config summary.
Actions:
Start/Stop: Updates status in _server_configs.
Edit Config: Modify JSON in _server_configs (stored as a JSONB column, for example).
Delete: Removes row from _server_configs.
View Usage: Links to _api_usage data for that server.
"Add New Server": Form or JSON editor to insert a new row into _server_configs.
Why: Core management hub, directly tied to your Supabase table for server configs.
4. API Keys
Purpose: Manage encrypted API keys stored in _api_keys.
Features:
List of keys from _api_keys: Service name (e.g., GitHub, Slack), key ID, status (e.g., Active, Expired), last used (joined with _api_usage).
"Add Key":
Input: Service name, API key/token.
Encrypts key using Google KMS and stores in _api_keys (e.g., as an encrypted bytea column).
Actions: Revoke (delete from _api_keys), Assign to Server (links key ID to _server_configs row).
Security: Decryption only occurs server-side when needed; dashboard shows masked values.
Why: Securely manages keys for external services, leveraging your Google KMS setup.
5. Hosting Management
Purpose: Configure hosting settings for MCP servers.
Features:
Resource overview: CPU/memory/storage usage (could be tracked in _server_configs or a separate table).
Scaling: Adjust resources per server (updates _server_configs or hosting backend).
Domain settings: Assign custom domains (stored in _server_configs as a field).
Hosting logs: Server start/stop events (could be a Supabase table like _server_logs).
Why: Ties hosting to your server configs, ensuring users can tweak performance.
6. Usage & Monitoring
Purpose: Track server activity and API usage via _api_usage.
Features:
Real-time logs: API calls, errors, and responses (from _api_usage).
Filters: By server (joined with _server_configs), time range, or event type.
Analytics: Total calls, average response time, error rate (aggregated from _api_usage).
Export: Download _api_usage data as CSV.
Why: Provides actionable insights into server performance, directly leveraging your usage table.
7. Settings
Purpose: Account and service-wide preferences.
Features:
Account: Email, subscription tier (stored in Supabase users or similar table).
Service API keys: Generate keys for programmatic access (stored in _api_keys with a special type).
Notifications: Email/SMS alerts for server downtime or key expiration.
Preferences: Dashboard settings (e.g., theme).
Why: Rounds out the user experience with administrative controls.
High-Level Overview with Your Stack
Supabase Integration:
_api_keys: Encrypted storage for API keys (using Google KMS), linked to servers via a foreign key in _server_configs.
_api_usage: Tracks every API call (e.g., columns: server_id, timestamp, endpoint, status), feeding usage stats and logs.
_server_configs: Stores MCP server details (e.g., id, user_id, config_json, status, hosted_url), driving the "My Servers" tab.
Google KMS: Encrypts/decrypts _api_keys data server-side, ensuring security without exposing keys in the dashboard.
External Auth Apps: Since you handle authentication elsewhere, the dashboard focuses on key management and server assignment rather than OAuth flows.
Key Assumptions
_server_configs uses a JSONB column for MCP configs, allowing flexible storage and querying.
_api_usage logs enough data (e.g., server ID, timestamp, response code) to support monitoring and analytics.
Your hosting backend (not detailed here) syncs with _server_configs to deploy servers.
This setup keeps your dashboard lean and focused: users browse configs, manage servers in _server_configs, handle encrypted keys in _api_keys, and monitor usage via _api_usage. Let me know if you want deeper details—like SQL schemas for the tables or a specific workflow (e.g., adding a key and linking it to a server)!
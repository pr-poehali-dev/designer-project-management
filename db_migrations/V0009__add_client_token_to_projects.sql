ALTER TABLE projects ADD COLUMN IF NOT EXISTS client_token VARCHAR(64) NOT NULL DEFAULT '';

CREATE UNIQUE INDEX IF NOT EXISTS projects_client_token_idx ON projects(client_token) WHERE client_token != '';

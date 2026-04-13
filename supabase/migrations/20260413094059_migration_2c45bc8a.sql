-- Crear tabla para guardar tokens de GitHub por usuario
CREATE TABLE IF NOT EXISTS github_connections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  github_username TEXT NOT NULL,
  github_access_token TEXT NOT NULL, -- Encriptado en producción
  github_refresh_token TEXT,
  token_expires_at TIMESTAMP WITH TIME ZONE,
  connected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_synced_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- RLS para github_connections
ALTER TABLE github_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_manage_own_github" ON github_connections
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Crear tabla para logs de deployments
CREATE TABLE IF NOT EXISTS deployment_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  deployment_id TEXT, -- ID de Vercel
  status TEXT NOT NULL CHECK (status IN ('queued', 'building', 'ready', 'error', 'canceled')),
  build_log TEXT,
  error_message TEXT,
  deployment_url TEXT,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS para deployment_logs
ALTER TABLE deployment_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_view_own_deployments" ON deployment_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = deployment_logs.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "system_insert_deployments" ON deployment_logs
  FOR INSERT
  WITH CHECK (true);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_deployment_logs_project ON deployment_logs(project_id);
CREATE INDEX IF NOT EXISTS idx_deployment_logs_status ON deployment_logs(status);
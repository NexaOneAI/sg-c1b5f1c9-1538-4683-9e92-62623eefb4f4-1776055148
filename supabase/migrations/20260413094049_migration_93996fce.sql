-- Agregar columnas para GitHub y subdominios personalizados a la tabla projects
ALTER TABLE projects
ADD COLUMN IF NOT EXISTS github_repo_url TEXT,
ADD COLUMN IF NOT EXISTS github_branch TEXT DEFAULT 'main',
ADD COLUMN IF NOT EXISTS github_connected_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS custom_subdomain TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS deployment_url TEXT,
ADD COLUMN IF NOT EXISTS deployment_status TEXT DEFAULT 'pending' CHECK (deployment_status IN ('pending', 'building', 'ready', 'failed')),
ADD COLUMN IF NOT EXISTS last_deployed_at TIMESTAMP WITH TIME ZONE;

-- Crear índice para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_projects_custom_subdomain ON projects(custom_subdomain);
CREATE INDEX IF NOT EXISTS idx_projects_github_repo ON projects(github_repo_url);

-- Comentarios descriptivos
COMMENT ON COLUMN projects.github_repo_url IS 'URL completa del repositorio GitHub conectado';
COMMENT ON COLUMN projects.custom_subdomain IS 'Subdominio personalizado (ej: nexasaaspos para nexasaaspos.nexaoneia.com)';
COMMENT ON COLUMN projects.deployment_url IS 'URL final del deployment en Vercel';
COMMENT ON COLUMN projects.deployment_status IS 'Estado del último deployment';
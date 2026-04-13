import { supabase } from "@/integrations/supabase/client";

/**
 * Servicio de deployment a Vercel con subdominios personalizados
 */

export interface DeploymentConfig {
  projectId: string;
  subdomain: string;
  githubRepoUrl?: string;
  envVars?: Record<string, string>;
}

/**
 * Configurar subdominio personalizado para un proyecto
 */
export async function setCustomSubdomain(projectId: string, subdomain: string) {
  // Validar formato de subdominio (solo letras, números y guiones)
  const subdomainRegex = /^[a-z0-9-]+$/;
  
  if (!subdomainRegex.test(subdomain)) {
    throw new Error("El subdominio solo puede contener letras minúsculas, números y guiones");
  }

  if (subdomain.length < 3 || subdomain.length > 63) {
    throw new Error("El subdominio debe tener entre 3 y 63 caracteres");
  }

  // Verificar que el subdominio no esté tomado
  const { data: existing } = await supabase
    .from("projects")
    .select("id")
    .eq("custom_subdomain", subdomain)
    .neq("id", projectId)
    .single();

  if (existing) {
    throw new Error("Este subdominio ya está en uso");
  }

  // Actualizar proyecto con el subdominio
  const { data, error } = await supabase
    .from("projects")
    .update({
      custom_subdomain: subdomain,
      deployment_url: `https://${subdomain}.nexaoneia.com`,
    })
    .eq("id", projectId)
    .select()
    .single();

  if (error) {
    console.error("Error configurando subdominio:", error);
    throw new Error("No se pudo configurar el subdominio");
  }

  return data;
}

/**
 * Desplegar proyecto a Vercel con subdominio personalizado
 * Llama al endpoint /api/deployments/create
 */
export async function deployToVercel(config: DeploymentConfig) {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    throw new Error("No autenticado");
  }

  const response = await fetch("/api/deployments/create", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${session.access_token}`,
    },
    body: JSON.stringify(config),
  });

  const result = await response.json();

  if (!result.success) {
    throw new Error(result.error || "Error desplegando proyecto");
  }

  return result;
}

/**
 * Obtener logs de deployments de un proyecto
 */
export async function getDeploymentLogs(projectId: string) {
  const { data, error } = await supabase
    .from("deployment_logs")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) {
    console.error("Error obteniendo logs:", error);
    return [];
  }

  return data || [];
}

/**
 * Verificar disponibilidad de un subdominio
 */
export async function checkSubdomainAvailability(subdomain: string): Promise<boolean> {
  const { data } = await supabase
    .from("projects")
    .select("id")
    .eq("custom_subdomain", subdomain)
    .single();

  return !data; // Disponible si no existe
}

/**
 * Generar subdominio automático basado en el nombre del proyecto
 */
export function generateSubdomain(projectName: string): string {
  return projectName
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/--+/g, "-")
    .replace(/^-|-$/g, "")
    .substring(0, 63);
}
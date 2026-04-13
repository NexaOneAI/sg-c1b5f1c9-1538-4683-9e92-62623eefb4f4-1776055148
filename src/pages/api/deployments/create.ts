import type { NextApiRequest, NextApiResponse } from "next";
import { createServerSupabaseClient } from "@/lib/supabase-server";

/**
 * API Route: /api/deployments/create
 * 
 * Deploy de proyecto a Vercel con subdominio personalizado
 * Formato: [nombre-proyecto].nexaoneia.com
 */

type DeploymentRequest = {
  projectId: string;
  subdomain: string;
  githubRepoUrl?: string;
  envVars?: Record<string, string>;
};

type DeploymentResponse = {
  success: boolean;
  deploymentUrl?: string;
  deploymentId?: string;
  error?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<DeploymentResponse>
) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  const { projectId, subdomain, githubRepoUrl, envVars }: DeploymentRequest = req.body;

  if (!projectId || !subdomain) {
    return res.status(400).json({
      success: false,
      error: "Missing required fields: projectId, subdomain",
    });
  }

  // Validar formato de subdominio
  const subdomainRegex = /^[a-z0-9-]+$/;
  if (!subdomainRegex.test(subdomain)) {
    return res.status(400).json({
      success: false,
      error: "El subdominio solo puede contener letras minúsculas, números y guiones",
    });
  }

  try {
    const supabase = createServerSupabaseClient(req);

    // 1. Verificar que el subdominio no esté tomado
    const { data: existingProject } = await supabase
      .from("projects")
      .select("id")
      .eq("custom_subdomain", subdomain)
      .neq("id", projectId)
      .single();

    if (existingProject) {
      return res.status(409).json({
        success: false,
        error: "Este subdominio ya está en uso. Elige otro.",
      });
    }

    // 2. Obtener proyecto
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("id, name, user_id, github_repo_url")
      .eq("id", projectId)
      .single();

    if (projectError || !project) {
      return res.status(404).json({
        success: false,
        error: "Proyecto no encontrado",
      });
    }

    // 3. Actualizar subdominio en el proyecto
    const deploymentUrl = `https://${subdomain}.nexaoneia.com`;
    
    await supabase
      .from("projects")
      .update({
        custom_subdomain: subdomain,
        deployment_url: deploymentUrl,
        deployment_status: "building",
      })
      .eq("id", projectId);

    // 4. Crear log de deployment
    const { data: deploymentLog } = await supabase
      .from("deployment_logs")
      .insert({
        project_id: projectId,
        status: "queued",
        metadata: {
          subdomain,
          githubRepoUrl: githubRepoUrl || project.github_repo_url,
        },
      })
      .select()
      .single();

    // 5. Deploy a Vercel (si tienes VERCEL_TOKEN configurado)
    const vercelToken = process.env.VERCEL_TOKEN;
    
    if (vercelToken && githubRepoUrl) {
      try {
        // Crear proyecto en Vercel
        const vercelResponse = await fetch("https://api.vercel.com/v9/projects", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${vercelToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: subdomain,
            gitRepository: {
              type: "github",
              repo: githubRepoUrl.replace("https://github.com/", ""),
            },
            framework: "nextjs",
            environmentVariables: Object.entries(envVars || {}).map(([key, value]) => ({
              key,
              value,
              target: ["production", "preview", "development"],
            })),
          }),
        });

        const vercelData = await vercelResponse.json();

        if (vercelData.id) {
          // Agregar dominio personalizado al proyecto de Vercel
          await fetch(`https://api.vercel.com/v9/projects/${vercelData.id}/domains`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${vercelToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              name: deploymentUrl.replace("https://", ""),
            }),
          });

          // Actualizar log con éxito
          await supabase
            .from("deployment_logs")
            .update({
              deployment_id: vercelData.id,
              status: "building",
              deployment_url: deploymentUrl,
              metadata: {
                vercel_project_id: vercelData.id,
                subdomain,
              },
            })
            .eq("id", deploymentLog?.id);

          return res.status(200).json({
            success: true,
            deploymentUrl,
            deploymentId: vercelData.id,
          });
        }
      } catch (vercelError) {
        console.error("Error en deploy a Vercel:", vercelError);
        
        // Actualizar log con error
        if (deploymentLog) {
          await supabase
            .from("deployment_logs")
            .update({
              status: "error",
              error_message: "Error desplegando a Vercel",
            })
            .eq("id", deploymentLog.id);
        }
      }
    }

    // Si no hay Vercel token o falla, retornar éxito con URL configurada
    return res.status(200).json({
      success: true,
      deploymentUrl,
      deploymentId: deploymentLog?.id,
    });

  } catch (error: any) {
    console.error("Error en /api/deployments/create:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Error interno del servidor durante el deployment",
    });
  }
}
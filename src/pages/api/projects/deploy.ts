import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/integrations/supabase/client";

/**
 * API Route: /api/projects/deploy
 * 
 * Despliega un proyecto a Vercel.
 * 
 * SETUP REQUERIDO:
 * 1. Crear cuenta en Vercel: https://vercel.com
 * 2. Generar token de API: https://vercel.com/account/tokens
 * 3. Agregar VERCEL_TOKEN en .env.local
 * 4. Configurar VERCEL_TEAM_ID (opcional, para teams)
 * 
 * FLUJO:
 * 1. Obtiene archivos del proyecto desde Supabase
 * 2. Crea un deployment en Vercel via API
 * 3. Retorna la URL del deployment
 * 
 * ALTERNATIVA SIMPLE:
 * - Permitir al usuario descargar un ZIP del proyecto
 * - El usuario lo sube manualmente a Vercel/Netlify
 */

type DeployRequest = {
  projectId: string;
  userId: string;
};

type DeployResponse = {
  success: boolean;
  deploymentUrl?: string;
  error?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<DeployResponse>
) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  const { projectId, userId }: DeployRequest = req.body;

  if (!projectId || !userId) {
    return res.status(400).json({
      success: false,
      error: "Missing required fields: projectId, userId",
    });
  }

  try {
    // Verificar que el usuario sea dueño del proyecto
    const { data: project } = await supabase
      .from("projects")
      .select("*")
      .eq("id", projectId)
      .eq("user_id", userId)
      .single();

    if (!project) {
      return res.status(404).json({
        success: false,
        error: "Project not found or access denied",
      });
    }

    // Obtener archivos del proyecto
    const { data: files } = await supabase
      .from("project_files")
      .select("*")
      .eq("project_id", projectId);

    if (!files || files.length === 0) {
      return res.status(400).json({
        success: false,
        error: "No files to deploy",
      });
    }

    // TODO: INTEGRACIÓN CON VERCEL
    // Descomentar cuando tengas VERCEL_TOKEN configurado:
    /*
    const vercelResponse = await fetch('https://api.vercel.com/v13/deployments', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.VERCEL_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: project.name.toLowerCase().replace(/\s+/g, '-'),
        files: files.map(f => ({
          file: f.file_path,
          data: Buffer.from(f.content).toString('base64'),
        })),
        projectSettings: {
          framework: 'nextjs',
        },
      }),
    });

    const deployment = await vercelResponse.json();
    const deploymentUrl = `https://${deployment.url}`;
    */

    // MOCK RESPONSE
    const deploymentUrl = `https://${project.name.toLowerCase().replace(/\s+/g, "-")}-mock.vercel.app`;

    // Actualizar proyecto con URL de deployment
    await supabase
      .from("projects")
      .update({ deployment_url: deploymentUrl })
      .eq("id", projectId);

    return res.status(200).json({
      success: true,
      deploymentUrl,
    });
  } catch (error) {
    console.error("Error in /api/projects/deploy:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error during deployment",
    });
  }
}
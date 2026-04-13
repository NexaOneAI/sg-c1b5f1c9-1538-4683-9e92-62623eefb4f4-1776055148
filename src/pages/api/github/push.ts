import type { NextApiRequest, NextApiResponse } from "next";
import { createServerSupabaseClient } from "@/lib/supabase-server";

/**
 * API Route: /api/github/push
 * 
 * Push de archivos del proyecto a un repositorio de GitHub
 * Requiere que el proyecto esté conectado a GitHub previamente
 */

type PushRequest = {
  projectId: string;
  commitMessage: string;
};

type PushResponse = {
  success: boolean;
  commitSha?: string;
  commitUrl?: string;
  error?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<PushResponse>
) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  const { projectId, commitMessage }: PushRequest = req.body;

  if (!projectId || !commitMessage) {
    return res.status(400).json({
      success: false,
      error: "Missing required fields: projectId, commitMessage",
    });
  }

  try {
    const supabase = createServerSupabaseClient(req);

    // 1. Obtener proyecto con info de GitHub
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("id, name, github_repo_url, github_branch, user_id")
      .eq("id", projectId)
      .single();

    if (projectError || !project) {
      return res.status(404).json({
        success: false,
        error: "Proyecto no encontrado",
      });
    }

    if (!project.github_repo_url) {
      return res.status(400).json({
        success: false,
        error: "Proyecto no conectado a GitHub. Conecta un repositorio primero.",
      });
    }

    // 2. Obtener token de GitHub del usuario
    const { data: githubConnection, error: connectionError } = await supabase
      .from("github_connections")
      .select("github_access_token, github_username")
      .eq("user_id", project.user_id)
      .single();

    if (connectionError || !githubConnection?.github_access_token) {
      return res.status(401).json({
        success: false,
        error: "GitHub no conectado. Conecta tu cuenta de GitHub primero.",
      });
    }

    // 3. Obtener archivos del proyecto
    const { data: files, error: filesError } = await supabase
      .from("project_files")
      .select("file_path, content")
      .eq("project_id", projectId)
      .order("file_path");

    if (filesError || !files || files.length === 0) {
      return res.status(400).json({
        success: false,
        error: "No hay archivos en el proyecto para hacer push",
      });
    }

    // 4. Extraer owner/repo del URL
    const repoMatch = project.github_repo_url.match(/github\.com\/([^\/]+)\/([^\/\.]+)/);
    if (!repoMatch) {
      return res.status(400).json({
        success: false,
        error: "URL de repositorio GitHub inválida",
      });
    }

    const [, owner, repo] = repoMatch;
    const branch = project.github_branch || "main";

    // 5. Obtener SHA del último commit en la rama
    const refResponse = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/git/ref/heads/${branch}`,
      {
        headers: {
          Authorization: `Bearer ${githubConnection.github_access_token}`,
          Accept: "application/vnd.github.v3+json",
        },
      }
    );

    if (!refResponse.ok) {
      return res.status(400).json({
        success: false,
        error: "No se pudo obtener la referencia de la rama. Verifica que exista.",
      });
    }

    const refData = await refResponse.json();
    const baseCommitSha = refData.object.sha;

    // 6. Crear blobs para cada archivo
    const tree = await Promise.all(
      files.map(async (file) => {
        const blobResponse = await fetch(
          `https://api.github.com/repos/${owner}/${repo}/git/blobs`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${githubConnection.github_access_token}`,
              Accept: "application/vnd.github.v3+json",
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              content: file.content,
              encoding: "utf-8",
            }),
          }
        );

        const blob = await blobResponse.json();

        return {
          path: file.file_path.startsWith("src/") 
            ? file.file_path 
            : `src/${file.file_path}`,
          mode: "100644",
          type: "blob",
          sha: blob.sha,
        };
      })
    );

    // 7. Crear tree
    const treeResponse = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/git/trees`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${githubConnection.github_access_token}`,
          Accept: "application/vnd.github.v3+json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          base_tree: baseCommitSha,
          tree,
        }),
      }
    );

    const treeData = await treeResponse.json();

    // 8. Crear commit
    const commitResponse = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/git/commits`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${githubConnection.github_access_token}`,
          Accept: "application/vnd.github.v3+json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: commitMessage,
          tree: treeData.sha,
          parents: [baseCommitSha],
        }),
      }
    );

    const commitData = await commitResponse.json();

    // 9. Actualizar referencia de la rama
    const updateRefResponse = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/git/refs/heads/${branch}`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${githubConnection.github_access_token}`,
          Accept: "application/vnd.github.v3+json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sha: commitData.sha,
        }),
      }
    );

    if (!updateRefResponse.ok) {
      return res.status(500).json({
        success: false,
        error: "Error actualizando la rama. Verifica los permisos del repositorio.",
      });
    }

    return res.status(200).json({
      success: true,
      commitSha: commitData.sha,
      commitUrl: `https://github.com/${owner}/${repo}/commit/${commitData.sha}`,
    });

  } catch (error: any) {
    console.error("Error en /api/github/push:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Error interno del servidor durante el push a GitHub",
    });
  }
}
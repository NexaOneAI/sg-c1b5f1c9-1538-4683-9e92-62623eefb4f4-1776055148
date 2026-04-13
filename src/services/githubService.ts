import { supabase } from "@/integrations/supabase/client";

/**
 * Servicio de integración con GitHub
 * Maneja OAuth, repos, commits y sincronización
 */

export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  description: string;
  html_url: string;
  clone_url: string;
  default_branch: string;
  private: boolean;
  created_at: string;
  updated_at: string;
}

export interface GitHubCommit {
  sha: string;
  message: string;
  author: {
    name: string;
    email: string;
    date: string;
  };
  html_url: string;
}

/**
 * Inicia el flujo OAuth de GitHub
 * Redirige al usuario a GitHub para autorizar
 */
export async function connectGitHub() {
  const clientId = process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID;
  
  if (!clientId) {
    throw new Error("GITHUB_CLIENT_ID no configurado");
  }

  const redirectUri = `${window.location.origin}/api/auth/github/callback`;
  const scope = "repo,user:email";
  const state = Math.random().toString(36).substring(7);

  // Guardar state en localStorage para verificar callback
  localStorage.setItem("github_oauth_state", state);

  const authUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}&state=${state}`;
  
  window.location.href = authUrl;
}

/**
 * Desconectar GitHub de la cuenta del usuario
 */
export async function disconnectGitHub(userId: string) {
  const { error } = await supabase
    .from("github_connections")
    .delete()
    .eq("user_id", userId);

  if (error) {
    console.error("Error desconectando GitHub:", error);
    return false;
  }

  return true;
}

/**
 * Obtener la conexión de GitHub del usuario
 */
export async function getGitHubConnection(userId: string) {
  const { data, error } = await supabase
    .from("github_connections")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error && error.code !== "PGRST116") {
    console.error("Error obteniendo conexión GitHub:", error);
    return null;
  }

  return data;
}

/**
 * Listar repositorios del usuario en GitHub
 */
export async function listGitHubRepos(userId: string): Promise<GitHubRepo[]> {
  const connection = await getGitHubConnection(userId);
  
  if (!connection?.github_access_token) {
    throw new Error("GitHub no conectado");
  }

  try {
    const response = await fetch("https://api.github.com/user/repos?sort=updated&per_page=100", {
      headers: {
        Authorization: `Bearer ${connection.github_access_token}`,
        Accept: "application/vnd.github.v3+json",
      },
    });

    if (!response.ok) {
      throw new Error("Error obteniendo repositorios de GitHub");
    }

    const repos: GitHubRepo[] = await response.json();
    return repos;
  } catch (error) {
    console.error("Error listando repos:", error);
    throw error;
  }
}

/**
 * Conectar un proyecto a un repositorio de GitHub
 */
export async function connectProjectToRepo(
  projectId: string,
  repoUrl: string,
  branch: string = "main"
) {
  const { data, error } = await supabase
    .from("projects")
    .update({
      github_repo_url: repoUrl,
      github_branch: branch,
      github_connected_at: new Date().toISOString(),
    })
    .eq("id", projectId)
    .select()
    .single();

  if (error) {
    console.error("Error conectando proyecto a repo:", error);
    return null;
  }

  return data;
}

/**
 * Desconectar proyecto de GitHub
 */
export async function disconnectProjectFromRepo(projectId: string) {
  const { error } = await supabase
    .from("projects")
    .update({
      github_repo_url: null,
      github_branch: null,
      github_connected_at: null,
    })
    .eq("id", projectId);

  return !error;
}

/**
 * Push de archivos del proyecto a GitHub
 * Llama al endpoint de servidor /api/github/push
 */
export async function pushToGitHub(projectId: string, commitMessage: string) {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    throw new Error("No autenticado");
  }

  const response = await fetch("/api/github/push", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({
      projectId,
      commitMessage,
    }),
  });

  const result = await response.json();

  if (!result.success) {
    throw new Error(result.error || "Error haciendo push a GitHub");
  }

  return result;
}

/**
 * Obtener últimos commits del repositorio
 */
export async function getRecentCommits(
  userId: string,
  repoFullName: string,
  branch: string = "main"
): Promise<GitHubCommit[]> {
  const connection = await getGitHubConnection(userId);
  
  if (!connection?.github_access_token) {
    throw new Error("GitHub no conectado");
  }

  try {
    const response = await fetch(
      `https://api.github.com/repos/${repoFullName}/commits?sha=${branch}&per_page=10`,
      {
        headers: {
          Authorization: `Bearer ${connection.github_access_token}`,
          Accept: "application/vnd.github.v3+json",
        },
      }
    );

    if (!response.ok) {
      throw new Error("Error obteniendo commits");
    }

    const commits = await response.json();
    return commits.map((c: any) => ({
      sha: c.sha,
      message: c.commit.message,
      author: {
        name: c.commit.author.name,
        email: c.commit.author.email,
        date: c.commit.author.date,
      },
      html_url: c.html_url,
    }));
  } catch (error) {
    console.error("Error obteniendo commits:", error);
    return [];
  }
}
import { supabase } from "@/integrations/supabase/client";
import type { Database, Tables } from "@/integrations/supabase/types";

export type Project = Tables<"projects">;
export type ProjectVersion = Tables<"project_versions">;
export type ProjectFile = Tables<"project_files">;

export async function getUserProjects(userId: string): Promise<Project[]> {
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });
  
  if (error) {
    console.error("Error fetching projects:", error);
    return [];
  }
  
  return data || [];
}

export async function getProject(projectId: string): Promise<Project | null> {
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("id", projectId)
    .single();
  
  if (error) {
    console.error("Error fetching project:", error);
    return null;
  }
  
  return data;
}

export async function createProject(
  userId: string,
  projectData: Omit<Database["public"]["Tables"]["projects"]["Insert"], "user_id">
): Promise<Project | null> {
  const { data, error } = await supabase
    .from("projects")
    .insert({
      name: projectData.name,
      description: projectData.description || null,
      status: projectData.status || "active",
      framework: projectData.framework || "react",
      metadata: projectData.metadata || null,
      user_id: userId,
    })
    .select()
    .single();
  
  if (error) {
    console.error("Error creating project:", error);
    return null;
  }
  
  return data;
}

export async function updateProject(
  projectId: string,
  updates: Partial<Project>
): Promise<Project | null> {
  const { data, error } = await supabase
    .from("projects")
    .update(updates)
    .eq("id", projectId)
    .select()
    .single();
  
  if (error) {
    console.error("Error updating project:", error);
    return null;
  }
  
  return data;
}

export async function deleteProject(projectId: string): Promise<boolean> {
  const { error } = await supabase
    .from("projects")
    .delete()
    .eq("id", projectId);
  
  if (error) {
    console.error("Error deleting project:", error);
    return false;
  }
  
  return true;
}

export async function getProjectVersions(projectId: string): Promise<ProjectVersion[]> {
  const { data, error } = await supabase
    .from("project_versions")
    .select("*")
    .eq("project_id", projectId)
    .order("version_number", { ascending: false });
  
  if (error) {
    console.error("Error fetching versions:", error);
    return [];
  }
  
  return data || [];
}

export async function createProjectVersion(
  projectId: string,
  versionData: Omit<Database["public"]["Tables"]["project_versions"]["Insert"], "project_id">
): Promise<ProjectVersion | null> {
  const { data, error } = await supabase
    .from("project_versions")
    .insert({
      version_number: versionData.version_number,
      name: versionData.name || null,
      description: versionData.description || null,
      metadata: versionData.metadata || null,
      is_current: versionData.is_current ?? true,
      created_by: versionData.created_by || null,
      project_id: projectId,
    })
    .select()
    .single();
  
  if (error) {
    console.error("Error creating version:", error);
    return null;
  }
  
  return data;
}

export async function getProjectFiles(projectId: string): Promise<ProjectFile[]> {
  const { data, error } = await supabase
    .from("project_files")
    .select("*")
    .eq("project_id", projectId)
    .order("file_path", { ascending: true });
  
  if (error) {
    console.error("Error fetching files:", error);
    return [];
  }
  
  return data || [];
}

export async function upsertProjectFile(
  projectId: string,
  versionId: string,
  filePath: string,
  fileName: string,
  content: string,
  fileType: string = "typescript"
): Promise<ProjectFile | null> {
  const { data, error } = await supabase
    .from("project_files")
    .upsert({
      project_id: projectId,
      version_id: versionId,
      file_path: filePath,
      file_name: fileName,
      content,
      file_type: fileType,
      size_bytes: content.length,
    })
    .select()
    .single();
  
  if (error) {
    console.error("Error upserting file:", error);
    return null;
  }
  
  return data;
}
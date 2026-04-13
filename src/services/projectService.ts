import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";

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
  projectData: Omit<TablesInsert<"projects">, "user_id">
): Promise<Project | null> {
  const { data, error } = await supabase
    .from("projects")
    .insert({
      ...projectData,
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
  versionData: Omit<TablesInsert<"project_versions">, "project_id">
): Promise<ProjectVersion | null> {
  const { data, error } = await supabase
    .from("project_versions")
    .insert({
      ...versionData,
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
  filePath: string,
  content: string
): Promise<ProjectFile | null> {
  const { data, error } = await supabase
    .from("project_files")
    .upsert({
      project_id: projectId,
      file_path: filePath,
      content,
    })
    .select()
    .single();
  
  if (error) {
    console.error("Error upserting file:", error);
    return null;
  }
  
  return data;
}
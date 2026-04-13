import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type Conversation = Tables<"conversations">;
export type Message = Tables<"messages">;

export async function getProjectConversation(projectId: string): Promise<Conversation | null> {
  const { data, error } = await supabase
    .from("conversations")
    .select("*")
    .eq("project_id", projectId)
    .single();
  
  if (error) {
    console.error("Error fetching conversation:", error);
    return null;
  }
  
  return data;
}

export async function createConversation(
  projectId: string,
  userId: string
): Promise<Conversation | null> {
  const { data, error } = await supabase
    .from("conversations")
    .insert({
      project_id: projectId,
      user_id: userId,
      title: "Nueva Conversación",
      metadata: {},
    })
    .select()
    .single();
  
  if (error) {
    console.error("Error creating conversation:", error);
    return null;
  }
  
  return data;
}

export async function getConversationMessages(conversationId: string): Promise<Message[]> {
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });
  
  if (error) {
    console.error("Error fetching messages:", error);
    return [];
  }
  
  return data || [];
}

export async function addMessage(
  conversationId: string,
  projectId: string,
  userId: string,
  role: "user" | "assistant" | "system",
  content: string,
  metadata?: Record<string, any>
): Promise<Message | null> {
  const { data, error } = await supabase
    .from("messages")
    .insert({
      conversation_id: conversationId,
      project_id: projectId,
      user_id: userId,
      role,
      content,
      metadata: metadata || {},
    })
    .select()
    .single();
  
  if (error) {
    console.error("Error adding message:", error);
    return null;
  }
  
  return data;
}

export async function updateMessage(
  messageId: string,
  updates: Partial<Message>
): Promise<Message | null> {
  const { data, error } = await supabase
    .from("messages")
    .update(updates)
    .eq("id", messageId)
    .select()
    .single();
  
  if (error) {
    console.error("Error updating message:", error);
    return null;
  }
  
  return data;
}
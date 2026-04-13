import { supabase } from "@/integrations/supabase/client";
import type { Database, Tables } from "@/integrations/supabase/types";

export type Profile = Tables<"profiles">;
export type ProfileUpdate = Database["public"]["Tables"]["profiles"]["Update"];
export type CreditTransaction = Tables<"credit_transactions">;

export async function getCurrentProfile(): Promise<Profile | null> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return null;
  
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();
  
  if (error) {
    console.error("Error fetching profile:", error);
    return null;
  }
  
  return data;
}

export async function updateProfile(
  userId: string,
  updates: ProfileUpdate
): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", userId)
    .select()
    .single();
  
  if (error) {
    console.error("Error updating profile:", error);
    return null;
  }
  
  return data;
}

export async function isAdmin(): Promise<boolean> {
  const profile = await getCurrentProfile();
  return profile?.role === "admin" || profile?.role === "superadmin";
}

export async function getUserTransactions(userId: string, limit = 10): Promise<CreditTransaction[]> {
  const { data: wallet } = await supabase
    .from("credit_wallets")
    .select("id")
    .eq("user_id", userId)
    .single();

  if (!wallet) return [];

  const { data, error } = await supabase
    .from("credit_transactions")
    .select("*")
    .eq("wallet_id", wallet.id)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Error fetching transactions:", error);
    return [];
  }

  return data || [];
}
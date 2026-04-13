import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type CreditWallet = Tables<"credit_wallets">;
export type CreditTransaction = Tables<"credit_transactions">;

export async function getCreditWallet(userId: string): Promise<CreditWallet | null> {
  const { data, error } = await supabase
    .from("credit_wallets")
    .select("*")
    .eq("user_id", userId)
    .single();
  
  if (error) {
    console.error("Error fetching credit wallet:", error);
    return null;
  }
  
  return data;
}

export async function getCreditTransactions(userId: string): Promise<CreditTransaction[]> {
  const { data, error } = await supabase
    .from("credit_transactions")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  
  if (error) {
    console.error("Error fetching transactions:", error);
    return [];
  }
  
  return data || [];
}

export async function deductCredits(
  userId: string,
  amount: number,
  description: string,
  metadata?: Record<string, any>
): Promise<boolean> {
  const { error } = await supabase
    .from("credit_transactions")
    .insert({
      user_id: userId,
      amount: -amount,
      type: "usage",
      description,
      metadata,
    });
  
  if (error) {
    console.error("Error deducting credits:", error);
    return false;
  }
  
  return true;
}
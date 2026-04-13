import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import type { NextApiRequest } from "next";

/**
 * Crea un cliente Supabase para usar en API routes del servidor
 * que tiene acceso a la sesión del usuario autenticado
 */
export function createServerSupabaseClient(req: NextApiRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  // Obtener el token de acceso del header Authorization
  const authHeader = req.headers.authorization;
  const accessToken = authHeader?.replace("Bearer ", "");

  // Crear cliente con el token del usuario
  return createClient<Database>(supabaseUrl, supabaseKey, {
    global: {
      headers: accessToken
        ? {
            Authorization: `Bearer ${accessToken}`,
          }
        : {},
    },
  });
}

/**
 * Crea un cliente Supabase con service role key para operaciones admin
 * SOLO usar para operaciones que requieren bypass de RLS
 */
export function createAdminSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  if (!serviceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY no está configurada");
  }

  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
import type { NextApiRequest, NextApiResponse } from "next";
import { createAdminSupabaseClient } from "@/lib/supabase-server";

/**
 * GitHub OAuth Callback Handler
 * Recibe el código de autorización y lo intercambia por un access token
 */

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { code, state } = req.query;

  if (!code || typeof code !== "string") {
    return res.redirect("/dashboard?error=github_auth_failed");
  }

  try {
    // Intercambiar código por access token
    const tokenResponse = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        client_id: process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (tokenData.error || !tokenData.access_token) {
      console.error("Error obteniendo token de GitHub:", tokenData);
      return res.redirect("/dashboard?error=github_token_failed");
    }

    // Obtener información del usuario de GitHub
    const userResponse = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        Accept: "application/vnd.github.v3+json",
      },
    });

    const githubUser = await userResponse.json();

    // Obtener usuario actual de Supabase (desde cookie o header)
    // Por ahora redirigimos con el token en la URL
    // En producción, guardaríamos en una sesión temporal o cookie segura
    
    const redirectUrl = new URL("/dashboard/github/success", req.headers.origin || "http://localhost:3000");
    redirectUrl.searchParams.set("token", tokenData.access_token);
    redirectUrl.searchParams.set("username", githubUser.login);

    return res.redirect(redirectUrl.toString());

  } catch (error) {
    console.error("Error en GitHub OAuth callback:", error);
    return res.redirect("/dashboard?error=github_auth_error");
  }
}
import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/integrations/supabase/client";

/**
 * API Route: /api/ai/generate
 * 
 * Genera código basado en el prompt del usuario usando OpenAI.
 * 
 * SETUP REQUERIDO:
 * 1. Crear cuenta en OpenAI: https://platform.openai.com/
 * 2. Generar API Key: https://platform.openai.com/api-keys
 * 3. Agregar OPENAI_API_KEY en .env.local
 * 4. Instalar: npm install openai
 * 
 * CONFIGURACIÓN DE CRÉDITOS:
 * - Cada generación consume créditos del usuario
 * - El costo se configura en admin_settings (default: 10 créditos)
 * - Si el usuario no tiene créditos suficientes, retorna error 402
 */

type GenerateRequest = {
  projectId: string;
  userId: string;
  prompt: string;
  context?: {
    files?: Array<{ path: string; content: string }>;
    previousMessages?: Array<{ role: string; content: string }>;
  };
};

type GenerateResponse = {
  success: boolean;
  code?: {
    files: Array<{
      path: string;
      content: string;
      action: "create" | "update" | "delete";
    }>;
    explanation: string;
  };
  error?: string;
  creditsUsed?: number;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<GenerateResponse>
) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  const { projectId, userId, prompt, context }: GenerateRequest = req.body;

  if (!projectId || !userId || !prompt) {
    return res.status(400).json({ 
      success: false, 
      error: "Missing required fields: projectId, userId, prompt" 
    });
  }

  try {
    // 1. Verificar créditos del usuario
    const { data: wallet } = await supabase
      .from("credit_wallets")
      .select("balance")
      .eq("user_id", userId)
      .single();

    const { data: settings } = await supabase
      .from("admin_settings")
      .select("value")
      .eq("key", "generation_cost")
      .single();

    const settingsValue = settings?.value as Record<string, any> | null;
    const generationCost = settingsValue?.cost || 10;

    if (!wallet || wallet.balance < generationCost) {
      return res.status(402).json({
        success: false,
        error: "Insufficient credits. Please purchase more credits to continue.",
      });
    }

    // 2. TODO: INTEGRACIÓN REAL CON OPENAI
    // Descomentar cuando tengas OPENAI_API_KEY configurado:
    /*
    const OpenAI = require('openai');
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const systemPrompt = `Eres un experto desarrollador que genera código limpio, modular y funcional para aplicaciones React con TypeScript y Tailwind CSS.
    
Reglas:
- Genera código completo y funcional, no placeholders
- Usa TypeScript con tipos estrictos
- Usa Tailwind para estilos
- Sigue las mejores prácticas de React
- Estructura el código en componentes reutilizables
- Incluye comentarios solo cuando sea necesario para explicar lógica compleja
- Retorna un JSON con array de archivos: [{path, content, action}]`;

    const messages = [
      { role: "system", content: systemPrompt },
      ...(context?.previousMessages || []),
      { role: "user", content: prompt },
    ];

    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages,
      temperature: 0.7,
      max_tokens: 4000,
    });

    const generatedCode = JSON.parse(completion.choices[0].message.content);
    */

    // MOCK RESPONSE (reemplazar con respuesta real de OpenAI)
    const generatedCode = {
      files: [
        {
          path: "src/components/GeneratedComponent.tsx",
          content: `import { Button } from "@/components/ui/button";

export function GeneratedComponent() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Componente Generado</h1>
      <p className="text-muted-foreground mb-4">
        Este es un componente de ejemplo. La integración con OpenAI generará código real basado en tu prompt.
      </p>
      <Button className="cyber-gradient">Acción</Button>
    </div>
  );
}`,
          action: "create" as const,
        },
      ],
      explanation: "Mock: Integración con OpenAI pendiente. Agrega OPENAI_API_KEY en .env.local para activar generación real.",
    };

    // 3. Descontar créditos
    const { data: walletData } = await supabase
      .from("credit_wallets")
      .select("id")
      .eq("user_id", userId)
      .single();

    if (walletData) {
      await supabase.from("credit_transactions").insert({
        wallet_id: walletData.id,
        user_id: userId,
        amount: -generationCost,
        type: "usage",
        description: `Code generation: ${prompt.substring(0, 50)}...`,
        metadata: { projectId, prompt: prompt.substring(0, 100) },
      });
    }

    // 4. Guardar archivos generados en la base de datos
    const { data: version } = await supabase
      .from("project_versions")
      .insert({
        project_id: projectId,
        prompt: prompt,
      })
      .select()
      .single();

    if (version) {
      for (const file of generatedCode.files) {
        await supabase.from("project_files").insert({
          project_id: projectId,
          version_id: version.id,
          file_path: file.path,
          file_name: file.path.split("/").pop() || "",
          content: file.content,
          file_type: file.path.endsWith(".tsx") || file.path.endsWith(".ts") ? "typescript" : "javascript",
        });
      }
    }

    return res.status(200).json({
      success: true,
      code: generatedCode,
      creditsUsed: generationCost,
    });
  } catch (error) {
    console.error("Error in /api/ai/generate:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error during code generation",
    });
  }
}
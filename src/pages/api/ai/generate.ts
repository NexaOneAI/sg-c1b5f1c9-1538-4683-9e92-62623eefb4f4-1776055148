import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/integrations/supabase/client";
import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";

/**
 * API Route: /api/ai/generate
 * 
 * Sistema dual de IA con OpenAI y Claude:
 * - GPT-4 Turbo: Tareas generales y rápidas (10 créditos)
 * - Claude 3.5 Sonnet: Arquitectura compleja (20 créditos)
 * - Claude 3 Opus: Máxima calidad (40 créditos)
 * 
 * SETUP REQUERIDO:
 * 1. OpenAI: https://platform.openai.com/api-keys
 * 2. Claude: https://console.anthropic.com/
 * 3. Agregar ambas API keys en .env.local
 * 4. npm install openai @anthropic-ai/sdk
 */

type AIModel = "gpt4" | "claude_sonnet" | "claude_opus";

type GenerateRequest = {
  projectId: string;
  userId: string;
  prompt: string;
  model?: AIModel;
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
  modelUsed?: string;
};

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const SYSTEM_PROMPT = `Eres un experto arquitecto de software y desarrollador full-stack especializado en React, TypeScript, Next.js y Tailwind CSS.

TU MISIÓN:
Generar código limpio, modular, funcional y production-ready basado en las instrucciones del usuario.

REGLAS ESTRICTAS:
1. **Código completo**: Nunca uses placeholders, comentarios TODO, o código incompleto
2. **TypeScript estricto**: Tipos explícitos, interfaces claras, sin any
3. **Componentes modulares**: Separa concerns, DRY principle, reutilizables
4. **Tailwind CSS**: Usa utility classes, responsive design, diseño premium
5. **Estructura clara**: Organiza por carpetas lógicas (components, services, pages, lib)
6. **Nombres descriptivos**: Variables, funciones y archivos con nombres claros
7. **Sin comentarios innecesarios**: El código debe ser autoexplicativo
8. **Manejo de errores**: Try-catch, validaciones, estados de loading/error
9. **Accesibilidad**: ARIA labels, contraste adecuado, navegación por teclado
10. **Performance**: Lazy loading, memoización cuando corresponda, optimizaciones

FORMATO DE RESPUESTA:
Retorna SIEMPRE un objeto JSON válido con esta estructura exacta:

{
  "files": [
    {
      "path": "src/components/Example.tsx",
      "content": "código completo del archivo",
      "action": "create" | "update" | "delete"
    }
  ],
  "explanation": "Explicación concisa de los cambios realizados"
}

CONTEXTO DEL PROYECTO:
- Framework: Next.js 15 (Page Router)
- Styling: Tailwind CSS + shadcn/ui
- Database: Supabase (PostgreSQL)
- Auth: Supabase Auth
- Deploy: Vercel

IMPORTANTE:
- Si el usuario pide "crear un componente", incluye imports, tipos, y código funcional completo
- Si pide "modificar", analiza el código existente y haz cambios quirúrgicos
- Si hay dependencias externas necesarias, menciónalas en la explicación
- Mantén la coherencia con el stack y patrones del proyecto`;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<GenerateResponse>
) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  const { projectId, userId, prompt, model = "gpt4", context }: GenerateRequest = req.body;

  if (!projectId || !userId || !prompt) {
    return res.status(400).json({ 
      success: false, 
      error: "Missing required fields: projectId, userId, prompt" 
    });
  }

  try {
    // 1. Obtener costos configurados para cada modelo
    const { data: settings } = await supabase
      .from("admin_settings")
      .select("value")
      .eq("key", "ai_model_costs")
      .single();

    const modelCosts = (settings?.value as Record<string, any>) || {
      gpt4: { cost: 10 },
      claude_sonnet: { cost: 20 },
      claude_opus: { cost: 40 },
    };

    const selectedModel = modelCosts[model] || modelCosts.gpt4;
    const generationCost = selectedModel.cost || 10;

    // 2. Verificar créditos del usuario
    const { data: wallet } = await supabase
      .from("credit_wallets")
      .select("balance")
      .eq("user_id", userId)
      .single();

    if (!wallet || wallet.balance < generationCost) {
      return res.status(402).json({
        success: false,
        error: `Insufficient credits. This operation requires ${generationCost} credits. Please purchase more credits to continue.`,
      });
    }

    // 3. Construir contexto del prompt con archivos y mensajes previos
    const contextStr = context?.files
      ? `\n\nARCHIVOS ACTUALES DEL PROYECTO:\n${context.files.map(f => `\n--- ${f.path} ---\n${f.content}`).join("\n")}`
      : "";

    const fullPrompt = `${prompt}${contextStr}`;

    // 4. Generar código con el modelo seleccionado
    let generatedCode;
    let modelUsed = "";

    if (model === "claude_sonnet" || model === "claude_opus") {
      // Usar Claude para tareas complejas
      const claudeModel = model === "claude_opus" 
        ? "claude-3-opus-20240229" 
        : "claude-3-5-sonnet-20241022";

      const messages: Anthropic.MessageCreateParams["messages"] = [
        ...(context?.previousMessages?.map(m => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        })) || []),
        { role: "user", content: fullPrompt },
      ];

      const response = await anthropic.messages.create({
        model: claudeModel,
        max_tokens: 4000,
        system: SYSTEM_PROMPT,
        messages,
      });

      const textContent = response.content.find(c => c.type === "text");
      const rawResponse = textContent?.type === "text" ? textContent.text : "";
      
      // Extraer JSON del response (puede venir con markdown)
      const jsonMatch = rawResponse.match(/```json\n([\s\S]*?)\n```/) || 
                       rawResponse.match(/\{[\s\S]*"files"[\s\S]*\}/);
      
      generatedCode = jsonMatch ? JSON.parse(jsonMatch[1] || jsonMatch[0]) : JSON.parse(rawResponse);
      modelUsed = model === "claude_opus" ? "Claude 3 Opus" : "Claude 3.5 Sonnet";

    } else {
      // Usar OpenAI GPT-4 para tareas generales
      const messages: OpenAI.ChatCompletionMessageParam[] = [
        { role: "system", content: SYSTEM_PROMPT },
        ...(context?.previousMessages?.map(m => ({
          role: m.role as "system" | "user" | "assistant",
          content: m.content,
        })) || []),
        { role: "user", content: fullPrompt },
      ];

      const completion = await openai.chat.completions.create({
        model: "gpt-4-turbo-preview",
        messages,
        temperature: 0.7,
        max_tokens: 4000,
        response_format: { type: "json_object" },
      });

      generatedCode = JSON.parse(completion.choices[0].message.content || "{}");
      modelUsed = "GPT-4 Turbo";
    }

    // 5. Validar estructura del response
    if (!generatedCode.files || !Array.isArray(generatedCode.files)) {
      throw new Error("Invalid AI response format");
    }

    // 6. Descontar créditos
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
        description: `AI generation (${modelUsed}): ${prompt.substring(0, 50)}...`,
        metadata: { 
          projectId, 
          model: modelUsed,
          prompt: prompt.substring(0, 200),
          filesGenerated: generatedCode.files.length,
        },
      });
    }

    // 7. Crear nueva versión del proyecto
    const { data: version } = await supabase
      .from("project_versions")
      .insert({
        project_id: projectId,
        version_number: Date.now(),
        name: `AI Generation - ${new Date().toLocaleString()}`,
        metadata: { 
          prompt,
          model: modelUsed,
          creditsUsed: generationCost,
        },
      })
      .select()
      .single();

    // 8. Guardar archivos generados
    if (version) {
      for (const file of generatedCode.files) {
        if (file.action === "delete") {
          await supabase
            .from("project_files")
            .delete()
            .eq("project_id", projectId)
            .eq("file_path", file.path);
        } else {
          await supabase.from("project_files").insert({
            project_id: projectId,
            version_id: version.id,
            file_path: file.path,
            file_name: file.path.split("/").pop() || "",
            content: file.content,
            file_type: file.path.endsWith(".tsx") || file.path.endsWith(".ts") 
              ? "typescript" 
              : file.path.endsWith(".css") 
              ? "css" 
              : "javascript",
          });
        }
      }
    }

    return res.status(200).json({
      success: true,
      code: generatedCode,
      creditsUsed: generationCost,
      modelUsed,
    });

  } catch (error: any) {
    console.error("Error in /api/ai/generate:", error);
    
    // Errores específicos de APIs
    if (error.status === 401) {
      return res.status(500).json({
        success: false,
        error: "API key inválida. Verifica tus credenciales de OpenAI/Claude en .env.local",
      });
    }

    if (error.status === 429) {
      return res.status(429).json({
        success: false,
        error: "Rate limit excedido. Intenta nuevamente en unos minutos.",
      });
    }

    return res.status(500).json({
      success: false,
      error: error.message || "Internal server error during code generation",
    });
  }
}
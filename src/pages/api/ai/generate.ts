import type { NextApiRequest, NextApiResponse } from "next";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";

/**
 * API Route: /api/ai/generate
 * 
 * Sistema dual de IA con OpenAI y Claude:
 * - GPT-4o Mini: Tareas generales y rápidas (10 créditos) - MÁS ACCESIBLE
 * - GPT-3.5 Turbo: Fallback si GPT-4o no disponible (5 créditos)
 * - Claude 3.5 Sonnet: Arquitectura compleja (20 créditos) - Requiere ANTHROPIC_API_KEY
 * - Claude 3 Opus: Máxima calidad (40 créditos) - Requiere ANTHROPIC_API_KEY
 * 
 * SETUP REQUERIDO:
 * 1. OpenAI: https://platform.openai.com/api-keys
 *    - Crear API key
 *    - Agregar créditos prepagados (mínimo $5)
 *    - Verificar acceso en: https://platform.openai.com/settings/organization/limits
 * 
 * 2. Claude (OPCIONAL): https://console.anthropic.com/
 *    - Solo si quieres usar modelos Claude
 * 
 * 3. Agregar API keys en .env.local:
 *    OPENAI_API_KEY=sk-proj-...
 *    ANTHROPIC_API_KEY=sk-ant-... (opcional)
 */

type AIModel = "gpt4" | "gpt3" | "claude_sonnet" | "claude_opus";

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

const anthropic = process.env.ANTHROPIC_API_KEY ? new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
}) : null;

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

  const { projectId, userId, prompt, model = "claude_sonnet", context }: GenerateRequest = req.body;

  if (!projectId || !userId || !prompt) {
    return res.status(400).json({ 
      success: false, 
      error: "Missing required fields: projectId, userId, prompt" 
    });
  }

  try {
    // Crear cliente Supabase con la sesión del usuario
    const supabase = createServerSupabaseClient(req);

    // 1. Obtener costos configurados para cada modelo
    const { data: settings } = await supabase
      .from("admin_settings")
      .select("value")
      .eq("key", "ai_model_costs")
      .single();

    const modelCosts = (settings?.value as Record<string, any>) || {
      claude_sonnet: { cost: 15, name: "Claude 3.5 Sonnet" },
      gpt4: { cost: 10, name: "GPT-4o Mini" },
      gpt3: { cost: 5, name: "GPT-3.5 Turbo" },
      claude_opus: { cost: 40, name: "Claude 3 Opus" },
    };

    const selectedModel = modelCosts[model] || modelCosts.claude_sonnet;
    const generationCost = selectedModel.cost || 15;

    // 2. Verificar créditos del usuario con el cliente autenticado
    const { data: wallet, error: walletError } = await supabase
      .from("credit_wallets")
      .select("id, balance")
      .eq("user_id", userId)
      .single();

    console.log("💰 Wallet check:", { 
      wallet, 
      walletError, 
      userId, 
      generationCost,
      hasAuthHeader: !!req.headers.authorization 
    });

    if (walletError) {
      console.error("❌ Error obteniendo wallet:", walletError);
      return res.status(402).json({
        success: false,
        error: "No se pudo verificar tu saldo de créditos. Intenta nuevamente.",
      });
    }

    if (!wallet) {
      console.error("❌ Wallet no encontrado para userId:", userId);
      return res.status(402).json({
        success: false,
        error: "No se encontró tu wallet de créditos. Contacta a soporte.",
      });
    }

    // Comparar balance numérico correctamente
    const currentBalance = Number(wallet.balance) || 0;
    
    if (currentBalance < generationCost) {
      console.log("❌ Insufficient credits:", { currentBalance, generationCost });
      return res.status(402).json({
        success: false,
        error: `Créditos insuficientes. Esta operación requiere ${generationCost} créditos. Tienes ${currentBalance} créditos disponibles.`,
      });
    }

    console.log("✅ Credits verified:", { 
      currentBalance, 
      generationCost, 
      remaining: currentBalance - generationCost 
    });

    // 3. Construir contexto del prompt con archivos y mensajes previos
    const contextStr = context?.files
      ? `\n\nARCHIVOS ACTUALES DEL PROYECTO:\n${context.files.map(f => `\n--- ${f.path} ---\n${f.content}`).join("\n")}`
      : "";

    const fullPrompt = `${prompt}${contextStr}`;

    // 4. Generar código con el modelo seleccionado
    let generatedCode;
    let modelUsed = "";

    // Intentar con Claude primero (más confiable)
    if ((model === "claude_sonnet" || model === "claude_opus") && anthropic) {
      try {
        // CORRECCIÓN: Usar nombres de modelos CORRECTOS de Anthropic
        const claudeModel = model === "claude_opus" 
          ? "claude-3-opus-20240229" 
          : "claude-3-5-sonnet-20240620";  // ← CORREGIDO (era 20241022)

        const messages: Anthropic.MessageCreateParams["messages"] = [
          ...(context?.previousMessages?.map(m => ({
            role: m.role as "user" | "assistant",
            content: m.content,
          })) || []),
          { role: "user", content: fullPrompt },
        ];

        console.log("🤖 Usando Claude:", claudeModel);

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

        console.log("✅ Claude respondió exitosamente");

      } catch (claudeError: any) {
        console.error("❌ Error con Claude:", claudeError.message);
        
        // Si Claude falla, intentar con OpenAI como fallback usando modelo más básico
        if (openai) {
          console.log("⚠️ Intentando fallback a OpenAI GPT-4...");
          try {
            // Intentar con gpt-4 (más disponible que gpt-3.5-turbo en algunas cuentas)
            const completion = await openai.chat.completions.create({
              model: "gpt-4",
              messages: [
                { role: "system", content: SYSTEM_PROMPT },
                ...(context?.previousMessages?.map(m => ({
                  role: m.role as "system" | "user" | "assistant",
                  content: m.content,
                })) || []),
                { role: "user", content: fullPrompt },
              ],
              temperature: 0.7,
              max_tokens: 4000,
            });

            generatedCode = JSON.parse(completion.choices[0].message.content || "{}");
            modelUsed = "GPT-4 (fallback desde Claude)";
          } catch (gpt4Error: any) {
            // Si GPT-4 tampoco funciona, intentar con text-davinci-003
            console.log("⚠️ GPT-4 falló, intentando con modelo base...");
            try {
              const completion = await openai.chat.completions.create({
                model: "gpt-3.5-turbo-instruct",
                messages: [
                  { role: "system", content: SYSTEM_PROMPT },
                  { role: "user", content: fullPrompt },
                ],
                temperature: 0.7,
                max_tokens: 4000,
              });

              generatedCode = JSON.parse(completion.choices[0].message.content || "{}");
              modelUsed = "GPT-3.5 Turbo Instruct (fallback)";
            } catch (fallbackError) {
              throw new Error(
                `Todos los modelos fallaron:\n\n` +
                `Claude: ${claudeError.message}\n` +
                `GPT-4: ${gpt4Error.message}\n` +
                `GPT-3.5 Instruct: ${fallbackError instanceof Error ? fallbackError.message : 'Error'}\n\n` +
                `Tu API key de OpenAI no tiene acceso a ningún modelo de chat.\n` +
                `Verifica en: https://platform.openai.com/settings/organization/limits`
              );
            }
          }
        } else {
          throw claudeError;
        }
      }

    } else {
      // Usar OpenAI - intentar con modelos en cascada hasta encontrar uno que funcione
      const messages: OpenAI.ChatCompletionMessageParam[] = [
        { role: "system", content: SYSTEM_PROMPT },
        ...(context?.previousMessages?.map(m => ({
          role: m.role as "system" | "user" | "assistant",
          content: m.content,
        })) || []),
        { role: "user", content: fullPrompt },
      ];

      const modelsToTry = [
        { name: "gpt-4o", label: "GPT-4o" },
        { name: "gpt-4o-mini", label: "GPT-4o Mini" },
        { name: "gpt-4", label: "GPT-4" },
        { name: "gpt-4-turbo", label: "GPT-4 Turbo" },
        { name: "gpt-3.5-turbo", label: "GPT-3.5 Turbo" },
        { name: "gpt-3.5-turbo-16k", label: "GPT-3.5 Turbo 16K" },
      ];

      let lastError: any = null;

      for (const modelToTry of modelsToTry) {
        try {
          console.log(`🤖 Intentando OpenAI: ${modelToTry.name}`);

          const completion = await openai.chat.completions.create({
            model: modelToTry.name,
            messages,
            temperature: 0.7,
            max_tokens: 4000,
            response_format: modelToTry.name.includes("gpt-4o") || modelToTry.name.includes("gpt-3.5") 
              ? { type: "json_object" } 
              : undefined,
          });

          generatedCode = JSON.parse(completion.choices[0].message.content || "{}");
          modelUsed = modelToTry.label;
          console.log(`✅ ${modelToTry.label} respondió exitosamente`);
          break; // Salir del loop si funcionó

        } catch (error: any) {
          console.log(`❌ ${modelToTry.name} falló:`, error.status || error.message);
          lastError = error;
          continue; // Intentar siguiente modelo
        }
      }

      // Si ningún modelo de OpenAI funcionó, intentar con Claude como último recurso
      if (!generatedCode && anthropic) {
        console.log("⚠️ Todos los modelos de OpenAI fallaron, intentando Claude...");
        
        try {
          const response = await anthropic.messages.create({
            model: "claude-3-5-sonnet-20240620",
            max_tokens: 4000,
            system: SYSTEM_PROMPT,
            messages: [
              ...(context?.previousMessages?.map(m => ({
                role: m.role as "user" | "assistant",
                content: m.content,
              })) || []),
              { role: "user", content: fullPrompt },
            ],
          });

          const textContent = response.content.find(c => c.type === "text");
          const rawResponse = textContent?.type === "text" ? textContent.text : "";
          const jsonMatch = rawResponse.match(/```json\n([\s\S]*?)\n```/) || 
                           rawResponse.match(/\{[\s\S]*"files"[\s\S]*\}/);
          
          generatedCode = jsonMatch ? JSON.parse(jsonMatch[1] || jsonMatch[0]) : JSON.parse(rawResponse);
          modelUsed = "Claude 3.5 Sonnet (fallback desde OpenAI)";

        } catch (claudeError: any) {
          throw new Error(
            `Ningún modelo de IA está disponible:\n\n` +
            `Último error OpenAI: ${lastError?.message || 'Desconocido'}\n` +
            `Error Claude: ${claudeError.message}\n\n` +
            `SOLUCIÓN:\n` +
            `1. Verifica tu OpenAI API key tenga créditos\n` +
            `2. Verifica acceso en: https://platform.openai.com/settings/organization/limits\n` +
            `3. O verifica tu ANTHROPIC_API_KEY en .env.local`
          );
        }
      } else if (!generatedCode) {
        throw lastError || new Error("No se pudo generar código con ningún modelo");
      }
    }

    // 5. Validar estructura del response
    if (!generatedCode.files || !Array.isArray(generatedCode.files)) {
      throw new Error("Invalid AI response format");
    }

    // 6. Descontar créditos usando el cliente autenticado
    const { error: transactionError } = await supabase.from("credit_transactions").insert({
      wallet_id: wallet.id,
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

    if (transactionError) {
      console.error("⚠️ Error registrando transacción:", transactionError);
      // No bloqueamos la generación si falla el registro, solo logueamos
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
    console.error("❌ Error in /api/ai/generate:", error);
    
    // Errores específicos de OpenAI
    if (error.status === 401 || error.status === 403) {
      return res.status(500).json({
        success: false,
        error: `Error de autenticación con OpenAI:\n\n` +
               `1. Verifica tu API key en .env.local\n` +
               `2. Agrega créditos en: https://platform.openai.com/settings/organization/billing\n` +
               `3. Verifica acceso a modelos en: https://platform.openai.com/settings/organization/limits\n\n` +
               `Error técnico: ${error.message}`,
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
      error: error.message || "Error interno del servidor durante la generación de código",
    });
  }
}
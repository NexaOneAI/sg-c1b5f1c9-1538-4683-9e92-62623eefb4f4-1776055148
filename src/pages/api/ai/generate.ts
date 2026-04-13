import type { NextApiRequest, NextApiResponse } from "next";
import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import { createServerSupabaseClient } from "@/lib/supabase-server";

// Inicializar clientes IA
const openai = process.env.OPENAI_API_KEY 
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

const anthropic = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null;

// Sistema de prompt
const SYSTEM_PROMPT = `Eres un asistente de IA experto en desarrollo web con Next.js, React y TypeScript.

INSTRUCCIONES CRÍTICAS:
1. Genera código completo, funcional y listo para producción
2. Usa TypeScript estricto con tipos correctos
3. Sigue las mejores prácticas de React y Next.js
4. Usa Tailwind CSS para estilos
5. SIEMPRE responde con JSON válido en este formato exacto:

{
  "message": "Explicación breve de lo que hiciste",
  "files": [
    {
      "path": "ruta/completa/del/archivo.tsx",
      "content": "contenido completo del archivo",
      "action": "create" | "update" | "delete"
    }
  ]
}

NO uses markdown, NO agregues explicaciones fuera del JSON.`;

// Tipos
type AIModel = "claude_sonnet" | "claude_opus" | "gpt4" | "gpt3";

interface GenerateRequest {
  projectId: string;
  userId: string;
  prompt: string;
  model?: AIModel;
  context?: {
    files?: Array<{ path: string; content: string }>;
    previousMessages?: Array<{ role: string; content: string }>;
  };
}

interface GenerateResponse {
  success: boolean;
  data?: {
    message: string;
    files: Array<{
      path: string;
      content: string;
      action: "create" | "update" | "delete";
    }>;
    creditsUsed: number;
    modelUsed: string;
  };
  error?: string;
}

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
    // Crear cliente Supabase
    const supabase = createServerSupabaseClient(req);

    // 1. Obtener costos
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

    // 2. Verificar créditos
    const { data: wallet, error: walletError } = await supabase
      .from("credit_wallets")
      .select("id, balance")
      .eq("user_id", userId)
      .single();

    if (walletError || !wallet) {
      return res.status(402).json({
        success: false,
        error: "No se pudo verificar tu saldo de créditos.",
      });
    }

    const currentBalance = Number(wallet.balance) || 0;
    
    if (currentBalance < generationCost) {
      return res.status(402).json({
        success: false,
        error: `Créditos insuficientes. Necesitas ${generationCost} créditos, tienes ${currentBalance}.`,
      });
    }

    // 3. Construir prompt
    const contextStr = context?.files
      ? `\n\nARCHIVOS ACTUALES:\n${context.files.map(f => `\n--- ${f.path} ---\n${f.content}`).join("\n")}`
      : "";

    const fullPrompt = `${prompt}${contextStr}`;

    // 4. GENERAR CON TODOS LOS MODELOS DISPONIBLES (AUTO-FALLBACK)
    let generatedCode;
    let modelUsed = "";

    // Lista de modelos de OpenAI que SÍ están disponibles en la cuenta del usuario
    const OPENAI_MODELS = [
      "gpt-5.2",       // Modelo solicitado por el usuario
      "gpt-4o",        // Fallback 1
      "gpt-4.1",       // Fallback 2
      "o3",            // Fallback 3
      "o3-mini",       // Fallback 4
    ];

    // Lista de modelos de Claude a intentar
    const CLAUDE_MODELS = [
      "claude-4.6",    // Modelo solicitado por el usuario
      "claude-3-opus-20240229",     // Fallback 1
      "claude-3-sonnet-20240229",   // Fallback 2
      "claude-3-haiku-20240307",    // Fallback 3
    ];

    let lastError: any = null;

    // ESTRATEGIA: Probar primero OpenAI (el usuario tiene modelos disponibles)
    if (openai) {
      for (const openaiModel of OPENAI_MODELS) {
        try {
          console.log(`🤖 Probando OpenAI: ${openaiModel}`);

          const messages: OpenAI.ChatCompletionMessageParam[] = [
            { role: "system", content: SYSTEM_PROMPT },
            ...(context?.previousMessages?.map(m => ({
              role: m.role as "system" | "user" | "assistant",
              content: m.content,
            })) || []),
            { role: "user", content: fullPrompt },
          ];

          const completion = await openai.chat.completions.create({
            model: openaiModel,
            messages,
            temperature: 0.7,
            max_tokens: 4000,
          });

          generatedCode = JSON.parse(completion.choices[0].message.content || "{}");
          modelUsed = `OpenAI (${openaiModel})`;
          
          console.log(`✅ ${openaiModel} funcionó!`);
          break; // Salir si funcionó

        } catch (error: any) {
          console.log(`❌ ${openaiModel} falló:`, error.status, error.message);
          lastError = error;
          continue; // Probar siguiente modelo
        }
      }
    }

    // SI OPENAI FALLÓ, INTENTAR CLAUDE
    if (!generatedCode && anthropic) {
      for (const claudeModel of CLAUDE_MODELS) {
        try {
          console.log(`🤖 Probando Claude: ${claudeModel}`);

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
          
          const jsonMatch = rawResponse.match(/```json\n([\s\S]*?)\n```/) || 
                           rawResponse.match(/\{[\s\S]*"files"[\s\S]*\}/);
          
          generatedCode = jsonMatch ? JSON.parse(jsonMatch[1] || jsonMatch[0]) : JSON.parse(rawResponse);
          modelUsed = `Claude (${claudeModel})`;
          
          console.log(`✅ ${claudeModel} funcionó!`);
          break; // Salir si funcionó

        } catch (error: any) {
          console.log(`❌ ${claudeModel} falló:`, error.status, error.message);
          lastError = error;
          continue; // Probar siguiente modelo
        }
      }
    }

    // SI NINGUNO FUNCIONÓ
    if (!generatedCode) {
      throw new Error(
        `❌ NINGÚN MODELO DE IA DISPONIBLE\n\n` +
        `Último error: ${lastError?.message || "Desconocido"}\n\n` +
        `Modelos probados:\n` +
        `OpenAI: ${OPENAI_MODELS.join(", ")}\n` +
        `Claude: ${CLAUDE_MODELS.join(", ")}\n\n` +
        `SOLUCIÓN:\n` +
        `1. Verifica que tus API keys tengan créditos\n` +
        `2. Claude: https://console.anthropic.com/settings/plans\n` +
        `3. OpenAI: https://platform.openai.com/settings/organization/billing\n` +
        `4. Reinicia el servidor después de agregar créditos`
      );
    }

    // 5. Guardar archivos en Supabase
    for (const file of generatedCode.files || []) {
      const { error: fileError } = await supabase.from("project_files" as any).upsert(
        {
          project_id: projectId,
          file_path: file.path,
          file_name: file.path.split('/').pop() || "file",
          version_id: "draft",
          content: file.content,
          updated_at: new Date().toISOString(),
        } as any,
        {
          onConflict: "project_id,file_path" as any,
        }
      );

      if (fileError) {
        console.error("Error guardando archivo:", fileError);
      }
    }

    // 6. Descontar créditos
    const { error: deductError } = await (supabase.rpc as any)("deduct_credits", {
      p_user_id: userId,
      p_amount: generationCost,
      p_description: `Generación con ${modelUsed}`,
    });

    if (deductError) {
      console.error("Error descontando créditos:", deductError);
    }

    // 7. Guardar mensaje en conversación
    await supabase.from("messages" as any).insert([
      {
        conversation_id: projectId,
        role: "user",
        content: prompt,
      } as any,
      {
        conversation_id: projectId,
        role: "assistant",
        content: generatedCode.message || "Código generado exitosamente",
        metadata: {
          model: modelUsed,
          creditsUsed: generationCost,
          filesGenerated: generatedCode.files?.length || 0,
        },
      } as any,
    ]);

    // 8. Respuesta exitosa
    return res.status(200).json({
      success: true,
      data: {
        message: generatedCode.message || "Código generado exitosamente",
        files: generatedCode.files || [],
        creditsUsed: generationCost,
        modelUsed,
      },
    });

  } catch (error: any) {
    console.error("❌ Error en generación:", error);
    
    return res.status(500).json({
      success: false,
      error: error.message || "Error generando código",
    });
  }
}
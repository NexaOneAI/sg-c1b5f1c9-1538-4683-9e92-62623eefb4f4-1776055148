import type { NextApiRequest, NextApiResponse } from "next";
import OpenAI from "openai";

/**
 * Endpoint de Diagnóstico: /api/test-openai
 * 
 * Prueba directa de la conexión con OpenAI para diagnosticar problemas
 */

type TestResponse = {
  success: boolean;
  message: string;
  details?: {
    hasApiKey: boolean;
    apiKeyFormat: string;
    apiKeyLength: number;
    openaiResponse?: any;
    error?: any;
  };
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<TestResponse>
) {
  try {
    // 1. Verificar que existe la API key
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        success: false,
        message: "❌ OPENAI_API_KEY no está configurada en .env.local",
        details: {
          hasApiKey: false,
          apiKeyFormat: "N/A",
          apiKeyLength: 0,
        },
      });
    }

    // 2. Verificar formato de la API key
    const apiKeyFormat = apiKey.startsWith("sk-proj-") 
      ? "✅ Formato nuevo (sk-proj-...)" 
      : apiKey.startsWith("sk-")
      ? "⚠️ Formato antiguo (sk-...)"
      : "❌ Formato inválido";

    console.log("🔍 Diagnóstico OpenAI:");
    console.log("- API Key presente:", !!apiKey);
    console.log("- API Key formato:", apiKeyFormat);
    console.log("- API Key length:", apiKey.length);
    console.log("- API Key primeros 10 chars:", apiKey.substring(0, 10));
    console.log("- API Key últimos 5 chars:", apiKey.substring(apiKey.length - 5));

    // 3. Crear cliente OpenAI
    const openai = new OpenAI({
      apiKey: apiKey,
    });

    // 4. Probar con el modelo más básico (GPT-3.5 Turbo)
    console.log("🧪 Probando conexión con GPT-3.5 Turbo...");
    
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "Responde solo con la palabra OK" },
        { role: "user", content: "Test" },
      ],
      max_tokens: 10,
      temperature: 0,
    });

    console.log("✅ Respuesta de OpenAI recibida:", completion.choices[0].message.content);

    // 5. Si llegamos aquí, todo funciona
    return res.status(200).json({
      success: true,
      message: "✅ Conexión con OpenAI exitosa! La API key funciona correctamente.",
      details: {
        hasApiKey: true,
        apiKeyFormat,
        apiKeyLength: apiKey.length,
        openaiResponse: {
          model: completion.model,
          response: completion.choices[0].message.content,
          usage: completion.usage,
        },
      },
    });

  } catch (error: any) {
    console.error("❌ Error en test de OpenAI:", error);

    // Analizar el tipo de error
    let errorMessage = "Error desconocido";
    let errorDetails = {};

    if (error.status === 401) {
      errorMessage = "❌ API Key inválida o revocada. Crea una nueva en OpenAI.";
      errorDetails = {
        error: "401 Unauthorized",
        solution: "1. Ve a https://platform.openai.com/api-keys\n2. Elimina la key antigua\n3. Crea una NUEVA key\n4. Cópiala COMPLETA\n5. Pégala en .env.local",
      };
    } else if (error.status === 403) {
      errorMessage = "❌ Sin acceso a modelos. Verifica créditos y permisos en OpenAI.";
      errorDetails = {
        error: "403 Forbidden",
        solution: "1. Ve a https://platform.openai.com/settings/organization/billing\n2. Verifica que tengas balance > $0\n3. Ve a https://platform.openai.com/settings/organization/limits\n4. Verifica que gpt-3.5-turbo esté disponible",
      };
    } else if (error.status === 429) {
      errorMessage = "❌ Rate limit excedido. Espera 1 minuto.";
      errorDetails = {
        error: "429 Too Many Requests",
        solution: "Espera 60 segundos e intenta nuevamente",
      };
    } else {
      errorMessage = `❌ Error: ${error.message}`;
      errorDetails = {
        error: error.status || "Unknown",
        message: error.message,
        code: error.code,
      };
    }

    return res.status(500).json({
      success: false,
      message: errorMessage,
      details: {
        hasApiKey: !!process.env.OPENAI_API_KEY,
        apiKeyFormat: process.env.OPENAI_API_KEY?.startsWith("sk-proj-") 
          ? "✅ Formato nuevo (sk-proj-...)" 
          : process.env.OPENAI_API_KEY?.startsWith("sk-")
          ? "⚠️ Formato antiguo (sk-...)"
          : "❌ Formato inválido",
        apiKeyLength: process.env.OPENAI_API_KEY?.length || 0,
        error: errorDetails,
      },
    });
  }
}
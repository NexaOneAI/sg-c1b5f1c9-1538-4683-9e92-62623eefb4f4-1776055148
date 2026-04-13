import type { NextApiRequest, NextApiResponse } from "next";
import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const results: any = {
    timestamp: new Date().toISOString(),
    openai: {
      hasKey: !!process.env.OPENAI_API_KEY,
      keyLength: process.env.OPENAI_API_KEY?.length || 0,
      models: {},
    },
    anthropic: {
      hasKey: !!process.env.ANTHROPIC_API_KEY,
      keyLength: process.env.ANTHROPIC_API_KEY?.length || 0,
      models: {},
    },
  };

  // Probar OpenAI
  if (process.env.OPENAI_API_KEY) {
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const openaiModels = [
      "gpt-4o",
      "gpt-4o-mini",
      "gpt-4-turbo",
      "gpt-4",
      "gpt-3.5-turbo",
      "gpt-3.5-turbo-16k",
      "gpt-4-turbo-preview",
      "gpt-4-0125-preview",
    ];

    for (const model of openaiModels) {
      try {
        const response = await openai.chat.completions.create({
          model: model,
          messages: [{ role: "user", content: "test" }],
          max_tokens: 5,
        });
        results.openai.models[model] = {
          status: "✅ FUNCIONA",
          response: response.choices[0].message.content,
        };
      } catch (error: any) {
        results.openai.models[model] = {
          status: `❌ ${error.status || "ERROR"}`,
          error: error.message,
        };
      }
    }
  }

  // Probar Anthropic
  if (process.env.ANTHROPIC_API_KEY) {
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    const claudeModels = [
      "claude-3-5-sonnet-20241022",
      "claude-3-5-sonnet-20240620",
      "claude-3-sonnet-20240229",
      "claude-3-opus-20240229",
      "claude-3-haiku-20240307",
      "claude-2.1",
      "claude-2.0",
    ];

    for (const model of claudeModels) {
      try {
        const response = await anthropic.messages.create({
          model: model,
          max_tokens: 10,
          messages: [{ role: "user", content: "test" }],
        });
        results.anthropic.models[model] = {
          status: "✅ FUNCIONA",
          response: response.content[0],
        };
      } catch (error: any) {
        results.anthropic.models[model] = {
          status: `❌ ${error.status || "ERROR"}`,
          error: error.error?.error?.message || error.message,
        };
      }
    }
  }

  return res.status(200).json(results);
}
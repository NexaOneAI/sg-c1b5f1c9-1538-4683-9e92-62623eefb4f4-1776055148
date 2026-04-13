import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/integrations/supabase/client";

/**
 * API Route: /api/payments/create
 * 
 * Crea una preferencia de pago en Mercado Pago.
 * 
 * FLUJO:
 * 1. Usuario selecciona un plan (Pro/Premium)
 * 2. Se crea la preferencia de pago
 * 3. Usuario es redirigido a Mercado Pago
 * 4. Completa el pago
 * 5. Mercado Pago notifica vía webhook
 * 6. Se activa el plan y asignan créditos
 */

type CreatePaymentRequest = {
  userId: string;
  plan: "pro" | "premium";
  email: string;
};

type CreatePaymentResponse = {
  success: boolean;
  initPoint?: string;
  error?: string;
};

const PLAN_PRICES = {
  pro: {
    price: 29.99,
    credits: 1000,
    title: "Plan Pro",
    description: "1000 créditos mensuales + 50 proyectos",
  },
  premium: {
    price: 99.99,
    credits: -1, // Ilimitado
    title: "Plan Premium",
    description: "Créditos ilimitados + Proyectos ilimitados + Soporte prioritario",
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<CreatePaymentResponse>
) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  const { userId, plan, email }: CreatePaymentRequest = req.body;

  if (!userId || !plan || !email) {
    return res.status(400).json({
      success: false,
      error: "Missing required fields: userId, plan, email",
    });
  }

  if (!PLAN_PRICES[plan]) {
    return res.status(400).json({
      success: false,
      error: "Invalid plan. Must be 'pro' or 'premium'",
    });
  }

  try {
    const planData = PLAN_PRICES[plan];

    // Crear preferencia de pago en Mercado Pago
    const preference = {
      items: [
        {
          title: planData.title,
          description: planData.description,
          quantity: 1,
          currency_id: "USD",
          unit_price: planData.price,
        },
      ],
      payer: {
        email,
      },
      back_urls: {
        success: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard?payment=success`,
        failure: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/pricing?payment=failure`,
        pending: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard?payment=pending`,
      },
      auto_return: "approved" as const,
      notification_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/payments/webhook`,
      metadata: {
        user_id: userId,
        plan,
        credits: planData.credits,
      },
    };

    const response = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}`,
      },
      body: JSON.stringify(preference),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error("Mercado Pago error:", error);
      throw new Error("Failed to create payment preference");
    }

    const data = await response.json();

    // Registrar intento de pago en la base de datos
    await supabase.from("payments").insert({
      user_id: userId,
      amount: planData.price,
      currency: "USD",
      status: "pending",
      payment_method: "mercadopago",
      plan_type: plan,
      metadata: {
        preference_id: data.id,
        init_point: data.init_point,
      },
    });

    return res.status(200).json({
      success: true,
      initPoint: data.init_point,
    });
  } catch (error: any) {
    console.error("Error in /api/payments/create:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Internal server error during payment creation",
    });
  }
}
import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/integrations/supabase/client";

/**
 * API Route: /api/payments/webhook
 * 
 * Recibe notificaciones de Mercado Pago cuando un pago es procesado.
 * 
 * FLUJO:
 * 1. Mercado Pago envía notificación
 * 2. Se verifica el estado del pago
 * 3. Si está aprobado:
 *    - Se actualiza la tabla payments
 *    - Se crea/actualiza la suscripción
 *    - Se asignan los créditos
 *    - Se actualiza el plan del usuario
 */

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const notification = req.body;

    // Mercado Pago envía diferentes tipos de notificaciones
    if (notification.type !== "payment") {
      return res.status(200).json({ received: true });
    }

    const paymentId = notification.data.id;

    // Obtener detalles del pago desde Mercado Pago
    const response = await fetch(
      `https://api.mercadopago.com/v1/payments/${paymentId}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch payment details");
    }

    const payment = await response.json();

    // Solo procesar pagos aprobados
    if (payment.status !== "approved") {
      return res.status(200).json({ received: true });
    }

    const userId = payment.metadata.user_id;
    const plan = payment.metadata.plan as "pro" | "premium";
    const credits = parseInt(payment.metadata.credits);

    // Actualizar registro de pago
    await supabase
      .from("payments")
      .update({
        status: "completed",
        provider_payment_id: paymentId.toString(),
        metadata: {
          ...payment.metadata,
          payment_details: payment,
          plan_type: plan,
        },
      })
      .eq("user_id", userId)
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(1);

    // Crear o actualizar suscripción
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 1);

    const { data: existingSub } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (existingSub) {
      await supabase
        .from("subscriptions")
        .update({
          plan_type: plan,
          status: "active",
          started_at: startDate.toISOString(),
          expires_at: endDate.toISOString(),
          auto_renew: true,
        })
        .eq("user_id", userId);
    } else {
      await supabase.from("subscriptions").insert({
        user_id: userId,
        plan_type: plan,
        status: "active",
        started_at: startDate.toISOString(),
        expires_at: endDate.toISOString(),
        auto_renew: true,
      });
    }

    // Asignar créditos
    const { data: wallet } = await supabase
      .from("credit_wallets")
      .select("id, balance")
      .eq("user_id", userId)
      .single();

    if (wallet) {
      // Para plan premium, asignar 999999 créditos (prácticamente ilimitado)
      const creditsToAdd = credits === -1 ? 999999 : credits;

      await supabase.from("credit_transactions").insert({
        wallet_id: wallet.id,
        user_id: userId,
        amount: creditsToAdd,
        type: "purchase",
        description: `Compra de plan ${plan.toUpperCase()} - ${creditsToAdd === 999999 ? "Ilimitado" : creditsToAdd + " créditos"}`,
        metadata: {
          payment_id: paymentId,
          plan,
        },
      });

      // Actualizar perfil (marcar unlimited_credits si es premium)
      const isUnlimited = plan === "premium";
      await supabase
        .from("profiles")
        .update({ 
          unlimited_credits: isUnlimited,
        })
        .eq("id", userId);
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error in /api/payments/webhook:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
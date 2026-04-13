import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Check } from "lucide-react";
import { Logo } from "@/components/Logo";
import Link from "next/link";
import { useRouter } from "next/router";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function PricingPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState<string | null>(null);

  const handleSelectPlan = async (plan: "free" | "pro" | "premium") => {
    try {
      setLoading(plan);

      // Obtener sesión actual
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        toast({
          title: "Autenticación requerida",
          description: "Debes iniciar sesión para comprar un plan",
          variant: "destructive",
        });
        router.push("/auth/login?redirect=/pricing");
        return;
      }

      if (plan === "free") {
        // Plan free: redirigir al dashboard
        router.push("/dashboard");
        return;
      }

      // Obtener email del usuario
      const { data: profile } = await supabase
        .from("profiles")
        .select("email")
        .eq("id", session.user.id)
        .single();

      // Crear preferencia de pago
      const response = await fetch("/api/payments/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: session.user.id,
          plan,
          email: profile?.email || session.user.email,
        }),
      });

      const data = await response.json();

      if (!data.success || !data.initPoint) {
        throw new Error(data.error || "Error al crear el pago");
      }

      // Redirigir a Mercado Pago
      window.location.href = data.initPoint;

    } catch (error: any) {
      console.error("Error selecting plan:", error);
      toast({
        title: "Error",
        description: error.message || "No se pudo procesar el pago",
        variant: "destructive",
      });
    } finally {
      setLoading(null);
    }
  };

  const plans = [
    {
      id: "free",
      name: "Free",
      price: "$0",
      period: "/mes",
      description: "Perfecto para comenzar",
      features: [
        "100 créditos mensuales",
        "3 proyectos activos",
        "GPT-4 Turbo",
        "Preview en tiempo real",
        "Versiones básicas",
        "Soporte comunitario",
      ],
      cta: "Comenzar Gratis",
      popular: false,
    },
    {
      id: "pro",
      name: "Pro",
      price: "$29.99",
      period: "/mes",
      description: "Para desarrolladores serios",
      features: [
        "1,000 créditos mensuales",
        "50 proyectos activos",
        "GPT-4 + Claude 3.5 Sonnet",
        "Preview en tiempo real",
        "Historial ilimitado de versiones",
        "Deploy a Vercel",
        "Soporte por email",
      ],
      cta: "Activar Pro",
      popular: true,
    },
    {
      id: "premium",
      name: "Premium",
      price: "$99.99",
      period: "/mes",
      description: "Máxima potencia",
      features: [
        "Créditos ilimitados",
        "Proyectos ilimitados",
        "Todos los modelos IA (GPT-4, Claude Opus)",
        "Preview en tiempo real",
        "Historial ilimitado",
        "Deploy automático",
        "Soporte prioritario 24/7",
        "Early access a nuevas features",
      ],
      cta: "Activar Premium",
      popular: false,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border/50 backdrop-blur-sm bg-background/80">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" asChild>
                <Link href="/">
                  <ArrowLeft className="h-4 w-4" />
                </Link>
              </Button>
              <Logo size="sm" />
            </div>
            <div className="flex items-center gap-4">
              <Button variant="ghost" asChild>
                <Link href="/auth/login">Iniciar Sesión</Link>
              </Button>
              <Button className="cyber-gradient" asChild>
                <Link href="/auth/register">Registrarse</Link>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 neon-text-primary">
            Planes Simples, Poder Ilimitado
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Elige el plan perfecto para tu flujo de trabajo. Actualiza o cancela en cualquier momento.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {plans.map((plan) => {
            const Icon = plan.icon;
            return (
              <Card
                key={plan.name}
                className={`glass-panel border-border/50 relative ${
                  plan.popular ? "border-primary/50 shadow-lg shadow-primary/20" : ""
                }`}
              >
                {plan.popular && (
                  <Badge className="cyber-gradient absolute -top-3 left-1/2 -translate-x-1/2">
                    Más Popular
                  </Badge>
                )}
                
                <CardHeader>
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`p-3 rounded-lg ${
                      plan.popular ? "cyber-gradient" : "bg-primary/10"
                    }`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl">{plan.name}</CardTitle>
                      <CardDescription>{plan.description}</CardDescription>
                    </div>
                  </div>
                  
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold neon-text-primary">{plan.price}</span>
                    <span className="text-muted-foreground">{plan.period}</span>
                  </div>
                  
                  <p className="text-sm text-muted-foreground mt-2">{plan.credits}</p>
                </CardHeader>

                <CardContent>
                  <ul className="space-y-3">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-3">
                        <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>

                <CardFooter>
                  <Button
                    onClick={() => handleSelectPlan(plan.id as "free" | "pro" | "premium")}
                    disabled={loading !== null}
                    className={plan.popular 
                      ? "w-full bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity"
                      : "w-full"
                    }
                  >
                    {loading === plan.id ? "Procesando..." : plan.cta}
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>

        <div className="text-center">
          <p className="text-sm text-muted-foreground mb-4">
            ¿Necesitas más de 1,000 proyectos? ¿Facturación personalizada?
          </p>
          <Button variant="outline" size="lg">
            Contáctanos para Enterprise
          </Button>
        </div>
      </main>
    </div>
  );
}
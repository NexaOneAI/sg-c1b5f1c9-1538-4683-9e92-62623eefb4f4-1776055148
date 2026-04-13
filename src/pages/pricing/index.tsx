import Link from "next/link";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Sparkles, Zap, Rocket, ArrowLeft } from "lucide-react";

export default function PricingPage() {
  const plans = [
    {
      name: "Free",
      description: "Perfecto para empezar",
      price: "$0",
      period: "/mes",
      credits: "100 créditos mensuales",
      icon: Sparkles,
      features: [
        "100 créditos por mes",
        "3 proyectos máximo",
        "Vista previa en tiempo real",
        "Generación básica de código",
        "Soporte por email",
      ],
      cta: "Comenzar Gratis",
      popular: false,
    },
    {
      name: "Pro",
      description: "Para creadores serios",
      price: "$29",
      period: "/mes",
      credits: "1,000 créditos mensuales",
      icon: Zap,
      features: [
        "1,000 créditos por mes",
        "50 proyectos máximo",
        "Todas las funciones Free",
        "Exportación de código",
        "Control de versiones completo",
        "Prioridad en soporte",
        "Integraciones avanzadas",
      ],
      cta: "Actualizar a Pro",
      popular: true,
    },
    {
      name: "Premium",
      description: "Sin límites",
      price: "$99",
      period: "/mes",
      credits: "Créditos ilimitados",
      icon: Rocket,
      features: [
        "Créditos ilimitados",
        "Proyectos ilimitados",
        "Todas las funciones Pro",
        "API access",
        "Whitelabel disponible",
        "Soporte prioritario 24/7",
        "Asistencia personalizada",
        "Early access a features",
      ],
      cta: "Comenzar Premium",
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
                    className={`w-full ${plan.popular ? "cyber-gradient" : ""}`}
                    variant={plan.popular ? "default" : "outline"}
                    asChild
                  >
                    <Link href="/auth/register">{plan.cta}</Link>
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
import { useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { supabase } from "@/integrations/supabase/client";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, Zap, Code2, Rocket, Shield, Clock } from "lucide-react";

export default function LandingPage() {
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      router.push("/dashboard");
    }
  }

  const features = [
    {
      icon: Sparkles,
      title: "IA Generativa",
      description: "Crea aplicaciones completas con comandos en lenguaje natural",
    },
    {
      icon: Code2,
      title: "Código Real",
      description: "Genera componentes, páginas y estructura profesional lista para producción",
    },
    {
      icon: Zap,
      title: "Vista Previa Instantánea",
      description: "Visualiza cambios en tiempo real mientras construyes",
    },
    {
      icon: Clock,
      title: "Control de Versiones",
      description: "Historial completo de cambios con opción de restaurar versiones",
    },
    {
      icon: Rocket,
      title: "Deploy Automático",
      description: "Publica tu aplicación con un solo clic en Netlify",
    },
    {
      icon: Shield,
      title: "Seguro y Escalable",
      description: "Arquitectura premium con Supabase y autenticación robusta",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border/50 backdrop-blur-sm bg-background/80 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Logo size="sm" />
            <div className="flex gap-4">
              <Button variant="ghost" asChild>
                <Link href="/auth/login">Iniciar Sesión</Link>
              </Button>
              <Button className="cyber-gradient hover:opacity-90" asChild>
                <Link href="/auth/register">Comenzar Gratis</Link>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <main>
        <section className="relative py-20 sm:py-32 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
          
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
            <div className="text-center max-w-3xl mx-auto">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8 animate-slide-in">
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Plataforma AI App Builder Premium</span>
              </div>
              
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-display font-bold mb-6 animate-slide-in">
                Crea Aplicaciones Web con{" "}
                <span className="cyber-gradient-text">Inteligencia Artificial</span>
              </h1>
              
              <p className="text-xl text-muted-foreground mb-12 animate-slide-in">
                Describe lo que quieres construir y Nexa One lo genera para ti. Código real, preview en vivo, deploy automático.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-in">
                <Button size="lg" className="cyber-gradient hover:opacity-90 text-lg px-8" asChild>
                  <Link href="/auth/register">
                    <Rocket className="mr-2 h-5 w-5" />
                    Comenzar Gratis
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="text-lg px-8" asChild>
                  <Link href="#features">Ver Características</Link>
                </Button>
              </div>
              
              <p className="text-sm text-muted-foreground mt-6">
                100 créditos gratis al registrarte • Sin tarjeta de crédito
              </p>
            </div>
          </div>
        </section>

        <section id="features" className="py-20 sm:py-32">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-display font-bold mb-4">
                Todo lo que necesitas para construir
              </h2>
              <p className="text-lg text-muted-foreground">
                Herramientas profesionales para crear aplicaciones web modernas
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <Card key={index} className="glass-panel border-border/50 hover:border-primary/30 transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="rounded-lg bg-primary/10 w-12 h-12 flex items-center justify-center mb-4">
                      <feature.icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 sm:py-32 bg-gradient-to-b from-primary/5 to-transparent">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl sm:text-4xl font-display font-bold mb-6">
              ¿Listo para crear algo increíble?
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Únete a los desarrolladores que ya están construyendo el futuro con IA
            </p>
            <Button size="lg" className="cyber-gradient hover:opacity-90 text-lg px-8" asChild>
              <Link href="/auth/register">
                <Sparkles className="mr-2 h-5 w-5" />
                Comenzar Ahora - 100 Créditos Gratis
              </Link>
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t border-border/50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <Logo size="sm" />
            <p className="text-sm text-muted-foreground">
              © 2026 Nexa One. Powered by AI.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
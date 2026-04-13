import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { supabase } from "@/integrations/supabase/client";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Zap, Code2, Rocket, Shield, Clock, ArrowRight, Star, Cpu, Layers, Globe } from "lucide-react";

export default function LandingPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    checkAuth();
    createParticles();
  }, []);

  async function checkAuth() {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      router.push("/dashboard");
    }
  }

  function createParticles() {
    const container = document.getElementById("particles-container");
    if (!container) return;

    // Crear 50 partículas flotantes
    for (let i = 0; i < 50; i++) {
      const particle = document.createElement("div");
      particle.className = "particle";
      particle.style.left = `${Math.random() * 100}%`;
      particle.style.animationDelay = `${Math.random() * 10}s`;
      particle.style.animationDuration = `${10 + Math.random() * 10}s`;
      container.appendChild(particle);
    }
  }

  const features = [
    {
      icon: Sparkles,
      title: "IA Generativa Avanzada",
      description: "Construye aplicaciones completas con comandos en lenguaje natural. GPT-4 y Claude a tu servicio.",
      gradient: "from-purple-500 to-pink-500",
    },
    {
      icon: Code2,
      title: "Código Listo para Producción",
      description: "Genera componentes React, páginas Next.js y estructura profesional con las mejores prácticas.",
      gradient: "from-cyan-500 to-blue-500",
    },
    {
      icon: Zap,
      title: "Vista Previa en Tiempo Real",
      description: "Visualiza cada cambio instantáneamente mientras la IA construye tu aplicación paso a paso.",
      gradient: "from-yellow-500 to-orange-500",
    },
    {
      icon: Clock,
      title: "Control Total de Versiones",
      description: "Historial completo de cambios con capacidad de restaurar cualquier versión anterior.",
      gradient: "from-green-500 to-emerald-500",
    },
    {
      icon: Rocket,
      title: "Deploy con Un Click",
      description: "Publica tu aplicación en Vercel automáticamente sin configuración adicional.",
      gradient: "from-indigo-500 to-purple-500",
    },
    {
      icon: Shield,
      title: "Arquitectura Enterprise",
      description: "Infraestructura segura con Supabase, autenticación robusta y escalabilidad garantizada.",
      gradient: "from-red-500 to-pink-500",
    },
  ];

  const stats = [
    { value: "10K+", label: "Aplicaciones Creadas", icon: Globe },
    { value: "5K+", label: "Desarrolladores Activos", icon: Cpu },
    { value: "99.9%", label: "Uptime Garantizado", icon: Shield },
    { value: "24/7", label: "Soporte IA Disponible", icon: Star },
  ];

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Particles Background */}
      <div id="particles-container" className="particles-bg" />
      
      {/* Animated Grid Background */}
      <div className="fixed inset-0 cyber-grid bg-grid opacity-20 pointer-events-none" />
      
      {/* Gradient Orbs */}
      <div className="fixed top-0 left-0 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px] -translate-x-1/2 -translate-y-1/2 animate-pulse" />
      <div className="fixed bottom-0 right-0 w-[600px] h-[600px] bg-accent/20 rounded-full blur-[120px] translate-x-1/2 translate-y-1/2 animate-pulse delay-1000" />

      {/* Navigation */}
      <nav className="border-b border-border/50 backdrop-blur-xl bg-background/60 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Logo size="sm" />
            <div className="flex gap-3">
              <Button variant="ghost" asChild className="hover:bg-primary/10">
                <Link href="/auth/login">Iniciar Sesión</Link>
              </Button>
              <Button className="cyber-gradient hover:opacity-90 shadow-glow" asChild>
                <Link href="/auth/register">
                  Comenzar Gratis
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <main className="relative z-10">
        {/* Hero Section */}
        <section className="relative py-20 sm:py-32 lg:py-40 overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-4xl mx-auto">
              {/* Badge */}
              <div 
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8 animate-slide-in backdrop-blur-sm"
                style={{ animationDelay: "0.1s" }}
              >
                <Sparkles className="h-4 w-4 text-primary animate-spin-slow" />
                <span className="text-sm font-medium bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  Powered by GPT-4 & Claude AI
                </span>
              </div>
              
              {/* Heading */}
              <h1 
                className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-display font-bold mb-6 animate-slide-in leading-tight"
                style={{ animationDelay: "0.2s" }}
              >
                Crea Apps Web con{" "}
                <span className="relative inline-block">
                  <span className="relative z-10 bg-gradient-to-r from-primary via-purple-400 to-accent bg-clip-text text-transparent animate-gradient-xy">
                    Inteligencia Artificial
                  </span>
                  <span className="absolute inset-0 blur-2xl bg-gradient-to-r from-primary/50 to-accent/50 -z-10" />
                </span>
              </h1>
              
              {/* Subheading */}
              <p 
                className="text-xl sm:text-2xl text-muted-foreground mb-12 max-w-3xl mx-auto leading-relaxed animate-slide-in"
                style={{ animationDelay: "0.3s" }}
              >
                Describe tu visión en lenguaje natural y Nexa One la transforma en código real, 
                con preview instantáneo y deploy automático.
              </p>
              
              {/* CTA Buttons */}
              <div 
                className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-in"
                style={{ animationDelay: "0.4s" }}
              >
                <Button 
                  size="lg" 
                  className="cyber-gradient hover:opacity-90 text-lg px-8 py-6 shadow-glow-lg group relative overflow-hidden" 
                  asChild
                >
                  <Link href="/auth/register">
                    <span className="relative z-10 flex items-center">
                      <Rocket className="mr-2 h-5 w-5 group-hover:translate-y-[-2px] transition-transform" />
                      Comenzar Gratis - 100 Créditos
                    </span>
                    <span className="absolute inset-0 bg-gradient-to-r from-primary/20 to-accent/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="text-lg px-8 py-6 border-primary/30 hover:bg-primary/10 hover:border-primary/50 backdrop-blur-sm" 
                  asChild
                >
                  <Link href="#features">
                    Ver Demo en Vivo
                    <Layers className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              </div>
              
              {/* Trust Indicators */}
              <div 
                className="mt-12 flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground animate-fade-in"
                style={{ animationDelay: "0.5s" }}
              >
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-green-500" />
                  <span>Sin tarjeta de crédito</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-blue-500" />
                  <span>Activo en 30 segundos</span>
                </div>
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-yellow-500" />
                  <span>+10K desarrolladores</span>
                </div>
              </div>
            </div>
          </div>

          {/* Floating Elements */}
          <div className="absolute top-1/4 left-10 w-20 h-20 bg-primary/20 rounded-full blur-2xl animate-float" />
          <div className="absolute bottom-1/4 right-10 w-32 h-32 bg-accent/20 rounded-full blur-2xl animate-float delay-1000" />
        </section>

        {/* Stats Section */}
        <section className="py-12 border-y border-border/50 bg-card/30 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
              {stats.map((stat, index) => (
                <div 
                  key={index} 
                  className="text-center animate-scale-in"
                  style={{ animationDelay: `${0.6 + index * 0.1}s` }}
                >
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-3">
                    <stat.icon className="h-6 w-6 text-primary" />
                  </div>
                  <div className="text-3xl sm:text-4xl font-bold font-display mb-1 bg-gradient-to-br from-primary to-accent bg-clip-text text-transparent">
                    {stat.value}
                  </div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-20 sm:py-32">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">
                Características Principales
              </Badge>
              <h2 className="text-4xl sm:text-5xl font-display font-bold mb-4 bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
                Todo lo que necesitas para construir
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Herramientas profesionales de IA para crear aplicaciones web modernas en minutos
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
              {features.map((feature, index) => (
                <Card 
                  key={index} 
                  className="glass-panel border-border/50 hover:border-primary/30 group relative overflow-hidden animate-slide-in"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <CardContent className="p-6 relative z-10">
                    <div className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.gradient} mb-4 shadow-glow group-hover:scale-110 transition-transform duration-300`}>
                      <feature.icon className="h-7 w-7 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold mb-3 font-display group-hover:text-primary transition-colors">
                      {feature.title}
                    </h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {feature.description}
                    </p>
                  </CardContent>
                  {/* Hover gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 sm:py-32 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-accent/5" />
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
            <div className="glass-panel p-12 rounded-3xl border-primary/30 shadow-glow">
              <Sparkles className="h-16 w-16 mx-auto mb-6 text-primary animate-bounce-subtle" />
              <h2 className="text-4xl sm:text-5xl font-display font-bold mb-6 bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
                ¿Listo para crear algo increíble?
              </h2>
              <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                Únete a miles de desarrolladores que ya están construyendo el futuro con IA
              </p>
              <Button 
                size="lg" 
                className="cyber-gradient hover:opacity-90 text-lg px-10 py-6 shadow-glow-lg" 
                asChild
              >
                <Link href="/auth/register">
                  <Sparkles className="mr-2 h-5 w-5" />
                  Comenzar Ahora - 100 Créditos Gratis
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <p className="text-sm text-muted-foreground mt-4">
                No se requiere tarjeta de crédito • Activa tu cuenta en 30 segundos
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 py-12 bg-card/20 backdrop-blur-sm relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <Logo size="sm" />
            <div className="flex items-center gap-8 text-sm text-muted-foreground">
              <Link href="/pricing" className="hover:text-primary transition-colors">
                Precios
              </Link>
              <Link href="#features" className="hover:text-primary transition-colors">
                Características
              </Link>
              <Link href="/auth/login" className="hover:text-primary transition-colors">
                Iniciar Sesión
              </Link>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2026 Nexa One. Powered by AI.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
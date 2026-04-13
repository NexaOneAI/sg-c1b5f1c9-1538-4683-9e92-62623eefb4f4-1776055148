import { useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { SEO } from "@/components/SEO";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { 
  Sparkles, 
  Code2, 
  Zap, 
  Github, 
  Rocket, 
  CheckCircle2,
  ArrowRight,
  Terminal,
  Layers,
  Globe,
} from "lucide-react";

export default function Home() {
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

  return (
    <>
      <SEO 
        title="Nexa One - Construye Apps con IA"
        description="Plataforma SaaS para crear aplicaciones web con inteligencia artificial. Código automático, deploy instantáneo, GitHub integrado."
      />

      <div className="min-h-screen bg-background cyber-background">
        {/* Header Mobile-First */}
        <nav className="border-b border-border/50 backdrop-blur-xl bg-background/60 sticky top-0 z-50 safe-area-inset">
          <div className="container-responsive">
            <div className="flex justify-between items-center h-14 sm:h-16">
              <Logo size="sm" />
              
              <div className="flex items-center gap-2 sm:gap-4">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  asChild
                  className="text-xs sm:text-sm px-3 sm:px-4"
                >
                  <Link href="/auth/login">Iniciar Sesión</Link>
                </Button>
                <Button 
                  size="sm" 
                  asChild
                  className="cyber-gradient shadow-glow text-xs sm:text-sm px-3 sm:px-4"
                >
                  <Link href="/auth/register">Comenzar Gratis</Link>
                </Button>
              </div>
            </div>
          </div>
        </nav>

        {/* Hero Section - Mobile Optimized */}
        <section className="section-padding">
          <div className="container-responsive">
            <div className="flex flex-col items-center text-center space-y-4 sm:space-y-6 md:space-y-8 max-w-4xl mx-auto">
              <Badge className="cyber-gradient px-3 py-1 sm:px-4 sm:py-1.5 text-xs sm:text-sm shadow-glow">
                <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                Powered by OpenAI GPT-4
              </Badge>

              <h1 className="neon-text-primary leading-tight">
                Construye Apps Web
                <br />
                con Inteligencia Artificial
              </h1>

              <p className="text-sm sm:text-base md:text-lg text-muted-foreground max-w-2xl leading-relaxed px-4">
                Transforma ideas en código funcional en minutos. Nexa One usa IA para generar aplicaciones completas,
                con deployment automático y GitHub integrado.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full sm:w-auto px-4 sm:px-0">
                <Button 
                  size="lg" 
                  asChild
                  className="cyber-gradient shadow-glow text-sm sm:text-base h-12 sm:h-14 w-full sm:w-auto"
                >
                  <Link href="/auth/register">
                    Comenzar Gratis
                    <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2" />
                  </Link>
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  asChild
                  className="border-primary/50 hover:bg-primary/10 text-sm sm:text-base h-12 sm:h-14 w-full sm:w-auto"
                >
                  <Link href="/pricing">Ver Planes</Link>
                </Button>
              </div>

              <div className="flex flex-wrap justify-center gap-3 sm:gap-6 text-xs sm:text-sm text-muted-foreground pt-4 px-4">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <CheckCircle2 className="w-3 h-3 sm:w-4 sm:h-4 text-green-400" />
                  <span>Sin tarjeta requerida</span>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <CheckCircle2 className="w-3 h-3 sm:w-4 sm:h-4 text-green-400" />
                  <span>100 créditos gratis</span>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <CheckCircle2 className="w-3 h-3 sm:w-4 sm:h-4 text-green-400" />
                  <span>Deploy instantáneo</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <Separator className="my-8 sm:my-12 md:my-16 bg-border/50" />

        {/* Features Grid - Responsive */}
        <section className="section-padding">
          <div className="container-responsive">
            <div className="text-center mb-8 sm:mb-12 md:mb-16">
              <h2 className="mb-3 sm:mb-4">
                Todo lo que Necesitas para Crear
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto px-4">
                Una plataforma completa para desarrolladores que quieren velocidad y calidad
              </p>
            </div>

            <div className="grid-responsive">
              <Card className="card-touch cyber-border">
                <CardContent className="p-4 sm:p-6 space-y-3 sm:space-y-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Code2 className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                  </div>
                  <h3 className="text-lg sm:text-xl">Generación de Código IA</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    Chat inteligente que genera componentes, páginas y funcionalidades completas con GPT-4
                  </p>
                </CardContent>
              </Card>

              <Card className="card-touch cyber-border">
                <CardContent className="p-4 sm:p-6 space-y-3 sm:space-y-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-accent/10 flex items-center justify-center">
                    <Terminal className="w-5 h-5 sm:w-6 sm:h-6 text-accent" />
                  </div>
                  <h3 className="text-lg sm:text-xl">Builder Profesional</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    Preview en tiempo real, explorador de archivos, versionado y control completo del código
                  </p>
                </CardContent>
              </Card>

              <Card className="card-touch cyber-border">
                <CardContent className="p-4 sm:p-6 space-y-3 sm:space-y-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-green-500/10 flex items-center justify-center">
                    <Github className="w-5 h-5 sm:w-6 sm:h-6 text-green-400" />
                  </div>
                  <h3 className="text-lg sm:text-xl">Integración GitHub</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    Conecta tus repositorios, push automático y sincronización bidireccional
                  </p>
                </CardContent>
              </Card>

              <Card className="card-touch cyber-border">
                <CardContent className="p-4 sm:p-6 space-y-3 sm:space-y-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-blue-500/10 flex items-center justify-center">
                    <Globe className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400" />
                  </div>
                  <h3 className="text-lg sm:text-xl">Subdominios Personalizados</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    Deploy con tu propio subdominio en nexaoneia.com con SSL automático
                  </p>
                </CardContent>
              </Card>

              <Card className="card-touch cyber-border">
                <CardContent className="p-4 sm:p-6 space-y-3 sm:space-y-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-purple-500/10 flex items-center justify-center">
                    <Rocket className="w-5 h-5 sm:w-6 sm:h-6 text-purple-400" />
                  </div>
                  <h3 className="text-lg sm:text-xl">Deploy Instantáneo</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    Un click para deploy a Vercel con CDN global y optimizaciones automáticas
                  </p>
                </CardContent>
              </Card>

              <Card className="card-touch cyber-border">
                <CardContent className="p-4 sm:p-6 space-y-3 sm:space-y-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                    <Zap className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-400" />
                  </div>
                  <h3 className="text-lg sm:text-xl">Performance Óptima</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    Código optimizado, carga rápida y mejores prácticas integradas automáticamente
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <Separator className="my-8 sm:my-12 md:my-16 bg-border/50" />

        {/* CTA Final - Mobile Optimized */}
        <section className="section-padding">
          <div className="container-responsive">
            <Card className="glass-panel cyber-border overflow-hidden">
              <CardContent className="p-6 sm:p-8 md:p-12 text-center space-y-4 sm:space-y-6">
                <h2 className="neon-text-primary">
                  Comienza a Construir Hoy
                </h2>
                <p className="text-sm sm:text-base md:text-lg text-muted-foreground max-w-2xl mx-auto px-4">
                  Únete a los desarrolladores que están creando aplicaciones más rápido con IA
                </p>
                <Button 
                  size="lg" 
                  asChild
                  className="cyber-gradient shadow-glow text-sm sm:text-base h-12 sm:h-14 px-6 sm:px-8 w-full sm:w-auto"
                >
                  <Link href="/auth/register">
                    Comenzar Gratis
                    <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 ml-2" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Footer - Mobile Friendly */}
        <footer className="border-t border-border/50 mt-8 sm:mt-12 md:mt-20 safe-area-inset">
          <div className="container-responsive py-6 sm:py-8">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-xs sm:text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Logo size="sm" />
                <span>© 2026 Nexa One. Todos los derechos reservados.</span>
              </div>
              <div className="flex gap-4 sm:gap-6">
                <Link href="/pricing" className="hover:text-primary transition-colors">
                  Precios
                </Link>
                <Link href="/auth/login" className="hover:text-primary transition-colors">
                  Iniciar Sesión
                </Link>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
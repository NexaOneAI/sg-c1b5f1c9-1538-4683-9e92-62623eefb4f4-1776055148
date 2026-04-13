import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { getCurrentProfile } from "@/services/profileService";
import { getCreditWallet } from "@/services/creditService";
import { getUserProjects, createProject } from "@/services/projectService";
import { 
  Plus, 
  Search, 
  Folder, 
  Clock, 
  Loader2,
  User,
  Settings,
  CreditCard,
  LogOut,
  Shield,
  Sparkles,
  Code2,
  Zap,
  TrendingUp
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Dashboard() {
  return (
    <AuthGuard>
      <DashboardContent />
    </AuthGuard>
  );
}

function DashboardContent() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [projects, setProjects] = useState<any[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [profile, setProfile] = useState<any>(null);
  const [credits, setCredits] = useState(0);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (searchQuery) {
      const filtered = projects.filter(p => 
        p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredProjects(filtered);
    } else {
      setFilteredProjects(projects);
    }
  }, [searchQuery, projects]);

  async function loadData() {
    setLoading(true);

    const profileData = await getCurrentProfile();
    setProfile(profileData);

    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const wallet = await getCreditWallet(user.id);
      setCredits(wallet?.balance || 0);

      const projectsData = await getUserProjects(user.id);
      setProjects(projectsData);
      setFilteredProjects(projectsData);
    }

    setLoading(false);
  }

  async function handleCreateProject() {
    if (creating) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({
        title: "Error",
        description: "No estás autenticado",
        variant: "destructive",
      });
      return;
    }

    setCreating(true);

    const newProject = await createProject(user.id, {
      name: `Proyecto ${projects.length + 1}`,
      description: "Nuevo proyecto creado desde el dashboard",
      framework: "react",
      status: "active",
    });

    if (newProject) {
      toast({
        title: "✨ Proyecto creado",
        description: "Redirigiendo al builder...",
      });
      router.push(`/builder/${newProject.id}`);
    } else {
      toast({
        title: "Error",
        description: "No se pudo crear el proyecto",
        variant: "destructive",
      });
      setCreating(false);
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/");
  }

  const initials = profile?.full_name
    ?.split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || profile?.email?.slice(0, 2).toUpperCase() || "U";

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background cyber-background">
        <div className="text-center space-y-4">
          <div className="cyber-spinner w-16 h-16 mx-auto" />
          <p className="text-muted-foreground">Cargando tu espacio...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background cyber-background relative overflow-hidden">
      {/* Animated Grid */}
      <div className="fixed inset-0 cyber-grid bg-grid opacity-10 pointer-events-none" />
      
      {/* Gradient Orbs */}
      <div className="fixed top-0 left-0 w-[400px] h-[400px] bg-primary/10 rounded-full blur-[100px] -translate-x-1/2 -translate-y-1/2 animate-pulse" />
      <div className="fixed bottom-0 right-0 w-[500px] h-[500px] bg-accent/10 rounded-full blur-[100px] translate-x-1/2 translate-y-1/2 animate-pulse" style={{ animationDelay: "1s" }} />

      {/* Header */}
      <nav className="border-b border-border/50 backdrop-blur-xl bg-background/60 sticky top-0 z-50 shadow-lg safe-area-inset">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16">
            <div className="flex items-center gap-4">
              <Logo size="sm" />
              <Badge className="cyber-gradient hidden sm:flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                {credits.toLocaleString()} créditos
              </Badge>
            </div>

            <div className="flex items-center gap-3">
              <Badge variant="outline" className="sm:hidden">
                {credits}
              </Badge>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative group">
                    <Avatar className="h-9 w-9 border-2 border-primary/50 group-hover:border-primary transition-colors neon-glow">
                      <AvatarImage src={profile?.avatar_url} />
                      <AvatarFallback className="bg-primary/20 text-primary font-semibold">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 glass-panel border-border/50">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{profile?.full_name || "Usuario"}</p>
                      <p className="text-xs leading-none text-muted-foreground">{profile?.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      Mi Perfil
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/settings" className="cursor-pointer">
                      <Settings className="mr-2 h-4 w-4" />
                      Configuración
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/pricing" className="cursor-pointer">
                      <CreditCard className="mr-2 h-4 w-4" />
                      Planes y Créditos
                    </Link>
                  </DropdownMenuItem>
                  {profile?.role === "superadmin" && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href="/admin" className="cursor-pointer text-primary">
                          <Shield className="mr-2 h-4 w-4" />
                          Panel Admin
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="text-red-500 focus:text-red-500">
                    <LogOut className="mr-2 h-4 w-4" />
                    Cerrar Sesión
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 relative z-10 pb-20 sm:pb-8">
        {/* Welcome Section */}
        <div className="mb-8 sm:mb-12 animate-fade-in">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 sm:gap-6">
            <div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold mb-2 neon-text-primary">
                Bienvenido, {profile?.full_name?.split(" ")[0] || "Desarrollador"}
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground">
                Construye el futuro con IA • {projects.length} {projects.length === 1 ? "proyecto activo" : "proyectos activos"}
              </p>
            </div>
            
            <Button 
              onClick={handleCreateProject}
              disabled={creating}
              size="lg"
              className="cyber-gradient hover:opacity-90 shadow-glow-lg group relative overflow-hidden w-full sm:w-auto h-12 sm:h-14"
            >
              {creating ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Creando...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-5 w-5 group-hover:rotate-90 transition-transform" />
                  Nuevo Proyecto
                </>
              )}
              <span className="absolute inset-0 bg-gradient-to-r from-primary/20 to-accent/20 opacity-0 group-hover:opacity-100 transition-opacity" />
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8 animate-slide-in">
          <Card className="glass-panel border-border/50 hover:border-primary/30 transition-all duration-300 group">
            <CardContent className="pt-4 sm:pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground mb-1">Proyectos Activos</p>
                  <p className="text-2xl sm:text-3xl font-bold font-display neon-text-primary">{projects.length}</p>
                </div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center group-hover:scale-110 transition-transform shadow-glow shrink-0">
                  <Folder className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-panel border-border/50 hover:border-accent/30 transition-all duration-300 group">
            <CardContent className="pt-4 sm:pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground mb-1">Créditos Disponibles</p>
                  <p className="text-2xl sm:text-3xl font-bold font-display neon-text-accent">{credits.toLocaleString()}</p>
                </div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center group-hover:scale-110 transition-transform shadow-glow-accent shrink-0">
                  <Sparkles className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-panel border-border/50 hover:border-green-500/30 transition-all duration-300 group">
            <CardContent className="pt-4 sm:pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground mb-1">Generaciones IA</p>
                  <p className="text-2xl sm:text-3xl font-bold font-display text-green-400">∞</p>
                </div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center group-hover:scale-110 transition-transform shadow-glow shrink-0">
                  <Code2 className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-panel border-border/50 hover:border-yellow-500/30 transition-all duration-300 group">
            <CardContent className="pt-4 sm:pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground mb-1">Preview en Vivo</p>
                  <p className="text-2xl sm:text-3xl font-bold font-display text-yellow-400">24/7</p>
                </div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center group-hover:scale-110 transition-transform shadow-glow shrink-0">
                  <Zap className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filter */}
        <div className="mb-6 animate-slide-in" style={{ animationDelay: "0.1s" }}>
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar proyectos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 glass-panel border-border/50 focus:border-primary/50"
            />
          </div>
        </div>

        {/* Projects Grid */}
        {filteredProjects.length === 0 ? (
          <Card className="glass-panel border-border/50 animate-scale-in">
            <CardContent className="pt-12 pb-12">
              <div className="text-center">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center">
                  <Folder className="h-10 w-10 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2 font-display">
                  {searchQuery ? "No se encontraron proyectos" : "Comienza tu primer proyecto"}
                </h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  {searchQuery 
                    ? `No hay proyectos que coincidan con "${searchQuery}"`
                    : "Crea una aplicación web completa con IA en minutos. Solo describe lo que necesitas y Nexa One lo construirá para ti."
                  }
                </p>
                {!searchQuery && (
                  <Button 
                    onClick={handleCreateProject}
                    disabled={creating}
                    className="cyber-gradient shadow-glow"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Crear Primer Proyecto
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project, index) => (
              <Card 
                key={project.id} 
                className="glass-panel border-border/50 hover:border-primary/30 group cursor-pointer transition-all duration-300 hover-lift animate-scale-in"
                style={{ animationDelay: `${index * 0.05}s` }}
                onClick={() => router.push(`/builder/${project.id}`)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1">
                      <CardTitle className="text-lg font-display mb-1 group-hover:text-primary transition-colors line-clamp-1">
                        {project.name}
                      </CardTitle>
                      <CardDescription className="line-clamp-2">
                        {project.description || "Sin descripción"}
                      </CardDescription>
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center group-hover:scale-110 transition-transform shadow-glow shrink-0">
                      <Code2 className="h-5 w-5 text-white" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(project.created_at).toLocaleDateString("es-ES", {
                        day: "2-digit",
                        month: "short"
                      })}
                    </div>
                    <Badge variant="outline" className="text-xs border-primary/30">
                      {project.framework || "React"}
                    </Badge>
                    <div className="flex-1" />
                    <TrendingUp className="h-3 w-3 text-green-500" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
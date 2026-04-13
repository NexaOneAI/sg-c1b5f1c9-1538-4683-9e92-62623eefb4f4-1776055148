import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { getCurrentProfile } from "@/services/profileService";
import { getCreditWallet } from "@/services/creditService";
import { getAllProjects, createProject } from "@/services/projectService";
import { 
  Plus, 
  Search, 
  Folder, 
  Clock, 
  MoreVertical,
  Loader2,
  User,
  Settings,
  LogOut,
  Shield,
  CreditCard,
  Sparkles
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function DashboardPage() {
  return (
    <AuthGuard>
      <DashboardContent />
    </AuthGuard>
  );
}

function DashboardContent() {
  const router = useRouter();
  const { toast } = useToast();
  const [projects, setProjects] = useState<any[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [credits, setCredits] = useState(0);

  useEffect(() => {
    loadDashboardData();
  }, []);

  useEffect(() => {
    const filtered = projects.filter(project =>
      project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredProjects(filtered);
  }, [searchQuery, projects]);

  async function loadDashboardData() {
    setLoading(true);

    const profileData = await getCurrentProfile();
    if (profileData) {
      setProfile(profileData);
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const wallet = await getCreditWallet(user.id);
      setCredits(wallet?.balance || 0);

      const projectsData = await getAllProjects(user.id);
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
      tech_stack: "next-tailwind-supabase",
      status: "active",
    });

    if (newProject) {
      toast({
        title: "✅ Proyecto creado",
        description: "Redirigiendo al builder...",
      });
      router.push(`/builder/${newProject.id}`);
    } else {
      toast({
        title: "❌ Error",
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const userInitials = profile?.full_name
    ?.split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || profile?.email?.slice(0, 2).toUpperCase() || "U";

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border/50 backdrop-blur-sm bg-background/80 sticky top-0 z-50">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Logo />
            <div className="flex items-center gap-4">
              <Badge className="cyber-gradient hidden sm:flex">
                <Sparkles className="w-3 h-3 mr-1" />
                {credits.toLocaleString()} créditos
              </Badge>
              
              {profile?.role === "superadmin" && (
                <Button variant="outline" size="sm" asChild>
                  <Link href="/admin">
                    <Shield className="w-4 h-4 mr-2" />
                    Admin
                  </Link>
                </Button>
              )}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative">
                    <Avatar className="h-8 w-8 border border-primary/50">
                      <AvatarFallback className="bg-primary/20 text-primary text-xs">
                        {userInitials}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="glass-panel border-border/50 w-56">
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-medium">{profile?.full_name || "Usuario"}</p>
                    <p className="text-xs text-muted-foreground">{profile?.email}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="cursor-pointer">
                      <User className="w-4 h-4 mr-2" />
                      Mi Perfil
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/settings" className="cursor-pointer">
                      <Settings className="w-4 h-4 mr-2" />
                      Configuración
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/pricing" className="cursor-pointer">
                      <CreditCard className="w-4 h-4 mr-2" />
                      Planes y Créditos
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="text-red-500 cursor-pointer">
                    <LogOut className="w-4 h-4 mr-2" />
                    Cerrar Sesión
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 neon-text-primary font-['Orbitron']">
            Mis Proyectos
          </h1>
          <p className="text-muted-foreground">
            Construye aplicaciones web con IA en minutos
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar proyectos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button
            onClick={handleCreateProject}
            disabled={creating}
            className="cyber-gradient"
          >
            {creating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creando...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Crear Proyecto
              </>
            )}
          </Button>
        </div>

        {filteredProjects.length === 0 ? (
          <Card className="glass-panel border-border/50">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Folder className="h-16 w-16 text-muted-foreground mb-4 opacity-50" />
              <h3 className="text-lg font-semibold mb-2">
                {searchQuery ? "No se encontraron proyectos" : "No tienes proyectos"}
              </h3>
              <p className="text-muted-foreground text-center mb-6">
                {searchQuery
                  ? "Intenta con otro término de búsqueda"
                  : "Crea tu primer proyecto y empieza a construir con IA"}
              </p>
              {!searchQuery && (
                <Button onClick={handleCreateProject} disabled={creating} className="cyber-gradient">
                  <Plus className="h-4 w-4 mr-2" />
                  Crear Primer Proyecto
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project) => (
              <Card
                key={project.id}
                className="glass-panel border-border/50 hover:border-primary/50 transition-all hover:shadow-lg hover:shadow-primary/20 cursor-pointer group"
                onClick={() => router.push(`/builder/${project.id}`)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="group-hover:neon-text-primary transition-colors">
                        {project.name}
                      </CardTitle>
                      <CardDescription className="mt-2 line-clamp-2">
                        {project.description || "Sin descripción"}
                      </CardDescription>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="glass-panel border-border/50">
                        <DropdownMenuItem>Renombrar</DropdownMenuItem>
                        <DropdownMenuItem>Duplicar</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-red-500">Eliminar</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
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
                    <Badge variant="outline" className="text-xs">
                      {project.tech_stack || "Next.js"}
                    </Badge>
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
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { getCurrentProfile } from "@/services/profileService";
import { getCreditWallet } from "@/services/creditService";
import { getUserProjects, createProject } from "@/services/projectService";
import type { Profile } from "@/services/profileService";
import type { CreditWallet } from "@/services/creditService";
import type { Project } from "@/services/projectService";
import { Plus, Search, LogOut, Settings, Sparkles, Clock, FileCode, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

export default function DashboardPage() {
  return (
    <AuthGuard>
      <DashboardContent />
    </AuthGuard>
  );
}

function DashboardContent() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [wallet, setWallet] = useState<CreditWallet | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [creatingProject, setCreatingProject] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  async function loadDashboardData() {
    const [profileData, walletData] = await Promise.all([
      getCurrentProfile(),
      supabase.auth.getUser().then(({ data: { user } }) => user ? getCreditWallet(user.id) : null),
    ]);

    setProfile(profileData);
    setWallet(walletData);

    if (profileData) {
      const projectsData = await getUserProjects(profileData.id);
      setProjects(projectsData);
    }

    setLoading(false);
  }

  async function handleCreateProject() {
    if (!profile) return;

    setCreatingProject(true);
    const project = await createProject(profile.id, {
      name: "Nuevo Proyecto",
      description: "Proyecto sin descripción",
      status: "active",
    });

    if (project) {
      router.push(`/builder/${project.id}`);
    } else {
      setCreatingProject(false);
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/");
  }

  const filteredProjects = projects.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border/50 backdrop-blur-sm bg-background/80 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Logo size="sm" />
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-card border border-border/50">
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">
                  {wallet?.balance ?? 0} créditos
                </span>
              </div>
              
              <Button variant="ghost" size="icon" asChild>
                <Link href="/settings">
                  <Settings className="h-4 w-4" />
                </Link>
              </Button>
              
              <Button variant="ghost" size="icon" onClick={handleLogout}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold mb-2">
            Bienvenido, {profile?.full_name || "Usuario"}
          </h1>
          <p className="text-muted-foreground">
            Administra tus proyectos y crea nuevas aplicaciones con IA
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mb-8">
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
            className="cyber-gradient hover:opacity-90"
            onClick={handleCreateProject}
            disabled={creatingProject}
          >
            {creatingProject ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creando...
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                Nuevo Proyecto
              </>
            )}
          </Button>
        </div>

        {filteredProjects.length === 0 ? (
          <Card className="glass-panel border-border/50">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="rounded-full bg-primary/10 p-4 mb-4">
                <FileCode className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No hay proyectos</h3>
              <p className="text-muted-foreground text-center mb-6">
                {searchQuery
                  ? "No se encontraron proyectos con ese nombre"
                  : "Crea tu primer proyecto para comenzar"}
              </p>
              {!searchQuery && (
                <Button
                  className="cyber-gradient hover:opacity-90"
                  onClick={handleCreateProject}
                  disabled={creatingProject}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Crear Proyecto
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project) => (
              <Link key={project.id} href={`/builder/${project.id}`}>
                <Card className="glass-panel border-border/50 hover:border-primary/30 transition-all duration-300 cursor-pointer h-full">
                  <CardHeader>
                    <div className="flex items-start justify-between mb-2">
                      <CardTitle className="text-xl">{project.name}</CardTitle>
                      <Badge
                        variant={project.status === "active" ? "default" : "secondary"}
                        className={project.status === "active" ? "cyber-gradient" : ""}
                      >
                        {project.status === "active" ? "Activo" : "Archivado"}
                      </Badge>
                    </div>
                    <CardDescription className="line-clamp-2">
                      {project.description || "Sin descripción"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>
                          {formatDistanceToNow(new Date(project.updated_at), {
                            addSuffix: true,
                            locale: es,
                          })}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
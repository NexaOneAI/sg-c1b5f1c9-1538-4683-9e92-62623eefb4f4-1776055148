import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { isAdmin, getCurrentProfile } from "@/services/profileService";
import { Users, CreditCard, Settings as SettingsIcon, Activity, DollarSign, TrendingUp, Search, Plus, Minus, ArrowLeft } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

export default function AdminPage() {
  return (
    <AuthGuard>
      <AdminContent />
    </AuthGuard>
  );
}

function AdminContent() {
  const router = useRouter();
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeProjects: 0,
    totalCreditsDistributed: 0,
    totalRevenue: 0,
  });
  const [users, setUsers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    checkAdminAccess();
  }, []);

  async function checkAdminAccess() {
    const admin = await isAdmin();
    if (!admin) {
      router.push("/dashboard");
      return;
    }
    setHasAccess(true);
    await loadAdminData();
    setLoading(false);
  }

  async function loadAdminData() {
    const [profilesData, projectsData, walletsData, paymentsData] = await Promise.all([
      supabase.from("profiles").select("*"),
      supabase.from("projects").select("id"),
      supabase.from("credit_wallets").select("balance"),
      supabase.from("payments").select("amount"),
    ]);

    setStats({
      totalUsers: profilesData.data?.length || 0,
      activeProjects: projectsData.data?.length || 0,
      totalCreditsDistributed: walletsData.data?.reduce((sum, w) => sum + (w.balance || 0), 0) || 0,
      totalRevenue: paymentsData.data?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0,
    });

    if (profilesData.data) {
      const usersWithWallets = await Promise.all(
        profilesData.data.map(async (profile) => {
          const { data: wallet } = await supabase
            .from("credit_wallets")
            .select("balance")
            .eq("user_id", profile.id)
            .single();
          
          return {
            ...profile,
            credits: wallet?.balance || 0,
          };
        })
      );
      setUsers(usersWithWallets);
    }
  }

  async function handleCreditAdjustment(userId: string, amount: number) {
    const { data: wallet } = await supabase
      .from("credit_wallets")
      .select("id")
      .eq("user_id", userId)
      .single();

    if (!wallet) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from("credit_transactions").insert({
      wallet_id: wallet.id,
      user_id: userId,
      amount,
      type: "admin_adjustment",
      description: `Ajuste manual por admin`,
      metadata: { admin_id: user.id },
    });

    await loadAdminData();
  }

  const filteredUsers = users.filter((u) =>
    u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-primary">Cargando...</div>
      </div>
    );
  }

  if (!hasAccess) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border/50 backdrop-blur-sm bg-background/80 sticky top-0 z-50">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" asChild>
                <Link href="/dashboard">
                  <ArrowLeft className="h-4 w-4" />
                </Link>
              </Button>
              <Logo size="sm" />
              <Badge className="cyber-gradient">Admin</Badge>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 neon-text-primary">Panel de Administración</h1>
          <p className="text-muted-foreground">Gestiona usuarios, créditos y configuraciones del sistema</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="glass-panel border-border/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Usuarios Totales</CardTitle>
              <Users className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
            </CardContent>
          </Card>

          <Card className="glass-panel border-border/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Proyectos Activos</CardTitle>
              <Activity className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeProjects}</div>
            </CardContent>
          </Card>

          <Card className="glass-panel border-border/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Créditos Distribuidos</CardTitle>
              <CreditCard className="h-4 w-4 text-secondary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalCreditsDistributed.toLocaleString()}</div>
            </CardContent>
          </Card>

          <Card className="glass-panel border-border/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Revenue Total</CardTitle>
              <DollarSign className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${stats.totalRevenue.toLocaleString()}</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="glass-panel border-border/50">
            <TabsTrigger value="users">
              <Users className="h-4 w-4 mr-2" />
              Usuarios
            </TabsTrigger>
            <TabsTrigger value="settings">
              <SettingsIcon className="h-4 w-4 mr-2" />
              Configuración
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-4">
            <Card className="glass-panel border-border/50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Gestión de Usuarios</CardTitle>
                  <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar usuarios..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Usuario</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Rol</TableHead>
                      <TableHead>Créditos</TableHead>
                      <TableHead>Registrado</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">
                          {user.full_name || "Sin nombre"}
                        </TableCell>
                        <TableCell className="text-muted-foreground">{user.email}</TableCell>
                        <TableCell>
                          <Badge variant={user.role === "admin" ? "default" : "secondary"}>
                            {user.role || "user"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="font-mono">{user.credits}</span>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDistanceToNow(new Date(user.created_at), {
                            addSuffix: true,
                            locale: es,
                          })}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCreditAdjustment(user.id, 100)}
                            >
                              <Plus className="h-3 w-3 mr-1" />
                              100
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCreditAdjustment(user.id, -50)}
                            >
                              <Minus className="h-3 w-3 mr-1" />
                              50
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <Card className="glass-panel border-border/50">
              <CardHeader>
                <CardTitle>Configuración del Sistema</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">
                  Configuraciones avanzadas próximamente disponibles.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
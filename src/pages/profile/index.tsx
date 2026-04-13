import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { getCurrentProfile, updateProfile } from "@/services/profileService";
import { getCreditWallet } from "@/services/creditService";
import { 
  ArrowLeft, 
  User, 
  CreditCard, 
  History, 
  Shield, 
  Loader2,
  Save,
  LogOut,
  Trash2,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Sparkles,
  Key,
  Zap,
  Star
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function ProfilePage() {
  return (
    <AuthGuard>
      <ProfileContent />
    </AuthGuard>
  );
}

function ProfileContent() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [credits, setCredits] = useState(0);
  const [subscription, setSubscription] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [projectCount, setProjectCount] = useState(0);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const [formData, setFormData] = useState({
    full_name: "",
    avatar_url: "",
  });

  useEffect(() => {
    loadProfileData();
  }, []);

  async function loadProfileData() {
    setLoading(true);
    
    const profileData = await getCurrentProfile();
    if (profileData) {
      setProfile(profileData);
      setFormData({
        full_name: profileData.full_name || "",
        avatar_url: profileData.avatar_url || "",
      });
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const wallet = await getCreditWallet(user.id);
      setCredits(wallet?.balance || 0);

      const { data: subData } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .single();
      setSubscription(subData);

      const { data: projectsData } = await supabase
        .from("projects")
        .select("id")
        .eq("user_id", user.id)
        .eq("status", "active");
      setProjectCount(projectsData?.length || 0);

      const { data: walletData } = await supabase
        .from("credit_wallets")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (walletData) {
        const { data: transData } = await supabase
          .from("credit_transactions")
          .select("*")
          .eq("wallet_id", walletData.id)
          .order("created_at", { ascending: false })
          .limit(10);
        
        setTransactions(transData || []);
      }
    }

    setLoading(false);
  }

  async function handleSaveProfile() {
    if (!profile?.id) return;
    
    setSaving(true);
    const success = await updateProfile(profile.id, formData);
    
    if (success) {
      toast({
        title: "✅ Perfil actualizado",
        description: "Tus cambios se han guardado correctamente.",
      });
      await loadProfileData();
    } else {
      toast({
        title: "❌ Error",
        description: "No se pudo actualizar el perfil.",
        variant: "destructive",
      });
    }
    
    setSaving(false);
  }

  async function handleChangePassword() {
    if (newPassword !== confirmPassword) {
      toast({
        title: "❌ Error",
        description: "Las contraseñas no coinciden",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: "❌ Error",
        description: "La contraseña debe tener al menos 6 caracteres",
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (error) {
      toast({
        title: "❌ Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "✅ Contraseña actualizada",
        description: "Tu contraseña ha sido cambiada correctamente",
      });
      setShowPasswordDialog(false);
      setNewPassword("");
      setConfirmPassword("");
    }
  }

  async function handleDeleteAccount() {
    if (deleteConfirm !== "ELIMINAR") {
      toast({
        title: "❌ Error",
        description: 'Escribe "ELIMINAR" para confirmar',
        variant: "destructive",
      });
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error: projectsError } = await supabase
      .from("projects")
      .update({ status: "deleted" })
      .eq("user_id", user.id);

    const { error: profileError } = await supabase
      .from("profiles")
      .delete()
      .eq("id", user.id);

    if (projectsError || profileError) {
      toast({
        title: "❌ Error",
        description: "No se pudo eliminar la cuenta",
        variant: "destructive",
      });
    } else {
      await supabase.auth.signOut();
      router.push("/");
      toast({
        title: "Cuenta eliminada",
        description: "Tu cuenta ha sido eliminada permanentemente",
      });
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/");
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background cyber-background">
        <div className="text-center space-y-4">
          <div className="cyber-spinner w-16 h-16 mx-auto" />
          <p className="text-muted-foreground">Cargando perfil...</p>
        </div>
      </div>
    );
  }

  const initials = formData.full_name
    ?.split(" ")
    .map(n => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || profile?.email?.slice(0, 2).toUpperCase() || "U";

  const planBadgeColor = {
    free: "bg-gray-500/20 text-gray-300 border-gray-500/30",
    pro: "bg-blue-500/20 text-blue-300 border-blue-500/30",
    premium: "bg-purple-500/20 text-purple-300 border-purple-500/30"
  }[subscription?.plan_type || "free"];

  const planLimits = {
    free: { credits: 100, projects: 3 },
    pro: { credits: 1000, projects: 50 },
    premium: { credits: "∞", projects: "∞" }
  }[subscription?.plan_type || "free"];

  return (
    <div className="min-h-screen bg-background cyber-background relative overflow-hidden">
      {/* Animated Grid */}
      <div className="fixed inset-0 cyber-grid bg-grid opacity-10 pointer-events-none" />
      
      {/* Gradient Orbs */}
      <div className="fixed top-0 left-0 w-[400px] h-[400px] bg-primary/10 rounded-full blur-[100px] -translate-x-1/2 -translate-y-1/2 animate-pulse" />
      <div className="fixed bottom-0 right-0 w-[500px] h-[500px] bg-accent/10 rounded-full blur-[100px] translate-x-1/2 translate-y-1/2 animate-pulse" style={{ animationDelay: "1s" }} />

      <nav className="border-b border-border/50 backdrop-blur-xl bg-background/60 sticky top-0 z-50 shadow-lg">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" asChild className="hover:bg-primary/10">
                <Link href="/dashboard">
                  <ArrowLeft className="h-4 w-4" />
                </Link>
              </Button>
              <Logo size="sm" />
            </div>
            <div className="flex items-center gap-2">
              <Badge className="cyber-gradient">
                <Sparkles className="w-3 h-3 mr-1" />
                {credits.toLocaleString()} créditos
              </Badge>
              {profile?.role === "superadmin" && (
                <Badge variant="outline" className="border-primary/50">
                  <Shield className="w-3 h-3 mr-1" />
                  Superadmin
                </Badge>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        <div className="mb-8 animate-fade-in">
          <h1 className="text-4xl sm:text-5xl font-bold mb-2 neon-text-primary font-display">
            Mi Perfil
          </h1>
          <p className="text-muted-foreground text-lg">
            Gestiona tu información personal y configuración de cuenta
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="glass-panel border-border/50 hover:border-primary/30 transition-all duration-300 animate-slide-in">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-2xl font-display">
                  <User className="w-6 h-6 text-primary" />
                  Información Personal
                </CardTitle>
                <CardDescription>
                  Actualiza tu información de perfil visible para otros usuarios
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-6">
                  <Avatar className="h-24 w-24 border-2 border-primary/50 neon-glow hover:scale-105 transition-transform">
                    <AvatarImage src={formData.avatar_url} alt={formData.full_name} />
                    <AvatarFallback className="text-2xl bg-primary/20 text-primary font-bold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-2">
                    <Label htmlFor="avatar_url">URL del Avatar</Label>
                    <Input
                      id="avatar_url"
                      value={formData.avatar_url}
                      onChange={(e) => setFormData({ ...formData, avatar_url: e.target.value })}
                      placeholder="https://ejemplo.com/avatar.jpg"
                      className="glass-panel border-border/50 focus:border-primary/50"
                    />
                    <p className="text-xs text-muted-foreground">
                      Pega la URL de tu foto de perfil
                    </p>
                  </div>
                </div>

                <Separator className="bg-border/50" />

                <div className="grid gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="full_name">Nombre Completo</Label>
                    <Input
                      id="full_name"
                      value={formData.full_name}
                      onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                      placeholder="Tu nombre completo"
                      className="glass-panel border-border/50 focus:border-primary/50"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={profile?.email || ""}
                      disabled
                      className="bg-muted/30 border-border/30"
                    />
                    <p className="text-xs text-muted-foreground">
                      El email no puede ser modificado por seguridad
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Rol</Label>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="capitalize border-primary/30">
                        {profile?.role || "user"}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        Nivel de acceso en la plataforma
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-4">
                  <Button
                    onClick={handleSaveProfile}
                    disabled={saving}
                    className="cyber-gradient shadow-glow"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Guardando...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Guardar Cambios
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-panel border-border/50 hover:border-accent/30 transition-all duration-300 animate-slide-in" style={{ animationDelay: "0.1s" }}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-2xl font-display">
                  <History className="w-6 h-6 text-accent" />
                  Historial de Créditos
                </CardTitle>
                <CardDescription>
                  Últimas 10 transacciones de tu cuenta
                </CardDescription>
              </CardHeader>
              <CardContent>
                {transactions.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-accent/10 flex items-center justify-center">
                      <History className="h-8 w-8 text-accent" />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      No hay transacciones registradas
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-border/50">
                          <TableHead>Fecha</TableHead>
                          <TableHead>Descripción</TableHead>
                          <TableHead>Tipo</TableHead>
                          <TableHead className="text-right">Cantidad</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {transactions.map((tx) => (
                          <TableRow key={tx.id} className="border-border/30 hover:bg-primary/5 transition-colors">
                            <TableCell className="text-xs text-muted-foreground font-mono">
                              {new Date(tx.created_at).toLocaleDateString("es-ES", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric"
                              })}
                            </TableCell>
                            <TableCell className="text-sm max-w-xs truncate">
                              {tx.description || "Sin descripción"}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className={
                                  tx.type === "bonus" || (tx.type === "admin_adjustment" && tx.amount > 0)
                                    ? "border-green-500/50 text-green-400 bg-green-500/10"
                                    : tx.type === "usage"
                                    ? "border-red-500/50 text-red-400 bg-red-500/10"
                                    : "border-blue-500/50 text-blue-400 bg-blue-500/10"
                                }
                              >
                                {tx.type === "bonus" ? <Sparkles className="w-3 h-3 mr-1" /> :
                                 tx.type === "usage" ? <TrendingDown className="w-3 h-3 mr-1" /> :
                                 <TrendingUp className="w-3 h-3 mr-1" />}
                                {tx.type === "admin_adjustment" ? "Ajuste" : 
                                 tx.type === "bonus" ? "Bonus" :
                                 tx.type === "purchase" ? "Compra" : "Uso"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right font-mono font-bold">
                              <span className={tx.amount > 0 ? "text-green-400" : "text-red-400"}>
                                {tx.amount > 0 ? "+" : ""}{tx.amount}
                              </span>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="glass-panel border-primary/50 shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all duration-300 animate-scale-in">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl font-display">
                  <CreditCard className="w-5 h-5 text-primary" />
                  Plan y Créditos
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center p-6 rounded-lg bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-accent/5 animate-gradient-xy" />
                  <p className="text-sm text-muted-foreground mb-2 relative z-10">Créditos Disponibles</p>
                  <p className="text-5xl sm:text-6xl font-bold neon-text-primary font-display relative z-10">
                    {credits.toLocaleString()}
                  </p>
                  {subscription?.plan_type !== "premium" && (
                    <p className="text-xs text-muted-foreground mt-2 relative z-10">
                      de {planLimits.credits} mensuales
                    </p>
                  )}
                  <Sparkles className="absolute top-2 right-2 w-4 h-4 text-primary/40 animate-pulse" />
                  <Zap className="absolute bottom-2 left-2 w-4 h-4 text-accent/40 animate-pulse" style={{ animationDelay: "0.5s" }} />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Plan Actual</span>
                    <Badge className={planBadgeColor}>
                      <Star className="w-3 h-3 mr-1" />
                      {(subscription?.plan_type || "free").toUpperCase()}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Proyectos</span>
                    <span className="font-mono font-bold">
                      {projectCount} / {planLimits.projects}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Renovación</span>
                    <span className="text-xs text-muted-foreground">
                      {subscription?.auto_renew ? "Automática" : "Manual"}
                    </span>
                  </div>
                </div>

                {subscription?.plan_type === "free" && (
                  <Button className="w-full cyber-gradient shadow-glow group" asChild>
                    <Link href="/pricing">
                      <TrendingUp className="w-4 h-4 mr-2 group-hover:translate-y-[-2px] transition-transform" />
                      Mejorar Plan
                    </Link>
                  </Button>
                )}
              </CardContent>
            </Card>

            <Card className="glass-panel border-border/50 hover:border-accent/30 transition-all duration-300 animate-scale-in" style={{ animationDelay: "0.1s" }}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl font-display">
                  <Shield className="w-5 h-5 text-accent" />
                  Seguridad
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full justify-start hover:bg-primary/10 border-border/50">
                      <Key className="w-4 h-4 mr-2" />
                      Cambiar Contraseña
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="glass-panel border-border/50">
                    <DialogHeader>
                      <DialogTitle className="font-display">Cambiar Contraseña</DialogTitle>
                      <DialogDescription>
                        Ingresa tu nueva contraseña. Debe tener al menos 6 caracteres.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="new-password">Nueva Contraseña</Label>
                        <Input
                          id="new-password"
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Mínimo 6 caracteres"
                          className="glass-panel border-border/50"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="confirm-password">Confirmar Contraseña</Label>
                        <Input
                          id="confirm-password"
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Repite la contraseña"
                          className="glass-panel border-border/50"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowPasswordDialog(false)}>
                        Cancelar
                      </Button>
                      <Button onClick={handleChangePassword} className="cyber-gradient">
                        Actualizar Contraseña
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                <Button
                  variant="outline"
                  className="w-full justify-start hover:bg-red-500/10 border-border/50"
                  onClick={handleSignOut}
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Cerrar Sesión
                </Button>
              </CardContent>
            </Card>

            <Card className="glass-panel border-red-500/30 bg-red-500/5 hover:border-red-500/50 transition-all duration-300 animate-scale-in" style={{ animationDelay: "0.2s" }}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-400 font-display">
                  <AlertTriangle className="w-5 h-5" />
                  Zona de Peligro
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                  <DialogTrigger asChild>
                    <Button variant="destructive" className="w-full">
                      <Trash2 className="w-4 h-4 mr-2" />
                      Eliminar Cuenta
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="glass-panel border-red-500/50">
                    <DialogHeader>
                      <DialogTitle className="text-red-400 font-display">
                        ⚠️ Eliminar Cuenta Permanentemente
                      </DialogTitle>
                      <DialogDescription>
                        Esta acción NO se puede deshacer. Se eliminarán permanentemente:
                      </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                      <ul className="space-y-2 text-sm text-muted-foreground">
                        <li className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                          Todos tus proyectos y archivos
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                          Tu historial de créditos
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                          Toda tu información personal
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                          Acceso a tu cuenta de Nexa One
                        </li>
                      </ul>
                      <div className="mt-6 space-y-2">
                        <Label htmlFor="delete-confirm">
                          Escribe <strong className="text-red-400">ELIMINAR</strong> para confirmar
                        </Label>
                        <Input
                          id="delete-confirm"
                          value={deleteConfirm}
                          onChange={(e) => setDeleteConfirm(e.target.value)}
                          placeholder="ELIMINAR"
                          className="font-mono glass-panel border-border/50"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowDeleteDialog(false);
                          setDeleteConfirm("");
                        }}
                      >
                        Cancelar
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={handleDeleteAccount}
                        disabled={deleteConfirm !== "ELIMINAR"}
                      >
                        Eliminar Cuenta Permanentemente
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
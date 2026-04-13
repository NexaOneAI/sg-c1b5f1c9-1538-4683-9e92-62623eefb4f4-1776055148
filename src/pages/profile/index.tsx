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
  Key
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
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
    free: "bg-gray-500/20 text-gray-300",
    pro: "bg-blue-500/20 text-blue-300",
    premium: "bg-purple-500/20 text-purple-300"
  }[subscription?.plan_type || "free"];

  const planLimits = {
    free: { credits: 100, projects: 3 },
    pro: { credits: 1000, projects: 50 },
    premium: { credits: "∞", projects: "∞" }
  }[subscription?.plan_type || "free"];

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
            </div>
            <div className="flex items-center gap-2">
              <Badge className="cyber-gradient">
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

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 neon-text-primary font-['Orbitron']">
            Mi Perfil
          </h1>
          <p className="text-muted-foreground">
            Gestiona tu información personal y configuración de cuenta
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="glass-panel border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5 text-primary" />
                  Información Personal
                </CardTitle>
                <CardDescription>
                  Actualiza tu información de perfil visible para otros usuarios
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-6">
                  <Avatar className="h-24 w-24 border-2 border-primary/50 neon-glow">
                    <AvatarImage src={formData.avatar_url} alt={formData.full_name} />
                    <AvatarFallback className="text-2xl bg-primary/20 text-primary">
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
                    />
                    <p className="text-xs text-muted-foreground">
                      Pega la URL de tu foto de perfil
                    </p>
                  </div>
                </div>

                <Separator />

                <div className="grid gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="full_name">Nombre Completo</Label>
                    <Input
                      id="full_name"
                      value={formData.full_name}
                      onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                      placeholder="Tu nombre completo"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={profile?.email || ""}
                      disabled
                      className="bg-muted/50"
                    />
                    <p className="text-xs text-muted-foreground">
                      El email no puede ser modificado por seguridad
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Rol</Label>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="capitalize">
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
                    className="cyber-gradient"
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

            <Card className="glass-panel border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="w-5 h-5 text-primary" />
                  Historial de Créditos
                </CardTitle>
                <CardDescription>
                  Últimas 10 transacciones de tu cuenta
                </CardDescription>
              </CardHeader>
              <CardContent>
                {transactions.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No hay transacciones registradas
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Descripción</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead className="text-right">Cantidad</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transactions.map((tx) => (
                        <TableRow key={tx.id}>
                          <TableCell className="text-xs text-muted-foreground">
                            {new Date(tx.created_at).toLocaleDateString("es-ES", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric"
                            })}
                          </TableCell>
                          <TableCell className="text-sm">
                            {tx.description || "Sin descripción"}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={
                                tx.type === "bonus" || tx.type === "admin_adjustment" && tx.amount > 0
                                  ? "border-green-500/50 text-green-500"
                                  : tx.type === "usage"
                                  ? "border-red-500/50 text-red-500"
                                  : "border-blue-500/50 text-blue-500"
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
                            <span className={tx.amount > 0 ? "text-green-500" : "text-red-500"}>
                              {tx.amount > 0 ? "+" : ""}{tx.amount}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="glass-panel border-primary/50 shadow-lg shadow-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-primary" />
                  Plan y Créditos
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center p-6 rounded-lg bg-primary/10 border border-primary/20">
                  <p className="text-sm text-muted-foreground mb-2">Créditos Disponibles</p>
                  <p className="text-5xl font-bold neon-text-primary font-['Orbitron']">
                    {credits.toLocaleString()}
                  </p>
                  {subscription?.plan_type !== "premium" && (
                    <p className="text-xs text-muted-foreground mt-2">
                      de {planLimits.credits} mensuales
                    </p>
                  )}
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Plan Actual</span>
                    <Badge className={planBadgeColor}>
                      {(subscription?.plan_type || "free").toUpperCase()}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Proyectos</span>
                    <span className="font-mono">
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
                  <Button className="w-full cyber-gradient" asChild>
                    <Link href="/pricing">
                      <TrendingUp className="w-4 h-4 mr-2" />
                      Mejorar Plan
                    </Link>
                  </Button>
                )}
              </CardContent>
            </Card>

            <Card className="glass-panel border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-primary" />
                  Seguridad
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full justify-start">
                      <Key className="w-4 h-4 mr-2" />
                      Cambiar Contraseña
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="glass-panel border-border/50">
                    <DialogHeader>
                      <DialogTitle>Cambiar Contraseña</DialogTitle>
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
                  className="w-full justify-start"
                  onClick={handleSignOut}
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Cerrar Sesión
                </Button>
              </CardContent>
            </Card>

            <Card className="glass-panel border-red-500/30 bg-red-500/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-500">
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
                      <DialogTitle className="text-red-500">
                        ⚠️ Eliminar Cuenta Permanentemente
                      </DialogTitle>
                      <DialogDescription>
                        Esta acción NO se puede deshacer. Se eliminarán permanentemente:
                      </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                      <ul className="space-y-2 text-sm text-muted-foreground">
                        <li>• Todos tus proyectos y archivos</li>
                        <li>• Tu historial de créditos</li>
                        <li>• Toda tu información personal</li>
                        <li>• Acceso a tu cuenta de Nexa One</li>
                      </ul>
                      <div className="mt-6 space-y-2">
                        <Label htmlFor="delete-confirm">
                          Escribe <strong>ELIMINAR</strong> para confirmar
                        </Label>
                        <Input
                          id="delete-confirm"
                          value={deleteConfirm}
                          onChange={(e) => setDeleteConfirm(e.target.value)}
                          placeholder="ELIMINAR"
                          className="font-mono"
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
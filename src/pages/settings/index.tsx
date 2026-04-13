import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { getCurrentProfile, updateProfile } from "@/services/profileService";
import { getCreditWallet } from "@/services/creditService";
import { ArrowLeft, User, CreditCard, Bell, Shield, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function SettingsPage() {
  return (
    <AuthGuard>
      <SettingsContent />
    </AuthGuard>
  );
}

function SettingsContent() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [credits, setCredits] = useState(0);
  const [formData, setFormData] = useState({
    full_name: "",
    avatar_url: "",
  });

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
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
    }

    setLoading(false);
  }

  async function handleSaveProfile() {
    setSaving(true);
    const success = await updateProfile(formData);
    
    if (success) {
      toast({
        title: "Perfil actualizado",
        description: "Tus cambios se han guardado correctamente.",
      });
      await loadSettings();
    } else {
      toast({
        title: "Error",
        description: "No se pudo actualizar el perfil.",
        variant: "destructive",
      });
    }
    
    setSaving(false);
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
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 neon-text-primary">Configuración</h1>
          <p className="text-muted-foreground">Administra tu cuenta y preferencias</p>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="glass-panel border-border/50">
            <TabsTrigger value="profile">
              <User className="h-4 w-4 mr-2" />
              Perfil
            </TabsTrigger>
            <TabsTrigger value="billing">
              <CreditCard className="h-4 w-4 mr-2" />
              Facturación
            </TabsTrigger>
            <TabsTrigger value="notifications">
              <Bell className="h-4 w-4 mr-2" />
              Notificaciones
            </TabsTrigger>
            <TabsTrigger value="security">
              <Shield className="h-4 w-4 mr-2" />
              Seguridad
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6">
            <Card className="glass-panel border-border/50">
              <CardHeader>
                <CardTitle>Información Personal</CardTitle>
                <CardDescription>Actualiza tu información de perfil</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profile?.email || ""}
                    disabled
                  />
                  <p className="text-xs text-muted-foreground">
                    El email no puede ser modificado
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="full_name">Nombre Completo</Label>
                  <Input
                    id="full_name"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="avatar_url">URL del Avatar</Label>
                  <Input
                    id="avatar_url"
                    value={formData.avatar_url}
                    onChange={(e) => setFormData({ ...formData, avatar_url: e.target.value })}
                    placeholder="https://..."
                  />
                </div>

                <div className="flex items-center gap-4 pt-4">
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
                      "Guardar Cambios"
                    )}
                  </Button>
                  <Badge variant="secondary">
                    Rol: {profile?.role || "user"}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="billing">
            <Card className="glass-panel border-border/50">
              <CardHeader>
                <CardTitle>Créditos y Facturación</CardTitle>
                <CardDescription>Administra tus créditos y plan</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg bg-primary/10 border border-primary/20">
                  <div>
                    <p className="text-sm text-muted-foreground">Créditos Disponibles</p>
                    <p className="text-3xl font-bold neon-text-primary">{credits.toLocaleString()}</p>
                  </div>
                  <Button className="cyber-gradient" asChild>
                    <Link href="/pricing">Comprar Créditos</Link>
                  </Button>
                </div>

                <div className="pt-4">
                  <h3 className="font-semibold mb-2">Historial de Transacciones</h3>
                  <p className="text-sm text-muted-foreground">
                    Próximamente disponible
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications">
            <Card className="glass-panel border-border/50">
              <CardHeader>
                <CardTitle>Preferencias de Notificaciones</CardTitle>
                <CardDescription>Controla cómo y cuándo te contactamos</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Configuración de notificaciones próximamente disponible.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security">
            <Card className="glass-panel border-border/50">
              <CardHeader>
                <CardTitle>Seguridad</CardTitle>
                <CardDescription>Protege tu cuenta</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button variant="outline" className="w-full" disabled>
                  Cambiar Contraseña
                </Button>
                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={handleSignOut}
                >
                  Cerrar Sesión
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
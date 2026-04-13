"use client";

import { useEffect, useState } from "react";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Logo } from "@/components/Logo";
import Link from "next/link";
import { useRouter } from "next/router";
import { 
  Users, 
  Wallet, 
  FileText, 
  Settings, 
  ArrowLeft,
  DollarSign,
  CreditCard,
  CheckCircle,
  XCircle,
  Search,
  Plus,
  Minus,
  Shield
} from "lucide-react";
import type { Database } from "@/integrations/supabase/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface UserData {
  id: string;
  email?: string;
  full_name?: string | null;
  role?: string | null;
  created_at: string;
  credits: number;
  plan: string;
  projectCount: number;
}

export default function AdminPanel() {
  const { toast } = useToast();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"users" | "credits" | "projects" | "payments" | "settings">("credits");
  const [users, setUsers] = useState<UserData[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [currentUserEmail, setCurrentUserEmail] = useState("");

  // Estado para ajuste manual de créditos
  const [selectedUserId, setSelectedUserId] = useState("");
  const [creditAmount, setCreditAmount] = useState("100");
  const [creditNote, setCreditNote] = useState("");

  useEffect(() => {
    checkAdminAccess();
  }, []);

  useEffect(() => {
    if (isSuperAdmin) {
      loadData();
    }
  }, [activeTab, isSuperAdmin]);

  async function checkAdminAccess() {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      router.push("/auth/login");
      return;
    }

    setCurrentUserEmail(user.email || "");

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role === "superadmin" && user.email === "nexaapporg@gmail.com") {
      setIsSuperAdmin(true);
    } else {
      toast({
        title: "❌ Acceso Denegado",
        description: "Solo el superadmin puede acceder a este panel",
        variant: "destructive",
      });
      setTimeout(() => router.push("/dashboard"), 2000);
    }
  }

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === "users" || activeTab === "credits") {
        await loadUsers();
      }
      if (activeTab === "payments") {
        await loadPayments();
      }
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    const { data: profilesData } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (profilesData) {
      const usersWithDetails = await Promise.all(
        profilesData.map(async (profile) => {
          const { data: wallet } = await supabase
            .from("credit_wallets")
            .select("balance")
            .eq("user_id", profile.id)
            .single();

          const { data: subscription } = await supabase
            .from("subscriptions")
            .select("plan_type, status")
            .eq("user_id", profile.id)
            .single();

          const { data: projects } = await supabase
            .from("projects")
            .select("id")
            .eq("user_id", profile.id)
            .eq("status", "active");

          return {
            ...profile,
            credits: wallet?.balance || 0,
            plan: subscription?.plan_type || "free",
            projectCount: projects?.length || 0,
          };
        })
      );
      setUsers(usersWithDetails);
    }
  };

  const loadPayments = async () => {
    const { data } = await supabase
      .from("payments")
      .select(`
        *,
        profiles:user_id (
          full_name,
          email
        )
      `)
      .order("created_at", { ascending: false })
      .limit(50);

    if (data) {
      setPayments(data);
    }
  };

  async function handleQuickCreditAdjustment(userId: string, amount: number) {
    const { data: wallet } = await supabase
      .from("credit_wallets")
      .select("id")
      .eq("user_id", userId)
      .single();

    if (!wallet) {
      toast({
        title: "Error",
        description: "No se encontró el wallet del usuario",
        variant: "destructive",
      });
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from("credit_transactions").insert({
      wallet_id: wallet.id,
      user_id: userId,
      amount,
      type: "admin_adjustment",
      description: `Ajuste manual por superadmin (${amount > 0 ? '+' : ''}${amount} créditos)`,
      metadata: { admin_id: user.id, admin_email: user.email },
    });

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "✅ Créditos ajustados",
        description: `${amount > 0 ? '+' : ''}${amount} créditos agregados`,
      });
      await loadUsers();
    }
  }

  async function handleCustomCreditAdjustment() {
    if (!selectedUserId || !creditAmount) {
      toast({
        title: "Error",
        description: "Selecciona un usuario y cantidad",
        variant: "destructive",
      });
      return;
    }

    const amount = parseInt(creditAmount);
    if (isNaN(amount)) {
      toast({
        title: "Error",
        description: "La cantidad debe ser un número",
        variant: "destructive",
      });
      return;
    }

    const { data: wallet } = await supabase
      .from("credit_wallets")
      .select("id")
      .eq("user_id", selectedUserId)
      .single();

    if (!wallet) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from("credit_transactions").insert({
      wallet_id: wallet.id,
      user_id: selectedUserId,
      amount,
      type: "admin_adjustment",
      description: creditNote || `Ajuste manual por superadmin (${amount > 0 ? '+' : ''}${amount} créditos)`,
      metadata: { 
        admin_id: user.id, 
        admin_email: user.email,
        note: creditNote 
      },
    });

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "✅ Créditos ajustados",
        description: `${amount > 0 ? '+' : ''}${amount} créditos para ${users.find(u => u.id === selectedUserId)?.email}`,
      });
      
      // Reset form
      setSelectedUserId("");
      setCreditAmount("100");
      setCreditNote("");
      
      await loadUsers();
    }
  }

  const filteredUsers = users.filter(user => 
    user.email?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    user.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isSuperAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="glass-panel border-border/50 max-w-md">
          <CardContent className="pt-6 text-center">
            <Shield className="h-16 w-16 mx-auto mb-4 text-red-500" />
            <h2 className="text-2xl font-bold mb-2">Acceso Denegado</h2>
            <p className="text-muted-foreground mb-4">
              Solo el superadmin puede acceder a este panel
            </p>
            <Button onClick={() => router.push("/dashboard")}>
              Volver al Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b border-white/10 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Logo href="/dashboard" size="sm" />
                <Badge variant="default" className="cyber-gradient">
                  <Shield className="w-3 h-3 mr-1" />
                  SUPERADMIN
                </Badge>
              </div>
              <Link href="/dashboard">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Volver al Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </header>

        <div className="container mx-auto px-6 py-8">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2 font-['Orbitron']">
              Panel de Superadmin
            </h1>
            <p className="text-muted-foreground">
              Gestión completa de usuarios, créditos, proyectos y pagos • {currentUserEmail}
            </p>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
            <Button
              variant={activeTab === "credits" ? "default" : "outline"}
              onClick={() => setActiveTab("credits")}
              className={activeTab === "credits" ? "cyber-gradient" : ""}
            >
              <Wallet className="w-4 h-4 mr-2" />
              Gestión de Créditos
            </Button>
            <Button
              variant={activeTab === "users" ? "default" : "outline"}
              onClick={() => setActiveTab("users")}
            >
              <Users className="w-4 h-4 mr-2" />
              Usuarios
            </Button>
            <Button
              variant={activeTab === "payments" ? "default" : "outline"}
              onClick={() => setActiveTab("payments")}
            >
              <CreditCard className="w-4 h-4 mr-2" />
              Pagos
            </Button>
            <Button
              variant={activeTab === "projects" ? "default" : "outline"}
              onClick={() => setActiveTab("projects")}
            >
              <FileText className="w-4 h-4 mr-2" />
              Proyectos
            </Button>
            <Button
              variant={activeTab === "settings" ? "default" : "outline"}
              onClick={() => setActiveTab("settings")}
            >
              <Settings className="w-4 h-4 mr-2" />
              Configuración
            </Button>
          </div>

          {/* Credits Tab - DESTACADO */}
          {activeTab === "credits" && (
            <div className="space-y-6">
              {/* Ajuste Rápido de Créditos */}
              <Card className="glass-panel border-primary/50 shadow-lg shadow-primary/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-2xl">
                    <Wallet className="w-6 h-6 text-primary" />
                    Ajuste Manual de Créditos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <Label>Seleccionar Usuario</Label>
                        <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                          <SelectTrigger>
                            <SelectValue placeholder="Elige un usuario..." />
                          </SelectTrigger>
                          <SelectContent>
                            {users.map((user) => (
                              <SelectItem key={user.id} value={user.id}>
                                {user.full_name || user.email} - {user.credits} créditos
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label>Cantidad de Créditos</Label>
                        <Input
                          type="number"
                          value={creditAmount}
                          onChange={(e) => setCreditAmount(e.target.value)}
                          placeholder="Ej: 100 o -50"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Usa números positivos para agregar, negativos para quitar
                        </p>
                      </div>

                      <div>
                        <Label>Nota (opcional)</Label>
                        <Input
                          value={creditNote}
                          onChange={(e) => setCreditNote(e.target.value)}
                          placeholder="Ej: Bonus por pruebas, Corrección de bug, etc."
                        />
                      </div>

                      <Button 
                        onClick={handleCustomCreditAdjustment}
                        className="w-full cyber-gradient"
                        size="lg"
                      >
                        <Wallet className="w-4 h-4 mr-2" />
                        Aplicar Ajuste
                      </Button>
                    </div>

                    <div className="space-y-3">
                      <Label>Ajustes Rápidos</Label>
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setCreditAmount("100");
                            setCreditNote("Bonus de 100 créditos");
                          }}
                          className="text-green-500 border-green-500/50 hover:bg-green-500/10"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          +100
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setCreditAmount("500");
                            setCreditNote("Bonus de 500 créditos");
                          }}
                          className="text-green-500 border-green-500/50 hover:bg-green-500/10"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          +500
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setCreditAmount("1000");
                            setCreditNote("Bonus de 1000 créditos");
                          }}
                          className="text-green-500 border-green-500/50 hover:bg-green-500/10"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          +1000
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setCreditAmount("5000");
                            setCreditNote("Bonus de 5000 créditos");
                          }}
                          className="text-green-500 border-green-500/50 hover:bg-green-500/10"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          +5000
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setCreditAmount("-50");
                            setCreditNote("Ajuste de -50 créditos");
                          }}
                          className="text-red-500 border-red-500/50 hover:bg-red-500/10"
                        >
                          <Minus className="w-4 h-4 mr-2" />
                          -50
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setCreditAmount("-100");
                            setCreditNote("Ajuste de -100 créditos");
                          }}
                          className="text-red-500 border-red-500/50 hover:bg-red-500/10"
                        >
                          <Minus className="w-4 h-4 mr-2" />
                          -100
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Lista de Usuarios con sus créditos */}
              <Card className="glass-panel border-border/50">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Balance de Créditos por Usuario</CardTitle>
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
                        <TableHead>Plan</TableHead>
                        <TableHead>Créditos</TableHead>
                        <TableHead>Acciones Rápidas</TableHead>
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
                            <Badge variant={user.plan === "premium" ? "default" : "secondary"}>
                              {user.plan.toUpperCase()}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span className="font-mono font-bold text-lg text-primary">
                              {user.credits}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleQuickCreditAdjustment(user.id, 100)}
                                className="text-green-500 hover:text-green-400"
                              >
                                <Plus className="h-3 w-3 mr-1" />
                                100
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleQuickCreditAdjustment(user.id, 500)}
                                className="text-green-500 hover:text-green-400"
                              >
                                <Plus className="h-3 w-3 mr-1" />
                                500
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedUserId(user.id);
                                  setActiveTab("credits");
                                  window.scrollTo({ top: 0, behavior: "smooth" });
                                }}
                                className="text-cyan-500 hover:text-cyan-400"
                              >
                                Personalizado
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Users Tab */}
          {activeTab === "users" && (
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
                      <TableHead>Proyectos</TableHead>
                      <TableHead>Registrado</TableHead>
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
                          <Badge variant={user.role === "superadmin" ? "default" : user.role === "admin" ? "secondary" : "outline"}>
                            {user.role || "user"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="font-mono">{user.credits}</span>
                        </TableCell>
                        <TableCell>{user.projectCount}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(user.created_at).toLocaleDateString("es-ES")}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* Payments Tab */}
          {activeTab === "payments" && (
            <Card className="glass-panel border-border/50">
              <CardHeader>
                <CardTitle>Historial de Pagos</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <p>Cargando...</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Usuario</TableHead>
                        <TableHead>Plan</TableHead>
                        <TableHead>Monto</TableHead>
                        <TableHead>Método</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Fecha</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payments.map((payment) => (
                        <TableRow key={payment.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">
                                {(payment.profiles as any)?.full_name || "Sin nombre"}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {(payment.profiles as any)?.email}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {(payment.metadata as any)?.plan_type?.toUpperCase() || "N/A"}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-mono">
                            ${parseFloat(payment.amount).toFixed(2)}
                          </TableCell>
                          <TableCell className="capitalize">{payment.payment_method}</TableCell>
                          <TableCell>
                            {payment.status === "completed" ? (
                              <Badge className="bg-green-500/20 text-green-500">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Completado
                              </Badge>
                            ) : (
                              <Badge variant="outline">
                                <XCircle className="w-3 h-3 mr-1" />
                                {payment.status}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {new Date(payment.created_at).toLocaleDateString("es-ES")}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          )}

          {/* Projects Tab */}
          {activeTab === "projects" && (
            <Card className="glass-panel border-border/50">
              <CardHeader>
                <CardTitle>Gestión de Proyectos</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">
                  Funcionalidad próximamente disponible.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Settings Tab */}
          {activeTab === "settings" && (
            <Card className="glass-panel border-border/50">
              <CardHeader>
                <CardTitle>Configuración del Sistema</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">
                  Funcionalidad próximamente disponible.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </AuthGuard>
  );
}
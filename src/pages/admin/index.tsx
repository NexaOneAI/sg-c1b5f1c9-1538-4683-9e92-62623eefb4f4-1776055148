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
  Minus
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
  const [activeTab, setActiveTab] = useState<"users" | "credits" | "projects" | "payments" | "settings">("users");
  const [users, setUsers] = useState<UserData[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Form states para agregar pago manual
  const [manualPaymentForm, setManualPaymentForm] = useState({
    userId: "",
    plan: "pro",
    amount: "29.99",
    paymentMethod: "manual",
    notes: "",
  });

  useEffect(() => {
    loadData();
  }, [activeTab]);

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

  const handleManualPayment = async () => {
    if (!manualPaymentForm.userId) {
      toast({
        title: "Error",
        description: "Selecciona un usuario",
        variant: "destructive",
      });
      return;
    }

    try {
      const planCredits = {
        free: 100,
        pro: 1000,
        premium: 999999,
      };

      const credits = planCredits[manualPaymentForm.plan as keyof typeof planCredits];

      // 1. Registrar pago
      const { data: payment } = await supabase
        .from("payments")
        .insert({
          user_id: manualPaymentForm.userId,
          amount: parseFloat(manualPaymentForm.amount),
          currency: "USD",
          status: "completed",
          payment_method: manualPaymentForm.paymentMethod,
          payment_provider: "manual",
          provider_payment_id: `MANUAL-${Date.now()}`,
          metadata: {
            plan_type: manualPaymentForm.plan,
            notes: manualPaymentForm.notes,
            registered_by: "admin",
          },
        })
        .select()
        .single();

      // 2. Crear/actualizar suscripción
      const startDate = new Date();
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 1);

      const { data: existingSub } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", manualPaymentForm.userId)
        .single();

      if (existingSub) {
        await supabase
          .from("subscriptions")
          .update({
            plan_type: manualPaymentForm.plan,
            status: "active",
            started_at: startDate.toISOString(),
            expires_at: endDate.toISOString(),
            auto_renew: false,
          })
          .eq("user_id", manualPaymentForm.userId);
      } else {
        await supabase.from("subscriptions").insert({
          user_id: manualPaymentForm.userId,
          plan_type: manualPaymentForm.plan,
          status: "active",
          started_at: startDate.toISOString(),
          expires_at: endDate.toISOString(),
          auto_renew: false,
        });
      }

      // 3. Asignar créditos
      const { data: wallet } = await supabase
        .from("credit_wallets")
        .select("id")
        .eq("user_id", manualPaymentForm.userId)
        .single();

      if (wallet) {
        await supabase.from("credit_transactions").insert({
          wallet_id: wallet.id,
          user_id: manualPaymentForm.userId,
          amount: credits,
          type: "purchase",
          description: `Plan ${manualPaymentForm.plan.toUpperCase()} - Pago manual`,
          metadata: {
            payment_id: payment?.id,
            plan: manualPaymentForm.plan,
            notes: manualPaymentForm.notes,
          },
        });

        // Actualizar perfil si es premium
        const isUnlimited = manualPaymentForm.plan === "premium";
        await supabase
          .from("profiles")
          .update({ unlimited_credits: isUnlimited })
          .eq("id", manualPaymentForm.userId);
      }

      toast({
        title: "✅ Pago registrado",
        description: `Plan ${manualPaymentForm.plan.toUpperCase()} activado con ${credits === 999999 ? "créditos ilimitados" : credits + " créditos"}`,
      });

      // Reset form
      setManualPaymentForm({
        userId: "",
        plan: "pro",
        amount: "29.99",
        paymentMethod: "manual",
        notes: "",
      });

      loadPayments();
      loadUsers();
    } catch (error: any) {
      console.error("Error registering payment:", error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

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

    await loadUsers();
  }

  const filteredUsers = users.filter(user => 
    user.email?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    user.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AuthGuard>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b border-white/10 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <Logo href="/dashboard" size="sm" />
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
              Panel de Administración
            </h1>
            <p className="text-muted-foreground">
              Gestión completa de usuarios, créditos, proyectos y pagos
            </p>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
            <Button
              variant={activeTab === "users" ? "default" : "outline"}
              onClick={() => setActiveTab("users")}
            >
              <Users className="w-4 h-4 mr-2" />
              Usuarios
            </Button>
            <Button
              variant={activeTab === "credits" ? "default" : "outline"}
              onClick={() => setActiveTab("credits")}
            >
              <Wallet className="w-4 h-4 mr-2" />
              Créditos
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

          {/* Payments Tab */}
          {activeTab === "payments" && (
            <div className="space-y-6">
              {/* Formulario de pago manual */}
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5" />
                    Registrar Pago Manual
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Usuario</Label>
                      <Select
                        value={manualPaymentForm.userId}
                        onValueChange={(value) =>
                          setManualPaymentForm({ ...manualPaymentForm, userId: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar usuario" />
                        </SelectTrigger>
                        <SelectContent>
                          {users.map((user) => (
                            <SelectItem key={user.id} value={user.id}>
                              {user.full_name || user.email} ({user.email})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Plan</Label>
                      <Select
                        value={manualPaymentForm.plan}
                        onValueChange={(value) => {
                          const amounts: Record<string, string> = {
                            free: "0",
                            pro: "29.99",
                            premium: "99.99",
                          };
                          setManualPaymentForm({
                            ...manualPaymentForm,
                            plan: value,
                            amount: amounts[value] || "0",
                          });
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="free">Free (100 créditos)</SelectItem>
                          <SelectItem value="pro">Pro (1,000 créditos)</SelectItem>
                          <SelectItem value="premium">Premium (Ilimitado)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Monto (USD)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={manualPaymentForm.amount}
                        onChange={(e) =>
                          setManualPaymentForm({ ...manualPaymentForm, amount: e.target.value })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Método de Pago</Label>
                      <Select
                        value={manualPaymentForm.paymentMethod}
                        onValueChange={(value) =>
                          setManualPaymentForm({ ...manualPaymentForm, paymentMethod: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="manual">Manual</SelectItem>
                          <SelectItem value="transfer">Transferencia</SelectItem>
                          <SelectItem value="cash">Efectivo</SelectItem>
                          <SelectItem value="mercadopago">Mercado Pago</SelectItem>
                          <SelectItem value="other">Otro</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label>Notas</Label>
                      <Input
                        placeholder="Ej: Pago vía transferencia - Comprobante #12345"
                        value={manualPaymentForm.notes}
                        onChange={(e) =>
                          setManualPaymentForm({ ...manualPaymentForm, notes: e.target.value })
                        }
                      />
                    </div>
                  </div>

                  <Button onClick={handleManualPayment} className="mt-4">
                    Registrar Pago y Activar Plan
                  </Button>
                </CardContent>
              </Card>

              {/* Historial de pagos */}
              <Card className="glass-card">
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
                          {new Date(user.created_at).toLocaleDateString("es-ES")}
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
          )}

          {/* Credits Tab */}
          {activeTab === "credits" && (
            <Card className="glass-panel border-border/50">
              <CardHeader>
                <CardTitle>Gestión de Créditos</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">
                  Configuraciones avanzadas próximamente disponibles.
                </p>
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
                  Configuraciones avanzadas próximamente disponibles.
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
                  Configuraciones avanzadas próximamente disponibles.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </AuthGuard>
  );
}
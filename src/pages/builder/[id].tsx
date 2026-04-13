import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  getProject, 
  getProjectFiles, 
  getProjectVersions,
} from "@/services/projectService";
import type { Project, ProjectFile, ProjectVersion } from "@/services/projectService";
import { 
  createConversation, 
  getConversationMessages,
  addMessage,
} from "@/services/conversationService";
import type { Conversation } from "@/services/conversationService";
import {
  connectGitHub,
  disconnectGitHub,
  getGitHubConnection,
  listGitHubRepos,
  connectProjectToRepo,
  pushToGitHub,
} from "@/services/githubService";
import {
  setCustomSubdomain,
  deployToVercel,
  checkSubdomainAvailability,
  generateSubdomain,
} from "@/services/deploymentService";
import { ChatPanel } from "@/components/builder/ChatPanel";
import { PreviewPanel } from "@/components/builder/PreviewPanel";
import { FileExplorer } from "@/components/builder/FileExplorer";
import { VersionHistory } from "@/components/builder/VersionHistory";
import { 
  ArrowLeft, 
  Code2, 
  FileText, 
  History, 
  Sparkles,
  Loader2,
  Github,
  Rocket,
  Link as LinkIcon,
  Check,
  X,
  MessageSquare,
  FileCode,
  Clock,
} from "lucide-react";

type AIModel = "gpt4" | "claude_sonnet" | "claude_opus";

export default function BuilderPage() {
  return (
    <AuthGuard>
      <BuilderContent />
    </AuthGuard>
  );
}

function BuilderContent() {
  const router = useRouter();
  const { id } = router.query;
  const [project, setProject] = useState<Project | null>(null);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [files, setFiles] = useState<ProjectFile[]>([]);
  const [versions, setVersions] = useState<ProjectVersion[]>([]);
  const [selectedFile, setSelectedFile] = useState<ProjectFile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState("chat");
  
  // GitHub state
  const [showGitHubModal, setShowGitHubModal] = useState(false);
  const [githubConnected, setGithubConnected] = useState(false);
  const [githubRepos, setGithubRepos] = useState<any[]>([]);
  const [selectedRepo, setSelectedRepo] = useState("");
  const [commitMessage, setCommitMessage] = useState("");
  const [isPushing, setIsPushing] = useState(false);
  
  // Deploy state
  const [showDeployModal, setShowDeployModal] = useState(false);
  const [customSubdomain, setCustomSubdomain] = useState("");
  const [subdomainAvailable, setSubdomainAvailable] = useState<boolean | null>(null);
  const [isDeploying, setIsDeploying] = useState(false);

  const { toast } = useToast();

  useEffect(() => {
    loadProject();
    checkGitHubConnection();
  }, [id]);

  async function loadProject() {
    if (!id || typeof id !== "string") return;

    const projectData = await getProject(id);
    
    if (!projectData) {
      router.push("/dashboard");
      return;
    }

    setProject(projectData);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Obtener la primera conversación activa o crear una nueva
    const { data: convData } = await supabase
      .from("conversations")
      .select("*")
      .eq("project_id", projectData.id)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(1);

    let conversationData = convData && convData.length > 0 ? convData[0] : null;
    
    if (!conversationData) {
      conversationData = await createConversation(projectData.id, user.id);
    }

    if (conversationData) {
      setConversation(conversationData);
      const messagesData = await getConversationMessages(conversationData.id);
      setMessages(messagesData);
    }

    const [filesData, versionsData] = await Promise.all([
      getProjectFiles(projectData.id),
      getProjectVersions(projectData.id),
    ]);

    setFiles(filesData);
    setVersions(versionsData);
    setLoading(false);
  }

  async function checkGitHubConnection() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const connection = await getGitHubConnection(user.id);
    setGithubConnected(!!connection);

    if (connection) {
      const repos = await listGitHubRepos(user.id);
      setGithubRepos(repos);
    }
  }

  async function handleConnectGitHub() {
    await connectGitHub();
  }

  async function handleDisconnectGitHub() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const success = await disconnectGitHub(user.id);
    if (success) {
      setGithubConnected(false);
      setGithubRepos([]);
      toast({ title: "✅ GitHub desconectado" });
    }
  }

  async function handleConnectRepo() {
    if (!project || !selectedRepo) return;

    const repo = githubRepos.find(r => r.full_name === selectedRepo);
    if (!repo) return;

    const updated = await connectProjectToRepo(project.id, repo.html_url, repo.default_branch);
    
    if (updated) {
      setProject(updated);
      toast({
        title: "✅ Repositorio conectado",
        description: `Proyecto vinculado a ${repo.full_name}`,
      });
      setShowGitHubModal(false);
    }
  }

  async function handlePushToGitHub() {
    if (!project || !commitMessage.trim()) return;

    setIsPushing(true);

    try {
      const result = await pushToGitHub(project.id, commitMessage);
      
      toast({
        title: "✅ Push exitoso",
        description: "Cambios enviados a GitHub",
      });

      setCommitMessage("");
      
      if (result.commitUrl) {
        window.open(result.commitUrl, "_blank");
      }
    } catch (error: any) {
      toast({
        title: "❌ Error en push",
        description: error.message,
        variant: "destructive",
      });
    }

    setIsPushing(false);
  }

  async function handleCheckSubdomain(value: string) {
    setCustomSubdomain(value);
    
    if (value.length < 3) {
      setSubdomainAvailable(null);
      return;
    }

    const available = await checkSubdomainAvailability(value);
    setSubdomainAvailable(available);
  }

  async function handleDeploy() {
    if (!project || !customSubdomain || !subdomainAvailable) return;

    setIsDeploying(true);

    try {
      const result = await deployToVercel({
        projectId: project.id,
        subdomain: customSubdomain,
        githubRepoUrl: project.github_repo_url || undefined,
      });

      if (result.success) {
        toast({
          title: "✅ Deploy iniciado",
          description: `Tu app estará disponible en ${result.deploymentUrl}`,
        });

        setShowDeployModal(false);
        
        // Actualizar proyecto
        const updatedProject = await getProject(project.id);
        if (updatedProject) {
          setProject(updatedProject);
        }
      }
    } catch (error: any) {
      toast({
        title: "❌ Error en deploy",
        description: error.message,
        variant: "destructive",
      });
    }

    setIsDeploying(false);
  }

  async function handleSendMessage(content: string, model: AIModel) {
    if (!conversation || !project) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    setIsProcessing(true);

    // Agregar mensaje del usuario
    const userMessage = await addMessage(conversation.id, project.id, user.id, "user", content);
    if (userMessage) {
      setMessages((prev) => [...prev, userMessage]);
    }

    try {
      // Obtener el token de sesión actual
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        const errorMessage = await addMessage(
          conversation.id,
          project.id,
          user.id,
          "assistant",
          "❌ Error: Sesión expirada. Por favor, recarga la página e inicia sesión nuevamente."
        );
        
        if (errorMessage) {
          setMessages((prev) => [...prev, errorMessage]);
        }
        setIsProcessing(false);
        return;
      }

      // Llamar a la API de generación real con el token de autenticación
      const response = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`, // Enviar token de sesión
        },
        body: JSON.stringify({
          projectId: project.id,
          userId: user.id,
          prompt: content,
          model: model,
          context: {
            files: files.map(f => ({ path: f.file_path, content: f.content })),
            previousMessages: messages.slice(-5).map(m => ({
              role: m.role,
              content: m.content,
            })),
          },
        }),
      });

      const result = await response.json();

      if (!result.success) {
        const errorMessage = await addMessage(
          conversation.id,
          project.id,
          user.id,
          "assistant",
          `❌ Error: ${result.error}`
        );
        
        if (errorMessage) {
          setMessages((prev) => [...prev, errorMessage]);
        }
        setIsProcessing(false);
        return;
      }

      // Agregar respuesta del asistente
      const assistantMessage = await addMessage(
        conversation.id,
        project.id,
        user.id,
        "assistant",
        result.code.explanation || "Código generado exitosamente",
        {
          modelUsed: result.modelUsed,
          creditsUsed: result.creditsUsed,
          filesGenerated: result.code.files?.length || 0,
        }
      );
      
      if (assistantMessage) {
        setMessages((prev) => [...prev, assistantMessage]);
      }

      // Recargar archivos y versiones del proyecto
      const [updatedFiles, updatedVersions] = await Promise.all([
        getProjectFiles(project.id),
        getProjectVersions(project.id),
      ]);

      setFiles(updatedFiles);
      setVersions(updatedVersions);

    } catch (error: any) {
      const errorMessage = await addMessage(
        conversation.id,
        project.id,
        user.id,
        "assistant",
        `❌ Error de conexión: ${error.message}`
      );
      
      if (errorMessage) {
        setMessages((prev) => [...prev, errorMessage]);
      }
    }
    
    setIsProcessing(false);
  }

  async function handleRestoreVersion(version: ProjectVersion) {
    console.log("Restaurando versión:", version.version_number);
    // TODO: Implementar lógica de restauración
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background cyber-background">
        <div className="text-center space-y-4">
          <div className="cyber-spinner w-16 h-16 mx-auto" />
          <p className="text-muted-foreground">Cargando proyecto...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background cyber-background">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">Proyecto no encontrado</p>
          <Button asChild>
            <Link href="/dashboard">Volver al Dashboard</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background cyber-background flex flex-col">
      <nav className="border-b border-border/50 backdrop-blur-xl bg-background/60 sticky top-0 z-50 shadow-lg safe-area-inset">
        <div className="px-4 sm:px-6">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" asChild className="hover:bg-primary/10">
                <Link href="/dashboard">
                  <ArrowLeft className="h-4 w-4" />
                </Link>
              </Button>
              <Logo size="sm" />
              <Separator orientation="vertical" className="h-8 bg-border/50" />
              <div>
                <h2 className="font-bold text-lg neon-text-primary font-display">{project.name}</h2>
                <p className="text-xs text-muted-foreground">Builder</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* GitHub Button */}
              {githubConnected ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowGitHubModal(true)}
                  className="border-green-500/50 hover:bg-green-500/10"
                >
                  <Github className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">GitHub Conectado</span>
                  <Check className="w-3 h-3 ml-2 text-green-400" />
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleConnectGitHub}
                  className="border-border/50 hover:bg-primary/10"
                >
                  <Github className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Conectar GitHub</span>
                </Button>
              )}

              {/* Deploy Button */}
              <Button
                variant="default"
                size="sm"
                onClick={() => {
                  if (!customSubdomain && project.name) {
                    setCustomSubdomain(generateSubdomain(project.name));
                  }
                  setShowDeployModal(true);
                }}
                className="cyber-gradient shadow-glow"
              >
                <Rocket className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Deploy</span>
              </Button>

              <Badge className="cyber-gradient hidden lg:flex">
                <Sparkles className="w-3 h-3 mr-1" />
                IA Activa
              </Badge>
            </div>
          </div>
        </div>
      </nav>

      {/* GitHub Modal */}
      <Dialog open={showGitHubModal} onOpenChange={setShowGitHubModal}>
        <DialogContent className="glass-panel border-border/50 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display flex items-center gap-2">
              <Github className="w-5 h-5 text-primary" />
              Integración con GitHub
            </DialogTitle>
            <DialogDescription>
              {project.github_repo_url 
                ? "Push tus cambios al repositorio conectado"
                : "Conecta tu proyecto a un repositorio de GitHub"
              }
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {!project.github_repo_url ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="repo">Selecciona un Repositorio</Label>
                  <select
                    id="repo"
                    value={selectedRepo}
                    onChange={(e) => setSelectedRepo(e.target.value)}
                    className="w-full px-3 py-2 rounded-md glass-panel border-border/50 focus:border-primary/50"
                  >
                    <option value="">-- Seleccionar --</option>
                    {githubRepos.map((repo) => (
                      <option key={repo.id} value={repo.full_name}>
                        {repo.full_name}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-muted-foreground">
                    {githubRepos.length === 0 
                      ? "No tienes repositorios. Crea uno en GitHub primero."
                      : `${githubRepos.length} repositorios disponibles`
                    }
                  </p>
                </div>

                <Button 
                  onClick={handleConnectRepo} 
                  disabled={!selectedRepo}
                  className="w-full cyber-gradient"
                >
                  <LinkIcon className="w-4 h-4 mr-2" />
                  Conectar Repositorio
                </Button>
              </>
            ) : (
              <>
                <div className="space-y-2 p-4 rounded-lg bg-green-500/10 border border-green-500/30">
                  <p className="text-sm font-medium text-green-400">Repositorio Conectado</p>
                  <a 
                    href={project.github_repo_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-xs text-blue-400 hover:underline block"
                  >
                    {project.github_repo_url}
                  </a>
                  <p className="text-xs text-muted-foreground">
                    Rama: {project.github_branch || "main"}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="commit">Mensaje del Commit</Label>
                  <Textarea
                    id="commit"
                    value={commitMessage}
                    onChange={(e) => setCommitMessage(e.target.value)}
                    placeholder="Describe los cambios realizados..."
                    rows={3}
                    className="glass-panel border-border/50"
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={handlePushToGitHub}
                    disabled={!commitMessage.trim() || isPushing}
                    className="flex-1 cyber-gradient"
                  >
                    {isPushing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Pushing...
                      </>
                    ) : (
                      <>
                        <Github className="w-4 h-4 mr-2" />
                        Push a GitHub
                      </>
                    )}
                  </Button>

                  <Button
                    variant="outline"
                    onClick={handleDisconnectGitHub}
                    className="border-red-500/50 hover:bg-red-500/10"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Deploy Modal */}
      <Dialog open={showDeployModal} onOpenChange={setShowDeployModal}>
        <DialogContent className="glass-panel border-border/50 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display flex items-center gap-2">
              <Rocket className="w-5 h-5 text-accent" />
              Deploy a Producción
            </DialogTitle>
            <DialogDescription>
              Configura tu subdominio personalizado en nexaoneia.com
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="subdomain">Subdominio</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="subdomain"
                  value={customSubdomain}
                  onChange={(e) => handleCheckSubdomain(e.target.value.toLowerCase())}
                  placeholder="mi-app"
                  className="glass-panel border-border/50"
                />
                <span className="text-sm text-muted-foreground whitespace-nowrap">
                  .nexaoneia.com
                </span>
              </div>
              
              {customSubdomain.length >= 3 && (
                <div className="flex items-center gap-2">
                  {subdomainAvailable === null ? (
                    <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                  ) : subdomainAvailable ? (
                    <>
                      <Check className="w-4 h-4 text-green-400" />
                      <span className="text-xs text-green-400">Disponible</span>
                    </>
                  ) : (
                    <>
                      <X className="w-4 h-4 text-red-400" />
                      <span className="text-xs text-red-400">No disponible</span>
                    </>
                  )}
                </div>
              )}

              <p className="text-xs text-muted-foreground">
                Solo letras minúsculas, números y guiones. Mínimo 3 caracteres.
              </p>
            </div>

            {project.deployment_url && (
              <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/30">
                <p className="text-sm font-medium text-blue-400 mb-1">Deployment Actual</p>
                <a 
                  href={project.deployment_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-xs text-blue-400 hover:underline block break-all"
                >
                  {project.deployment_url}
                </a>
                {project.deployment_status && (
                  <Badge 
                    variant="outline" 
                    className="mt-2 text-xs border-blue-500/30"
                  >
                    {project.deployment_status}
                  </Badge>
                )}
              </div>
            )}

            <Button
              onClick={handleDeploy}
              disabled={!customSubdomain || !subdomainAvailable || isDeploying}
              className="w-full cyber-gradient shadow-glow"
            >
              {isDeploying ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Desplegando...
                </>
              ) : (
                <>
                  <Rocket className="w-4 h-4 mr-2" />
                  Desplegar a {customSubdomain}.nexaoneia.com
                </>
              )}
            </Button>

            {!project.github_repo_url && (
              <p className="text-xs text-amber-400 flex items-start gap-2">
                <span>⚠️</span>
                <span>
                  Conecta GitHub primero para deploys automáticos con CI/CD
                </span>
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Main Content - Fixed Height Layout */}
      <main className="flex-1 flex overflow-hidden">
        {/* Desktop: Side by Side | Mobile: Tabs */}
        <div className="hidden lg:flex w-full">
          {/* Left Panel: Chat + Files + Versions - Scrollable */}
          <div className="w-1/3 border-r border-border/50 flex flex-col bg-card/30">
            <Tabs defaultValue="chat" className="flex-1 flex flex-col">
              <TabsList className="w-full justify-start rounded-none border-b border-border/50 bg-transparent px-4">
                <TabsTrigger value="chat" className="data-[state=active]:bg-primary/10">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Chat IA
                </TabsTrigger>
                <TabsTrigger value="files" className="data-[state=active]:bg-primary/10">
                  <FileCode className="w-4 h-4 mr-2" />
                  Archivos
                </TabsTrigger>
                <TabsTrigger value="versions" className="data-[state=active]:bg-primary/10">
                  <Clock className="w-4 h-4 mr-2" />
                  Versiones
                </TabsTrigger>
              </TabsList>

              <TabsContent value="chat" className="flex-1 m-0 overflow-hidden">
                <ChatPanel
                  messages={messages}
                  onSendMessage={handleSendMessage}
                  isProcessing={isProcessing}
                />
              </TabsContent>

              <TabsContent value="files" className="flex-1 m-0 overflow-hidden">
                <FileExplorer
                  files={files}
                  onFileSelect={(file) => {
                    // Opcional: mostrar contenido del archivo
                    console.log("File selected:", file);
                  }}
                />
              </TabsContent>

              <TabsContent value="versions" className="flex-1 m-0 overflow-hidden">
                <VersionHistory
                  versions={versions}
                  onRestoreVersion={(version) => {
                    // Recargar archivos de esa versión
                    console.log("Restore version:", version);
                  }}
                />
              </TabsContent>
            </Tabs>
          </div>

          {/* Right Panel: Preview - Sticky */}
          <div className="flex-1 bg-muted/20">
            <PreviewPanel projectId={project.id} />
          </div>
        </div>

        {/* Mobile: Tabs Layout */}
        <div className="lg:hidden flex flex-col w-full">
          <Tabs defaultValue="preview" className="flex-1 flex flex-col">
            <TabsList className="w-full justify-start rounded-none border-b border-border/50 bg-transparent px-2 safe-area-inset">
              <TabsTrigger value="preview" className="data-[state=active]:bg-primary/10 text-xs">
                <FileText className="w-3 h-3 mr-1" />
                Preview
              </TabsTrigger>
              <TabsTrigger value="chat" className="data-[state=active]:bg-primary/10 text-xs">
                <MessageSquare className="w-3 h-3 mr-1" />
                Chat
              </TabsTrigger>
              <TabsTrigger value="files" className="data-[state=active]:bg-primary/10 text-xs">
                <FileCode className="w-3 h-3 mr-1" />
                Archivos
              </TabsTrigger>
              <TabsTrigger value="versions" className="data-[state=active]:bg-primary/10 text-xs">
                <Clock className="w-3 h-3 mr-1" />
                Historial
              </TabsTrigger>
            </TabsList>

            <TabsContent value="preview" className="flex-1 m-0 overflow-hidden">
              <PreviewPanel projectId={project.id} />
            </TabsContent>

            <TabsContent value="chat" className="flex-1 m-0 overflow-hidden">
              <ChatPanel
                messages={messages}
                onSendMessage={handleSendMessage}
                isProcessing={isProcessing}
              />
            </TabsContent>

            <TabsContent value="files" className="flex-1 m-0 overflow-hidden">
              <FileExplorer
                files={files}
                onFileSelect={(file) => console.log("File selected:", file)}
              />
            </TabsContent>

            <TabsContent value="versions" className="flex-1 m-0 overflow-hidden">
              <VersionHistory
                versions={versions}
                onRestoreVersion={(version) => console.log("Restore version:", version)}
              />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
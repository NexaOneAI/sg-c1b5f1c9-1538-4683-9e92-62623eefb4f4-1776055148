import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChatPanel } from "@/components/builder/ChatPanel";
import { PreviewPanel } from "@/components/builder/PreviewPanel";
import { FileExplorer } from "@/components/builder/FileExplorer";
import { VersionHistory } from "@/components/builder/VersionHistory";
import { supabase } from "@/integrations/supabase/client";
import { getProject } from "@/services/projectService";
import { getProjectFiles, getProjectVersions } from "@/services/projectService";
import { getProjectConversation, createConversation, getConversationMessages, addMessage } from "@/services/conversationService";
import type { Project, ProjectFile, ProjectVersion } from "@/services/projectService";
import type { Conversation, Message } from "@/services/conversationService";
import { ArrowLeft, Loader2, Settings, FileCode, Clock, MessageSquare } from "lucide-react";

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
  const [messages, setMessages] = useState<Message[]>([]);
  const [files, setFiles] = useState<ProjectFile[]>([]);
  const [versions, setVersions] = useState<ProjectVersion[]>([]);
  const [selectedFile, setSelectedFile] = useState<ProjectFile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState("chat");

  useEffect(() => {
    if (id && typeof id === "string") {
      loadBuilderData(id);
    }
  }, [id]);

  async function loadBuilderData(projectId: string) {
    const projectData = await getProject(projectId);
    
    if (!projectData) {
      router.push("/dashboard");
      return;
    }

    setProject(projectData);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    let conversationData = await getProjectConversation(projectId);
    
    if (!conversationData) {
      conversationData = await createConversation(projectId, user.id);
    }

    if (conversationData) {
      setConversation(conversationData);
      const messagesData = await getConversationMessages(conversationData.id);
      setMessages(messagesData);
    }

    const [filesData, versionsData] = await Promise.all([
      getProjectFiles(projectId),
      getProjectVersions(projectId),
    ]);

    setFiles(filesData);
    setVersions(versionsData);
    setLoading(false);
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
      // Llamar a la API de generación real
      const response = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!project) {
    return null;
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      <nav className="border-b border-border/50 backdrop-blur-sm bg-background/80 z-50">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" asChild>
                <Link href="/dashboard">
                  <ArrowLeft className="h-4 w-4" />
                </Link>
              </Button>
              
              <Logo size="sm" />
              
              <div className="border-l border-border/50 pl-4">
                <h1 className="text-lg font-semibold">{project.name}</h1>
                <p className="text-xs text-muted-foreground">
                  {project.description || "Sin descripción"}
                </p>
              </div>
            </div>
            
            <Button variant="ghost" size="icon">
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </nav>

      <div className="flex-1 flex overflow-hidden">
        <div className="w-[400px] flex-shrink-0 hidden lg:block">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <TabsList className="grid grid-cols-3 m-2">
              <TabsTrigger value="chat">
                <MessageSquare className="h-4 w-4 mr-2" />
                Chat
              </TabsTrigger>
              <TabsTrigger value="files">
                <FileCode className="h-4 w-4 mr-2" />
                Archivos
              </TabsTrigger>
              <TabsTrigger value="history">
                <Clock className="h-4 w-4 mr-2" />
                Versiones
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="chat" className="flex-1 m-0">
              <ChatPanel
                messages={messages}
                onSendMessage={handleSendMessage}
                isProcessing={isProcessing}
              />
            </TabsContent>
            
            <TabsContent value="files" className="flex-1 m-0">
              <FileExplorer
                files={files}
                selectedFile={selectedFile?.id}
                onSelectFile={setSelectedFile}
              />
            </TabsContent>
            
            <TabsContent value="history" className="flex-1 m-0">
              <VersionHistory
                versions={versions}
                currentVersionId={versions.find((v) => v.is_current)?.id}
                onRestoreVersion={handleRestoreVersion}
              />
            </TabsContent>
          </Tabs>
        </div>

        <div className="flex-1 overflow-hidden">
          <PreviewPanel projectId={project.id} />
        </div>
      </div>
    </div>
  );
}
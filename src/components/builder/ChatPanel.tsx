import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Send, Sparkles, Loader2, User, Bot } from "lucide-react";

type AIModel = "gpt4" | "gpt3" | "claude_sonnet" | "claude_opus";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
  metadata?: {
    modelUsed?: string;
    creditsUsed?: number;
    filesGenerated?: number;
  };
}

interface ChatPanelProps {
  messages: Message[];
  onSendMessage: (content: string, model: AIModel) => void;
  isProcessing: boolean;
}

export function ChatPanel({ messages, onSendMessage, isProcessing }: ChatPanelProps) {
  const [input, setInput] = useState("");
  const [selectedModel, setSelectedModel] = useState<AIModel>("gpt4");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Auto-scroll al final cuando llegan nuevos mensajes
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || isProcessing) return;

    onSendMessage(input.trim(), selectedModel);
    setInput("");
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  }

  return (
    <div className="flex flex-col h-full bg-card/20">
      {/* Header con selector de modelo */}
      <div className="p-3 sm:p-4 border-b border-border/50 bg-card/30 backdrop-blur-sm">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">Modelo IA:</span>
          </div>
          <Select value={selectedModel} onValueChange={(v) => setSelectedModel(v as AIModel)}>
            <SelectTrigger className="w-full sm:w-[200px] glass-panel border-border/50">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="glass-panel border-border/50">
              <SelectItem value="gpt4">
                <div className="flex flex-col items-start">
                  <span>GPT-4o Mini</span>
                  <span className="text-xs text-muted-foreground">10 créditos • Rápido</span>
                </div>
              </SelectItem>
              <SelectItem value="gpt3">
                <div className="flex flex-col items-start">
                  <span>GPT-3.5 Turbo</span>
                  <span className="text-xs text-muted-foreground">5 créditos • Muy rápido</span>
                </div>
              </SelectItem>
              <SelectItem value="claude_sonnet">
                <div className="flex flex-col items-start">
                  <span>Claude 3.5 Sonnet</span>
                  <span className="text-xs text-muted-foreground">20 créditos • Arquitectura</span>
                </div>
              </SelectItem>
              <SelectItem value="claude_opus">
                <div className="flex flex-col items-start">
                  <span>Claude 3 Opus</span>
                  <span className="text-xs text-muted-foreground">40 créditos • Máxima calidad</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Mensajes - ScrollArea con altura fija */}
      <ScrollArea className="flex-1 px-3 sm:px-4" ref={scrollAreaRef}>
        <div className="py-4 space-y-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Sparkles className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Comienza a construir con IA</h3>
              <p className="text-sm text-muted-foreground max-w-sm px-4">
                Describe qué quieres crear y la IA generará el código completo para ti
              </p>
              <div className="mt-6 space-y-2 text-xs text-muted-foreground">
                <p className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                  "Crea un formulario de contacto con validación"
                </p>
                <p className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                  "Agrega una navbar responsive con menú móvil"
                </p>
                <p className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                  "Crea un dashboard con gráficas de ventas"
                </p>
              </div>
            </div>
          ) : (
            <>
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  {message.role === "assistant" && (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shrink-0">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                  )}

                  <div
                    className={`max-w-[85%] sm:max-w-[75%] rounded-lg p-3 sm:p-4 ${
                      message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "glass-panel border border-border/50"
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>

                    {message.metadata && (
                      <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-border/30">
                        {message.metadata.modelUsed && (
                          <Badge variant="outline" className="text-xs border-primary/30">
                            {message.metadata.modelUsed}
                          </Badge>
                        )}
                        {message.metadata.creditsUsed && (
                          <Badge variant="outline" className="text-xs border-accent/30">
                            -{message.metadata.creditsUsed} créditos
                          </Badge>
                        )}
                        {message.metadata.filesGenerated && (
                          <Badge variant="outline" className="text-xs border-green-500/30">
                            {message.metadata.filesGenerated} archivos
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>

                  {message.role === "user" && (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center shrink-0">
                      <User className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>
              ))}

              {isProcessing && (
                <div className="flex gap-3 justify-start">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shrink-0">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                  <div className="glass-panel border border-border/50 rounded-lg p-4 max-w-[75%]">
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-primary" />
                      <span className="text-sm text-muted-foreground">Generando código...</span>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </>
          )}
        </div>
      </ScrollArea>

      {/* Input - Siempre visible al final */}
      <div className="p-3 sm:p-4 border-t border-border/50 bg-card/30 backdrop-blur-sm safe-area-inset">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe lo que quieres crear..."
            disabled={isProcessing}
            rows={2}
            className="resize-none glass-panel border-border/50 focus:border-primary/50 text-sm sm:text-base"
          />
          <Button
            type="submit"
            disabled={!input.trim() || isProcessing}
            size="icon"
            className="cyber-gradient shadow-glow shrink-0 h-auto w-12 sm:w-14"
          >
            {isProcessing ? (
              <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
            ) : (
              <Send className="w-4 h-4 sm:w-5 sm:h-5" />
            )}
          </Button>
        </form>
        <p className="text-xs text-muted-foreground mt-2 text-center">
          Shift + Enter para nueva línea
        </p>
      </div>
    </div>
  );
}
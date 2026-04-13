import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Send, Sparkles, User, Loader2, Zap, Brain, Cpu } from "lucide-react";
import type { Message } from "@/services/conversationService";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

type AIModel = "gpt4" | "claude_sonnet" | "claude_opus";

interface ChatPanelProps {
  messages: Message[];
  onSendMessage: (content: string, model: AIModel) => Promise<void>;
  isProcessing: boolean;
}

const AI_MODELS = [
  { 
    value: "gpt4" as const, 
    label: "GPT-4 Turbo", 
    cost: 10,
    icon: Zap,
    description: "Rápido y eficiente"
  },
  { 
    value: "claude_sonnet" as const, 
    label: "Claude Sonnet", 
    cost: 20,
    icon: Brain,
    description: "Arquitectura compleja"
  },
  { 
    value: "claude_opus" as const, 
    label: "Claude Opus", 
    cost: 40,
    icon: Cpu,
    description: "Máxima calidad"
  },
];

export function ChatPanel({ messages, onSendMessage, isProcessing }: ChatPanelProps) {
  const [input, setInput] = useState("");
  const [selectedModel, setSelectedModel] = useState<AIModel>("gpt4");
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || isProcessing) return;

    const content = input;
    setInput("");
    await onSendMessage(content, selectedModel);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  }

  const currentModel = AI_MODELS.find(m => m.value === selectedModel) || AI_MODELS[0];
  const ModelIcon = currentModel.icon;

  return (
    <div className="flex flex-col h-full bg-card/50 border-r border-border/50">
      <div className="p-4 border-b border-border/50 space-y-3">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          Chat IA
        </h2>
        
        <Select value={selectedModel} onValueChange={(v) => setSelectedModel(v as AIModel)}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {AI_MODELS.map((model) => {
              const Icon = model.icon;
              return (
                <SelectItem key={model.value} value={model.value}>
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    <div className="flex flex-col">
                      <span className="font-medium">{model.label}</span>
                      <span className="text-xs text-muted-foreground">
                        {model.description} • {model.cost} créditos
                      </span>
                    </div>
                  </div>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>

      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                <Sparkles className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Comienza a crear</h3>
              <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                Escribe qué aplicación quieres construir y Nexa One la generará para ti
              </p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${
                  message.role === "user" ? "flex-row-reverse" : ""
                }`}
              >
                <Avatar className="w-8 h-8 flex-shrink-0">
                  <div className={`w-full h-full flex items-center justify-center ${
                    message.role === "user" 
                      ? "bg-primary/20" 
                      : "bg-accent/20"
                  }`}>
                    {message.role === "user" ? (
                      <User className="h-4 w-4" />
                    ) : (
                      <Sparkles className="h-4 w-4" />
                    )}
                  </div>
                </Avatar>
                
                <div className={`flex-1 ${message.role === "user" ? "text-right" : ""}`}>
                  <Card className={`inline-block max-w-[85%] p-3 ${
                    message.role === "user"
                      ? "bg-primary/10 border-primary/20"
                      : "glass-panel border-border/50"
                  }`}>
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  </Card>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDistanceToNow(new Date(message.created_at), {
                      addSuffix: true,
                      locale: es,
                    })}
                  </p>
                </div>
              </div>
            ))
          )}
          
          {isProcessing && (
            <div className="flex gap-3">
              <Avatar className="w-8 h-8 flex-shrink-0">
                <div className="w-full h-full flex items-center justify-center bg-accent/20">
                  <Sparkles className="h-4 w-4 animate-pulse" />
                </div>
              </Avatar>
              <Card className="glass-panel border-border/50 p-3">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  <span className="text-sm text-muted-foreground">Generando código con {currentModel.label}...</span>
                </div>
              </Card>
            </div>
          )}
        </div>
      </ScrollArea>

      <form onSubmit={handleSubmit} className="p-4 border-t border-border/50 space-y-2">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <ModelIcon className="h-3 w-3" />
          <span>{currentModel.label} • {currentModel.cost} créditos por generación</span>
        </div>
        <div className="flex gap-2">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Escribe tu mensaje... (Enter para enviar)"
            className="min-h-[60px] max-h-[200px] resize-none"
            disabled={isProcessing}
          />
          <Button
            type="submit"
            size="icon"
            className="cyber-gradient h-[60px] w-[60px] flex-shrink-0"
            disabled={!input.trim() || isProcessing}
          >
            {isProcessing ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
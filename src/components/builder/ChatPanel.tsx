import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Send, Loader2, User, Bot, Sparkles } from "lucide-react";
import type { Message } from "@/services/conversationService";

type AIModel = "gpt4" | "claude_sonnet" | "claude_opus";

interface ChatPanelProps {
  messages: Message[];
  onSendMessage: (content: string, model: AIModel) => Promise<void>;
  isProcessing: boolean;
}

export function ChatPanel({ messages, onSendMessage, isProcessing }: ChatPanelProps) {
  const [input, setInput] = useState("");
  const [selectedModel, setSelectedModel] = useState<AIModel>("gpt4");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  async function handleSend() {
    if (!input.trim() || isProcessing) return;
    
    const message = input.trim();
    setInput("");
    await onSendMessage(message, selectedModel);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  const modelInfo = {
    gpt4: { name: "GPT-4 Turbo", cost: 10, icon: Sparkles, color: "text-green-500" },
    claude_sonnet: { name: "Claude 3.5 Sonnet", cost: 20, icon: Sparkles, color: "text-blue-500" },
    claude_opus: { name: "Claude 3 Opus", cost: 40, icon: Sparkles, color: "text-purple-500" },
  };

  return (
    <div className="h-full flex flex-col bg-background">
      <div className="border-b border-border/50 p-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex-1">
            <Select value={selectedModel} onValueChange={(v) => setSelectedModel(v as AIModel)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(modelInfo).map(([key, info]) => (
                  <SelectItem key={key} value={key}>
                    <div className="flex items-center gap-2">
                      <info.icon className={`h-4 w-4 ${info.color}`} />
                      <span>{info.name}</span>
                      <Badge variant="outline" className="ml-auto">
                        {info.cost} créditos
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4">
          {messages.length === 0 && (
            <Card className="glass-panel border-border/50 p-6 text-center">
              <div className="flex flex-col items-center gap-3">
                <div className="p-3 rounded-lg bg-primary/10">
                  <Sparkles className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Comienza a construir</h3>
                  <p className="text-sm text-muted-foreground">
                    Describe lo que quieres crear y la IA lo generará para ti
                  </p>
                </div>
              </div>
            </Card>
          )}

          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div className={`flex gap-3 max-w-[85%] ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${
                  msg.role === "user" 
                    ? "cyber-gradient" 
                    : "bg-primary/10"
                }`}>
                  {msg.role === "user" ? (
                    <User className="h-4 w-4" />
                  ) : (
                    <Bot className="h-4 w-4 text-primary" />
                  )}
                </div>
                
                <div className="flex-1">
                  <Card className={`p-3 ${
                    msg.role === "user"
                      ? "cyber-gradient text-white"
                      : "glass-panel border-border/50"
                  }`}>
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    
                    {(msg.metadata as any)?.modelUsed && (
                      <div className="mt-2 pt-2 border-t border-border/30 flex items-center gap-2 text-xs opacity-70">
                        <Sparkles className="h-3 w-3" />
                        <span>{(msg.metadata as any).modelUsed}</span>
                        {(msg.metadata as any)?.creditsUsed && (
                          <Badge variant="outline" className="ml-auto">
                            -{(msg.metadata as any).creditsUsed} créditos
                          </Badge>
                        )}
                      </div>
                    )}
                  </Card>
                  
                  <p className="text-xs text-muted-foreground mt-1 px-1">
                    {new Date(msg.created_at).toLocaleTimeString("es-ES", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            </div>
          ))}

          {isProcessing && (
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Bot className="h-4 w-4 text-primary" />
              </div>
              <Card className="glass-panel border-border/50 p-3">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  <span className="text-sm text-muted-foreground">Generando código...</span>
                </div>
              </Card>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="border-t border-border/50 p-4">
        <div className="flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe lo que quieres construir..."
            className="min-h-[80px] resize-none"
            disabled={isProcessing}
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isProcessing}
            className="cyber-gradient self-end"
            size="icon"
          >
            {isProcessing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
        
        <p className="text-xs text-muted-foreground mt-2 text-center">
          {modelInfo[selectedModel].name} • {modelInfo[selectedModel].cost} créditos por mensaje
        </p>
      </div>
    </div>
  );
}
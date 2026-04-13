import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { RefreshCw, ExternalLink, Smartphone, Monitor, Tablet, Loader2 } from "lucide-react";

interface PreviewPanelProps {
  projectId: string;
  previewUrl?: string;
}

export function PreviewPanel({ projectId, previewUrl }: PreviewPanelProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<"desktop" | "tablet" | "mobile">("desktop");

  function handleRefresh() {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1000);
  }

  const widthClass = {
    desktop: "w-full",
    tablet: "max-w-[768px] mx-auto",
    mobile: "max-w-[375px] mx-auto",
  }[viewMode];

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="p-4 border-b border-border/50 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Vista Previa</h2>
        
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 p-1 rounded-lg bg-card border border-border/50">
            <Button
              variant={viewMode === "desktop" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("desktop")}
            >
              <Monitor className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "tablet" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("tablet")}
            >
              <Tablet className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "mobile" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("mobile")}
            >
              <Smartphone className="h-4 w-4" />
            </Button>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
          </Button>
          
          {previewUrl && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.open(previewUrl, "_blank")}
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      <div className="flex-1 p-4 overflow-auto">
        <div className={`${widthClass} transition-all duration-300`}>
          {previewUrl ? (
            <Card className="glass-panel border-border/50 overflow-hidden" style={{ height: "calc(100vh - 200px)" }}>
              <iframe
                src={previewUrl}
                className="w-full h-full border-0"
                title="Preview"
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
              />
            </Card>
          ) : (
            <Card className="glass-panel border-border/50 flex items-center justify-center" style={{ height: "calc(100vh - 200px)" }}>
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                  <Monitor className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Preview en construcción</h3>
                <p className="text-sm text-muted-foreground max-w-xs">
                  La vista previa aparecerá aquí cuando generes tu primera aplicación
                </p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
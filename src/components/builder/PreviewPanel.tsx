import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ExternalLink, RefreshCw } from "lucide-react";

interface PreviewPanelProps {
  projectId: string;
}

export function PreviewPanel({ projectId }: PreviewPanelProps) {
  const [iframeKey, setIframeKey] = useState(0);
  const previewUrl = `http://localhost:3000/preview/${projectId}`;

  function handleRefresh() {
    setIframeKey((prev) => prev + 1);
  }

  function handleOpenExternal() {
    window.open(previewUrl, "_blank");
  }

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Preview Header */}
      <div className="flex items-center justify-between px-3 sm:px-4 py-2 border-b border-border/50 bg-card/30 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-red-500" />
            <div className="w-2 h-2 rounded-full bg-yellow-500" />
            <div className="w-2 h-2 rounded-full bg-green-500" />
          </div>
          <span className="text-xs sm:text-sm text-muted-foreground ml-2">
            Preview en Vivo
          </span>
        </div>

        <div className="flex items-center gap-1 sm:gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            className="h-8 px-2 sm:px-3"
          >
            <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="ml-1.5 hidden sm:inline text-xs">Refresh</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleOpenExternal}
            className="h-8 px-2 sm:px-3"
          >
            <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="ml-1.5 hidden sm:inline text-xs">Abrir</span>
          </Button>
        </div>
      </div>

      {/* Preview Iframe - Ocupa todo el espacio restante */}
      <div className="flex-1 relative overflow-hidden bg-muted/20">
        <iframe
          key={iframeKey}
          src={previewUrl}
          className="absolute inset-0 w-full h-full border-0"
          title="Preview"
          sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals"
        />
      </div>
    </div>
  );
}
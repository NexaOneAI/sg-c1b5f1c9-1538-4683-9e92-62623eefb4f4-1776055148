import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, RotateCcw, Check } from "lucide-react";
import type { ProjectVersion } from "@/services/projectService";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

interface VersionHistoryProps {
  versions: ProjectVersion[];
  currentVersionId?: string;
  onRestoreVersion: (version: ProjectVersion) => void;
}

export function VersionHistory({ versions, currentVersionId, onRestoreVersion }: VersionHistoryProps) {
  return (
    <div className="flex flex-col h-full bg-card/50">
      <div className="p-4 border-b border-border/50">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" />
          Historial
        </h2>
        <p className="text-sm text-muted-foreground">
          Versiones del proyecto
        </p>
      </div>

      <ScrollArea className="flex-1 p-4">
        {versions.length === 0 ? (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
              <Clock className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-sm font-semibold mb-2">Sin versiones</h3>
            <p className="text-xs text-muted-foreground max-w-[200px] mx-auto">
              Las versiones aparecerán aquí cuando realices cambios
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {versions.map((version) => {
              const isCurrent = version.id === currentVersionId || version.is_current;
              
              return (
                <Card
                  key={version.id}
                  className={`p-3 glass-panel border-border/50 ${
                    isCurrent ? "border-primary/50" : ""
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold">
                          v{version.version_number}
                        </span>
                        {isCurrent && (
                          <Badge variant="default" className="cyber-gradient">
                            Actual
                          </Badge>
                        )}
                      </div>
                      {version.name && (
                        <p className="text-sm text-foreground mb-1">{version.name}</p>
                      )}
                      {version.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {version.description}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(version.created_at), {
                        addSuffix: true,
                        locale: es,
                      })}
                    </span>
                    
                    {!isCurrent && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onRestoreVersion(version)}
                      >
                        <RotateCcw className="h-3 w-3 mr-1" />
                        Restaurar
                      </Button>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
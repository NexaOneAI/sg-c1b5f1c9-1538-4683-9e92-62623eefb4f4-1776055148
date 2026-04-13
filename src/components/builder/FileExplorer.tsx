import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { 
  FileCode, 
  FolderOpen, 
  ChevronRight, 
  ChevronDown, 
  Search,
  File
} from "lucide-react";
import type { ProjectFile } from "@/services/projectService";

interface FileExplorerProps {
  files: ProjectFile[];
  selectedFile?: string;
  onSelectFile: (file: ProjectFile) => void;
}

export function FileExplorer({ files, selectedFile, onSelectFile }: FileExplorerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(["src"]));

  function toggleFolder(path: string) {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpandedFolders(newExpanded);
  }

  const filteredFiles = files.filter((f) =>
    f.file_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const fileTree = buildFileTree(filteredFiles);

  return (
    <div className="flex flex-col h-full bg-card/50 border-l border-border/50">
      <div className="p-4 border-b border-border/50">
        <h2 className="text-lg font-semibold flex items-center gap-2 mb-3">
          <FileCode className="h-5 w-5 text-primary" />
          Archivos
        </h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar archivos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <ScrollArea className="flex-1 p-2">
        {filteredFiles.length === 0 ? (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
              <File className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-sm font-semibold mb-2">No hay archivos</h3>
            <p className="text-xs text-muted-foreground max-w-[200px] mx-auto">
              Los archivos generados aparecerán aquí
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {renderFileTree(fileTree, expandedFolders, toggleFolder, selectedFile, onSelectFile)}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}

interface FileNode {
  name: string;
  path: string;
  type: "file" | "folder";
  file?: ProjectFile;
  children?: FileNode[];
}

function buildFileTree(files: ProjectFile[]): FileNode[] {
  const root: FileNode[] = [];
  const folderMap = new Map<string, FileNode>();

  files.forEach((file) => {
    const parts = file.file_path.split("/");
    let currentPath = "";
    let currentLevel = root;

    parts.forEach((part, index) => {
      const isLast = index === parts.length - 1;
      currentPath = currentPath ? `${currentPath}/${part}` : part;

      if (isLast) {
        currentLevel.push({
          name: part,
          path: currentPath,
          type: "file",
          file,
        });
      } else {
        let folder = folderMap.get(currentPath);
        if (!folder) {
          folder = {
            name: part,
            path: currentPath,
            type: "folder",
            children: [],
          };
          folderMap.set(currentPath, folder);
          currentLevel.push(folder);
        }
        currentLevel = folder.children!;
      }
    });
  });

  return root;
}

function renderFileTree(
  nodes: FileNode[],
  expanded: Set<string>,
  toggleFolder: (path: string) => void,
  selectedFile?: string,
  onSelectFile?: (file: ProjectFile) => void,
  depth = 0
): React.ReactNode {
  return nodes.map((node) => {
    const isExpanded = expanded.has(node.path);
    const isSelected = selectedFile === node.file?.id;

    if (node.type === "folder") {
      return (
        <div key={node.path}>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start font-normal h-8"
            style={{ paddingLeft: `${depth * 12 + 8}px` }}
            onClick={() => toggleFolder(node.path)}
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 mr-1" />
            ) : (
              <ChevronRight className="h-4 w-4 mr-1" />
            )}
            <FolderOpen className="h-4 w-4 mr-2 text-accent" />
            <span className="text-sm">{node.name}</span>
          </Button>
          {isExpanded && node.children && (
            <div>
              {renderFileTree(node.children, expanded, toggleFolder, selectedFile, onSelectFile, depth + 1)}
            </div>
          )}
        </div>
      );
    }

    return (
      <Button
        key={node.path}
        variant={isSelected ? "secondary" : "ghost"}
        size="sm"
        className="w-full justify-start font-normal h-8"
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
        onClick={() => node.file && onSelectFile?.(node.file)}
      >
        <FileCode className="h-4 w-4 mr-2 text-primary" />
        <span className="text-sm truncate">{node.name}</span>
      </Button>
    );
  });
}
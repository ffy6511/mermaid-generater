'use client';

import { useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Copy, Edit2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PreviewPanelProps {
  mermaidCode: string;
  onEditCode: (code: string) => void;
  isLoading?: boolean;
}

export function PreviewPanel({ mermaidCode, onEditCode, isLoading = false }: PreviewPanelProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editableMermaidCode, setEditableMermaidCode] = useState(mermaidCode);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(mermaidCode);
  };

  const handleEditToggle = () => {
    setIsEditing(!isEditing);
    if (!isEditing) {
      setEditableMermaidCode(mermaidCode);
    } else {
      onEditCode(editableMermaidCode);
    }
  };

  return (
    <Card className="p-4">
      <h2 className="text-xl font-semibold mb-4">预览</h2>
      <div className="space-y-4">
        <div className="relative">
          <div className="absolute right-2 top-2 flex gap-2">
            <Button variant="ghost" size="icon" onClick={handleCopyCode}>
              <Copy className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleEditToggle}
              className={cn(isEditing && "bg-accent")}
            >
              <Edit2 className="h-4 w-4" />
            </Button>
          </div>
          {isEditing ? (
            <Textarea
              value={editableMermaidCode}
              onChange={(e) => setEditableMermaidCode(e.target.value)}
              className="min-h-[200px] font-mono text-sm"
            />
          ) : (
            <pre className="min-h-[200px] p-4 bg-muted font-mono text-sm rounded-md overflow-auto">
              {mermaidCode || "暂无图表代码"}
            </pre>
          )}
        </div>
        <div className="min-h-[300px] border rounded-md p-4 overflow-auto relative">
          {isLoading ? (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
            </div>
          ) : mermaidCode ? (
            <div id="mermaid-diagram" className="flex justify-center">
              {/* Mermaid图表将在这里渲染 */}
            </div>
          ) : (
            <p className="text-muted-foreground text-center">图表渲染区域</p>
          )}
        </div>
      </div>
    </Card>
  );
}
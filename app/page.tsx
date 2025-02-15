"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun, Save, Loader2, ChevronRight, ChevronDown, FileText, Copy, Edit2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import mermaid from "mermaid";

interface HistoryItem {
  id: string;
  content: string;
  timestamp: number;
}

export default function Home() {
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(true);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [mermaidCode, setMermaidCode] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editableMermaidCode, setEditableMermaidCode] = useState("");
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    mermaid.initialize({
      startOnLoad: true,
      theme: theme === 'dark' ? 'dark' : 'default',
      securityLevel: 'loose',
    });
  }, [theme]);

  useEffect(() => {
    if (mermaidCode) {
      setEditableMermaidCode(mermaidCode);
      renderMermaidDiagram();
    }
  }, [mermaidCode]);

  useEffect(() => {
    if (isEditing) {
      renderMermaidDiagram();
    }
  }, [editableMermaidCode]);

  const renderMermaidDiagram = async () => {
    try {
      const container = document.getElementById('mermaid-diagram');
      if (container) {
        container.innerHTML = '';
        await mermaid.render('mermaid-svg', isEditing ? editableMermaidCode : mermaidCode)
          .then(({ svg }) => {
            container.innerHTML = svg;
          });
      }
    } catch (error) {
      console.error('Mermaid rendering error:', error);
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(mermaidCode);
  };

  const handleEditToggle = () => {
    setIsEditing(!isEditing);
  };

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const handleSubmit = async () => {
    if (!inputText.trim()) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: inputText }),
      });

      if (!response.ok) {
        throw new Error('生成失败');
      }

      const data = await response.json();
      setMermaidCode(data.mermaidCode);

      // 保存到历史记录
      const newItem: HistoryItem = {
        id: Date.now().toString(),
        content: inputText,
        timestamp: Date.now(),
      };
      setHistory((prev) => [newItem, ...prev]);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen p-4 md:p-8">
      <div className="container mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Mermaid 图表生成器</h1>
          <Button variant="ghost" size="icon" onClick={toggleTheme}>
            <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-[250px,1fr,1fr]">
          {/* 历史记录面板 */}
          <Card className="p-4 h-[calc(100vh-12rem)] overflow-auto">
            <div
              className="flex items-center justify-between cursor-pointer mb-4"
              onClick={() => setIsHistoryOpen(!isHistoryOpen)}
            >
              <h2 className="text-xl font-semibold">历史记录</h2>
              {isHistoryOpen ? (
                <ChevronDown className="h-5 w-5" />
              ) : (
                <ChevronRight className="h-5 w-5" />
              )}
            </div>
            {isHistoryOpen && (
              <div className="space-y-2">
                {history.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center space-x-2 p-2 rounded-md hover:bg-accent cursor-pointer"
                    onClick={() => setInputText(item.content)}
                  >
                    <FileText className="h-4 w-4" />
                    <span className="text-sm truncate">
                      {new Date(item.timestamp).toLocaleString()}
                    </span>
                  </div>
                ))}
                {history.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center">
                    暂无历史记录
                  </p>
                )}
              </div>
            )}
          </Card>

          {/* 输入区域 */}
          <Card className="p-4">
            <h2 className="text-xl font-semibold mb-4">输入文本</h2>
            <Textarea
              placeholder="请输入要转换为图表的文本..."
              className="min-h-[300px] mb-4"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
            />
            <Button
              className="w-full"
              onClick={handleSubmit}
              disabled={isLoading || !inputText.trim()}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  生成中...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  生成图表
                </>
              )}
            </Button>
          </Card>

          {/* 预览区域 */}
          <Card className="p-4">
            <h2 className="text-xl font-semibold mb-4">预览</h2>
            <div className="space-y-4">
              {/* 代码块区域 */}
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
              {/* Mermaid图表渲染区域 */}
              <div className="min-h-[300px] border rounded-md p-4 overflow-auto">
                {mermaidCode ? (
                  <div id="mermaid-diagram" className="flex justify-center">
                    {/* Mermaid图表将在这里渲染 */}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center">图表渲染区域</p>
                )}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </main>
  );
}
"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Loader2, Save, Sun, Moon } from 'lucide-react';
import { useTheme } from 'next-themes';
import mermaid from 'mermaid';
import { HistoryPanel } from '@/components/history-panel';
import { PreviewPanel } from '@/components/preview-panel';
import { openDB } from 'idb';
import { useHistory } from '@/contexts/history-context';



export default function Home() {
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [mermaidCode, setMermaidCode] = useState("");
  const { theme, setTheme } = useTheme();
  const { addHistory, selectedHistory, loadHistory } = useHistory();

  useEffect(() => {
    if (selectedHistory) {
      setInputText(selectedHistory.content);
      setMermaidCode(selectedHistory.mermaidCode);
      renderMermaidDiagram();
    }
  }, [selectedHistory]);

  useEffect(() => {
    mermaid.initialize({
      startOnLoad: true,
      theme: theme === 'dark' ? 'dark' : 'default',
      securityLevel: 'loose',
    });
  }, [theme]);

  useEffect(() => {
    if (mermaidCode) {
      renderMermaidDiagram();
    }
  }, [mermaidCode]);

  const renderMermaidDiagram = async () => {
    try {
      const container = document.getElementById('mermaid-diagram');
      if (container) {
        container.innerHTML = '';
        await mermaid.render('mermaid-svg', mermaidCode)
          .then(({ svg }) => {
            container.innerHTML = svg;
          });
      }
    } catch (error) {
      console.error('Mermaid rendering error:', error);
    }
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
      // 保留代码块标记，但移除mermaid标记
      const processedCode = data.mermaidCode
        .replace(/^```mermaid\s*\n/, '')  // 移除开头的 ```mermaid
        .replace(/\n```$/, '');          // 移除结尾的 ```
      setMermaidCode(processedCode);

      // 保存到历史记录并刷新历史列表
      await addHistory(inputText, processedCode);
      await loadHistory(); // 重新加载历史记录
      await renderMermaidDiagram(); // 确保在所有状态更新后渲染图表
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
          <HistoryPanel onSelectHistory={setInputText} />

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

          <PreviewPanel
            mermaidCode={mermaidCode}
            onEditCode={setMermaidCode}
            isLoading={isLoading}
          />
        </div>
      </div>
    </main>
  );
}
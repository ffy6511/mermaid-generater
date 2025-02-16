'use client';

import { useState, useEffect } from 'react';
import { CodeTwoTone, PieChartTwoTone  }  from '@ant-design/icons';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Copy, Edit2, Save } from 'lucide-react';
import { cn } from '@/lib/utils';
import mermaid from 'mermaid';
import { useHistory } from '@/contexts/history-context';
import { openDB } from 'idb';

interface PreviewPanelProps {
  isLoading?: boolean;
}

export function PreviewPanel({ isLoading = false }: PreviewPanelProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editableMermaidCode, setEditableMermaidCode] = useState('');
  const { selectedHistory, setSelectedHistory } = useHistory();

  // 初始化时从 localStorage 读取 selectedHistory
  useEffect(() => {
    const savedHistory = localStorage.getItem('selectedHistory');
    if (savedHistory) {
      const parsedHistory = JSON.parse(savedHistory);
      setEditableMermaidCode(parsedHistory.mermaidCode);
    }
  }, []);



  // 初始化 mermaid 并监听主题变化
  useEffect(() => {
    const initMermaid = (theme: string) => {
      mermaid.initialize({
        startOnLoad: true,
        theme: theme,
        securityLevel: 'loose',
      });
    };

    const handleThemeChange = () => {
      const theme = document.documentElement.classList.contains('dark') ? 'dark' : 'default';
      initMermaid(theme);
      if (editableMermaidCode) {
        renderMermaidDiagram();
      }
    };

    // 初始化
    handleThemeChange();

    // 监听主题变化
    const observer = new MutationObserver(handleThemeChange);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });

    return () => observer.disconnect();
  }, [editableMermaidCode]);


  // 渲染图表的函数
  const renderMermaidDiagram = async () => {
    if (!selectedHistory?.mermaidCode) return;

    try {
      const container = document.getElementById('mermaid-diagram');
      if (container) {
        container.innerHTML = '';
        const { svg } = await mermaid.render('mermaid-svg', selectedHistory.mermaidCode);
        container.innerHTML = svg;
      }
    } catch (error) {
      console.error('Mermaid rendering error:', error);
    }
  };

  // 监听代码变化并重新渲染图表
  useEffect(() => {
    if (!isLoading && selectedHistory?.mermaidCode) {
      renderMermaidDiagram();
    }
  }, [selectedHistory, isLoading]);

  const handleCopyCode = () => {
    if (selectedHistory) {
      navigator.clipboard.writeText(selectedHistory.mermaidCode);
    }
  };

  const handleEditToggle = () => {
    setIsEditing(!isEditing);
    if (!isEditing && selectedHistory) {
      setEditableMermaidCode(selectedHistory.mermaidCode);
    }
  };

  const handleSave = async () => {
    if (selectedHistory && editableMermaidCode !== selectedHistory.mermaidCode) {
      try {
        // 更新IndexedDB中的历史记录
        const db = await openDB('mermaid-generator', 1);
        const updatedHistory = {
          ...selectedHistory,
          mermaidCode: editableMermaidCode
        };
        await db.put('history', updatedHistory);
        
        // 更新状态
        setSelectedHistory(updatedHistory);
        setIsEditing(false);

        // 重新渲染图表
        const container = document.getElementById('mermaid-diagram');
        if (container) {
          container.innerHTML = '';
          const { svg } = await mermaid.render('mermaid-svg', editableMermaidCode);
          container.innerHTML = svg;
        }
      } catch (error) {
        console.error('Save error:', error);
      }
    }
  };

  return (
    <Card className="p-4">
      <h2 className="text-lg font-semibold mb-4"><CodeTwoTone />  Mermaid code</h2>
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
            {isEditing && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleSave}
                disabled={!selectedHistory || editableMermaidCode === selectedHistory.mermaidCode}
              >
                <Save className="h-4 w-4" />
              </Button>
            )}
          </div>
          {isEditing ? (
            <Textarea
              value={editableMermaidCode}
              onChange={(e) => setEditableMermaidCode(e.target.value)}
              className="min-h-[200px] font-mono text-sm"
            />
          ) : (
            <pre className="min-h-[200px] p-4 bg-muted font-mono text-sm rounded-md overflow-auto">
              {selectedHistory?.mermaidCode || "暂无图表代码"}
            </pre>
          )}
        </div>
        <h2 className="text-lg font-semibold mb-4"><PieChartTwoTone  />  Rendered chart</h2>
        <div className="min-h-[300px] border rounded-md p-4 overflow-auto relative">
          {isLoading ? (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
            </div>
          ) : selectedHistory?.mermaidCode ? (
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

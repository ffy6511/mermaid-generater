'use client';

import { useEffect, useState } from 'react';
import { Card } from './ui/card';
import { ChevronDown, ChevronRight, FileText } from 'lucide-react';
import { useHistory } from '@/contexts/history-context';
import type { HistoryItem } from '@/contexts/history-context';

interface HistoryPanelProps {
  onSelectHistory: (content: string, mermaidCode: string) => void;
}

export function HistoryPanel({ onSelectHistory }: HistoryPanelProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const { loadHistory, setSelectedHistory, selectedHistory } = useHistory();

  useEffect(() => {
    loadHistory().then(setHistory);
  }, []);

  const handleSelectHistory = (item: HistoryItem) => {
    setSelectedHistory(item);
    onSelectHistory(item.content, item.mermaidCode);
  };

  return (
    <Card className="p-4 h-[calc(100vh-12rem)] overflow-auto">
      <div
        className="flex items-center justify-between cursor-pointer mb-4"
        onClick={() => setIsOpen(!isOpen)}
      >
        <h2 className="text-xl font-semibold">历史记录</h2>
        {isOpen ? (
          <ChevronDown className="h-5 w-5" />
        ) : (
          <ChevronRight className="h-5 w-5" />
        )}
      </div>
      {isOpen && (
        <div className="space-y-2">
          {history.map((item) => (
            <div
              key={item.id}
              className={`flex items-center space-x-2 p-2 rounded-md hover:bg-accent cursor-pointer ${item.id === selectedHistory?.id ? 'bg-accent' : ''}`}
              onClick={() => handleSelectHistory(item)}
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
  );
}
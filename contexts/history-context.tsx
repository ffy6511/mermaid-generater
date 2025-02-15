'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { openDB } from 'idb';

export interface HistoryItem {
  id: string;
  content: string;
  mermaidCode: string;
  timestamp: number;
}

interface HistoryContextType {
  selectedHistory: HistoryItem | null;
  setSelectedHistory: (history: HistoryItem | null) => void;
  addHistory: (content: string, mermaidCode: string) => Promise<void>;
  loadHistory: () => Promise<HistoryItem[]>;
}

const HistoryContext = createContext<HistoryContextType | undefined>(undefined);

export function HistoryProvider({ children }: { children: React.ReactNode }) {
  const [selectedHistory, setSelectedHistory] = useState<HistoryItem | null>(null);

  useEffect(() => {
    // 从 localStorage 恢复选中的历史记录
    const savedHistory = localStorage.getItem('selectedHistory');
    if (savedHistory) {
      setSelectedHistory(JSON.parse(savedHistory));
    }
  }, []);

  useEffect(() => {
    // 将选中的历史记录保存到 localStorage
    if (selectedHistory) {
      localStorage.setItem('selectedHistory', JSON.stringify(selectedHistory));
    } else {
      localStorage.removeItem('selectedHistory');
    }
  }, [selectedHistory]);

  const addHistory = async (content: string, mermaidCode: string) => {
    const db = await openDB('mermaid-generator', 1);
    const historyItem: HistoryItem = {
      id: Date.now().toString(),
      content,
      mermaidCode,
      timestamp: Date.now()
    };
    await db.put('history', historyItem);
  };

  const loadHistory = async () => {
    const db = await openDB('mermaid-generator', 1);
    const items = await db.getAll('history');
    return items.sort((a, b) => b.timestamp - a.timestamp);
  };

  return (
    <HistoryContext.Provider
      value={{
        selectedHistory,
        setSelectedHistory,
        addHistory,
        loadHistory
      }}
    >
      {children}
    </HistoryContext.Provider>
  );
}

export function useHistory() {
  const context = useContext(HistoryContext);
  if (context === undefined) {
    throw new Error('useHistory must be used within a HistoryProvider');
  }
  return context;
}
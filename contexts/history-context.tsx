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
  deleteHistory: (id: string) => Promise<void>;
  deleteHistories: (ids: string[]) => Promise<void>;
  historyList: HistoryItem[];
}

const HistoryContext = createContext<HistoryContextType | undefined>(undefined);

export function HistoryProvider({ children }: { children: React.ReactNode }) {
  const [selectedHistory, setSelectedHistory] = useState<HistoryItem | null>(null);
  const [historyList, setHistoryList] = useState<HistoryItem[]>([]);

  useEffect(() => {
    // 初始化数据库
    const initDB = async () => {
      try {
        const db = await openDB('mermaid-generator', 1, {
          upgrade(db) {
            // 创建对象存储空间
            if (!db.objectStoreNames.contains('history')) {
              db.createObjectStore('history', { keyPath: 'id' });
            }
          },
        });
        
        // 确保数据库初始化完成后再加载数据
        const items = await db.getAll('history');
        const sortedItems = items.sort((a, b) => b.timestamp - a.timestamp);
        setHistoryList(sortedItems);
      } catch (error) {
        console.error('Database initialization error:', error);
      }
    };

    initDB();
  }, []);

  useEffect(() => {
    const savedHistory = localStorage.getItem('selectedHistory');
    if (savedHistory) {
      setSelectedHistory(JSON.parse(savedHistory));
    }
  }, []);

  useEffect(() => {
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
    setHistoryList(prev => [historyItem, ...prev]);
  };

  const loadHistory = async () => {
    try {
      const db = await openDB('mermaid-generator', 1);
      const items = await db.getAll('history');
      const sortedItems = items.sort((a, b) => b.timestamp - a.timestamp);
      setHistoryList(sortedItems);
      return sortedItems;
    } catch (error) {
      console.error('Load history error:', error);
      return [];
    }
  };

  const deleteHistory = async (id: string) => {
    const db = await openDB('mermaid-generator', 1);
    await db.delete('history', id);
    setHistoryList(prev => prev.filter(item => item.id !== id));
    if (selectedHistory?.id === id) {
      setSelectedHistory(null);
    }
  };

  const deleteHistories = async (ids: string[]) => {
    const db = await openDB('mermaid-generator', 1);
    // 逐个删除记录
    for (const id of ids) {
      await db.delete('history', id);
    }
    // 更新内存中的状态
    setHistoryList(prev => prev.filter(item => !ids.includes(item.id)));
    // 如果当前选中的记录在被删除的列表中，清除选中状态
    if (selectedHistory && ids.includes(selectedHistory.id)) {
      setSelectedHistory(null);
    }
  };

  return (
    <HistoryContext.Provider
      value={{
        selectedHistory,
        setSelectedHistory,
        addHistory,
        loadHistory,
        deleteHistory,
        deleteHistories,
        historyList
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

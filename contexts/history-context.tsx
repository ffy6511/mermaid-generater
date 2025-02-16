'use client'

import { createContext, useContext, useState, useEffect } from 'react';

// 历史记录项的类型定义
export interface HistoryItem {
  id: string;          // 历史记录的唯一标识
  content: string;     // 原始文本内容
  mermaidCode: string; // 生成的Mermaid图表代码
  timestamp: number;   // 创建时间戳
}

// 历史记录Context的类型定义
interface HistoryContextType {
  selectedHistory: HistoryItem | null;     // 当前选中的历史记录
  setSelectedHistory: (history: HistoryItem | null) => void;  // 设置选中的历史记录
  addHistory: (content: string, mermaidCode: string) => Promise<HistoryItem>;  // 添加新的历史记录
  loadHistory: () => Promise<HistoryItem[]>;  // 加载所有历史记录
  deleteHistory: (id: string) => Promise<void>;  // 删除单个历史记录
  deleteHistories: (ids: string[]) => Promise<void>;  // 批量删除历史记录
  historyList: HistoryItem[];  // 历史记录列表
}

// 创建历史记录Context
const HistoryContext = createContext<HistoryContextType | undefined>(undefined);

// 数据库工具函数：打开IndexedDB数据库
const openDatabase = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    // 打开名为'mermaid-generator'的数据库，版本为1
    const request = indexedDB.open('mermaid-generator', 1);

    // 处理数据库打开错误
    request.onerror = () => reject(request.error);
    // 数据库打开成功
    request.onsuccess = () => resolve(request.result);

    // 数据库需要升级时的处理（首次创建数据库时也会触发）
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      // 如果'history'对象仓库不存在，则创建它
      if (!db.objectStoreNames.contains('history')) {
        db.createObjectStore('history', { keyPath: 'id' });
      }
    };
  });
};

// 历史记录Context Provider组件
export function HistoryProvider({ children }: { children: React.ReactNode }) {
  // 状态定义
  const [selectedHistory, setSelectedHistory] = useState<HistoryItem | null>(null);  // 当前选中的历史记录
  const [historyList, setHistoryList] = useState<HistoryItem[]>([]);  // 历史记录列表
  const [isInitialized, setIsInitialized] = useState(false);  // 数据库初始化状态

  // 初始化数据库并加载历史记录
  useEffect(() => {
    const initDB = async () => {
      try {
        const db = await openDatabase();
        
        // 加载所有历史记录
        const transaction = db.transaction(['history'], 'readonly');
        const store = transaction.objectStore('history');
        const request = store.getAll();

        request.onsuccess = () => {
          const items = request.result;
          // 按时间戳降序排序
          const sortedItems = items.sort((a, b) => b.timestamp - a.timestamp);
          setHistoryList(sortedItems);
          setIsInitialized(true);

          // 从localStorage恢复上次选中的历史记录
          const savedHistory = localStorage.getItem('selectedHistory');
          if (savedHistory) {
            const parsedHistory = JSON.parse(savedHistory);
            // 确保该历史记录仍然存在
            const existingHistory = sortedItems.find(item => item.id === parsedHistory.id);
            if (existingHistory) {
              setSelectedHistory(existingHistory);
            } else {
              localStorage.removeItem('selectedHistory');
            }
          }
        };

        request.onerror = () => {
          console.error('Failed to load history:', request.error);
          setIsInitialized(true);
        };
      } catch (error) {
        console.error('Database initialization error:', error);
        setIsInitialized(true);
      }
    };

    initDB();
  }, []);

  // 监听选中历史记录的变化，同步到localStorage
  useEffect(() => {
    if (isInitialized) {
      if (selectedHistory) {
        localStorage.setItem('selectedHistory', JSON.stringify(selectedHistory));
      } else {
        localStorage.removeItem('selectedHistory');
      }
    }
  }, [selectedHistory, isInitialized]);

  // 添加新的历史记录
  const addHistory = async (content: string, mermaidCode: string): Promise<HistoryItem> => {
    const historyItem: HistoryItem = {
      id: Date.now().toString(),
      content,
      mermaidCode,
      timestamp: Date.now()
    };

    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['history'], 'readwrite');
      const store = transaction.objectStore('history');
      const request = store.put(historyItem);

      request.onsuccess = () => {
        // 将新记录添加到列表开头
        setHistoryList(prev => [historyItem, ...prev]);
        resolve(historyItem);
      };

      request.onerror = () => reject(request.error);
    });
  };

  // 加载所有历史记录
  const loadHistory = async (): Promise<HistoryItem[]> => {
    try {
      const db = await openDatabase();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(['history'], 'readonly');
        const store = transaction.objectStore('history');
        const request = store.getAll();

        request.onsuccess = () => {
          const items = request.result;
          // 按时间戳降序排序
          const sortedItems = items.sort((a, b) => b.timestamp - a.timestamp);
          setHistoryList(sortedItems);
          resolve(sortedItems);
        };

        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('Load history error:', error);
      return [];
    }
  };

  // 删除单个历史记录
  const deleteHistory = async (id: string): Promise<void> => {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['history'], 'readwrite');
      const store = transaction.objectStore('history');
      const request = store.delete(id);

      request.onsuccess = () => {
        // 从列表中移除该记录
        setHistoryList(prev => prev.filter(item => item.id !== id));
        // 如果删除的是当前选中的记录，清除选中状态
        if (selectedHistory?.id === id) {
          setSelectedHistory(null);
        }
        resolve();
      };

      request.onerror = () => reject(request.error);
    });
  };

  // 批量删除历史记录
  const deleteHistories = async (ids: string[]): Promise<void> => {
    const db = await openDatabase();
    const transaction = db.transaction(['history'], 'readwrite');
    const store = transaction.objectStore('history');

    return new Promise((resolve, reject) => {
      let completed = 0;
      let hasError = false;

      // 遍历删除每个记录
      ids.forEach(id => {
        const request = store.delete(id);

        request.onsuccess = () => {
          completed++;
          // 所有删除操作完成且没有错误时
          if (completed === ids.length && !hasError) {
            // 从列表中移除这些记录
            setHistoryList(prev => prev.filter(item => !ids.includes(item.id)));
            // 如果删除的记录中包含当前选中的记录，清除选中状态
            if (selectedHistory && ids.includes(selectedHistory.id)) {
              setSelectedHistory(null);
            }
            resolve();
          }
        };

        request.onerror = () => {
          if (!hasError) {
            hasError = true;
            reject(request.error);
          }
        };
      });
    });
  };

  // 提供Context值
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

// 自定义Hook：使用历史记录Context
export function useHistory() {
  const context = useContext(HistoryContext);
  if (context === undefined) {
    throw new Error('useHistory must be used within a HistoryProvider');
  }
  return context;
}


'use client';

import { useEffect, useState } from 'react';
import { Card } from './ui/card';
import { ChevronDown, ChevronRight, FileText, Trash2, CheckSquare, Square, XCircle } from 'lucide-react';
import { useHistory } from '@/contexts/history-context';
import type { HistoryItem } from '@/contexts/history-context';
import { Tooltip } from 'antd';
import { Button } from './ui/button';
import { FieldTimeOutlined } from '@ant-design/icons';

interface HistoryPanelProps {
  onSelectHistory: (content: string, mermaidCode: string) => void;
}

export function HistoryPanel({ onSelectHistory }: HistoryPanelProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [isBatchMode, setIsBatchMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  
  const {
    historyList,
    setSelectedHistory,
    selectedHistory,
    deleteHistory,
    deleteHistories
  } = useHistory();

  // 监听选中历史记录的有效性
  useEffect(() => {
    if (selectedHistory) {
      const selectedItem = historyList.find(item => item.id === selectedHistory.id);
      if (!selectedItem) {
        setSelectedHistory(null);
      }
    }
  }, [selectedHistory, historyList, setSelectedHistory]);

  const handleSelectHistory = (item: HistoryItem) => {
    setSelectedHistory(item);
    onSelectHistory(item.content, item.mermaidCode);
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await deleteHistory(id);
  };

  const handleBatchDelete = async () => {
    if (selectedItems.size > 0) {
      await deleteHistories(Array.from(selectedItems));
      setSelectedItems(new Set());
      setIsBatchMode(false);
    }
  };

  const toggleSelectItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newSelectedItems = new Set(selectedItems);
    if (selectedItems.has(id)) {
      newSelectedItems.delete(id);
    } else {
      newSelectedItems.add(id);
    }
    setSelectedItems(newSelectedItems);
  };

  const toggleSelectAll = () => {
    if (selectedItems.size === historyList.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(historyList.map(item => item.id)));
    }
  };

  return (
    <Card className="p-4 h-[calc(100vh-12rem)] overflow-auto">
      <div className="flex items-center justify-between mb-4">
        <div
          className="flex items-center cursor-pointer"
          onClick={() => setIsOpen(!isOpen)}
        >
          <p className="text-lg font-semibold"><FieldTimeOutlined /> Recent</p>
          {isOpen ? (
            <ChevronDown className="h-5 w-5 ml-2" />
          ) : (
            <ChevronRight className="h-5 w-5 ml-2" />
          )}
        </div>
        <div className="flex items-center space-x-2">
          {isBatchMode && (
            <>
              <Tooltip title="全选/取消全选">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleSelectAll}
                >
                  {selectedItems.size === historyList.length ? (
                    <CheckSquare className="h-4 w-4" />
                  ) : (
                    <Square className="h-4 w-4" />
                  )}
                </Button>
              </Tooltip>
              <Tooltip title="取消">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setIsBatchMode(false);
                    setSelectedItems(new Set());
                  }}
                >
                  <XCircle className="h-4 w-4" />
                </Button>
              </Tooltip>
              <Tooltip title="删除所选">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleBatchDelete}
                  disabled={selectedItems.size === 0}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </Tooltip>
            </>
          )}
          {!isBatchMode && (
            <Tooltip title="批量删除">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsBatchMode(true)}
              >
                <CheckSquare className="h-4 w-4" />
              </Button>
            </Tooltip>
          )}
        </div>
      </div>
      {isOpen && (
        <div className="space-y-2">
          {historyList.map((item) => (
            <div
              key={item.id}
              className={`flex items-center justify-between p-2 rounded-md hover:bg-accent cursor-pointer group ${
                item.id === selectedHistory?.id ? 'bg-accent' : ''
              }`}
              onClick={(e) => isBatchMode ? toggleSelectItem(item.id, e) : handleSelectHistory(item)}
            >
              <div className="flex items-center space-x-2 flex-1 min-w-0">
                {isBatchMode ? (
                  <div onClick={(e) => toggleSelectItem(item.id, e)}>
                    {selectedItems.has(item.id) ? (
                      <CheckSquare className="h-4 w-4" />
                    ) : (
                      <Square className="h-4 w-4" />
                    )}
                  </div>
                ) : (
                  <FileText className="h-4 w-4" />
                )}
                <span className="text-sm truncate">
                  {new Date(item.timestamp).toLocaleString()}
                </span>
              </div>
              {!isBatchMode && (
                <Tooltip title="删除">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => handleDelete(item.id, e)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </Tooltip>
              )}
            </div>
          ))}
          {historyList.length === 0 && (
            <p className="text-sm text-muted-foreground text-center">
              暂无历史记录
            </p>
          )}
        </div>
      )}
    </Card>
  );
}

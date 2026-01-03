
import React from 'react';
import { HistoryItem } from '../types';
import { Clock, Trash2, ChevronRight, FileText, Youtube } from 'lucide-react';

interface HistoryPanelProps {
  history: HistoryItem[];
  onSelect: (item: HistoryItem) => void;
  onDelete: (id: string) => void;
  onClear: () => void;
  onClose: () => void;
}

export const HistoryPanel: React.FC<HistoryPanelProps> = ({
  history,
  onSelect,
  onDelete,
  onClear,
  onClose
}) => {
  const formatDate = (ts: number) => {
    return new Intl.DateTimeFormat('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(ts));
  };

  return (
    <div className="flex flex-col h-full bg-white border-r border-gray-200 w-80 shrink-0">
      <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
        <h3 className="font-semibold text-gray-700 flex items-center gap-2">
          <Clock size={16} /> 历史记录
        </h3>
        <div className="flex gap-2">
          <button 
            onClick={onClear}
            className="p-1.5 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded transition-colors"
            title="清空记录"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {history.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-sm">
            暂无历史记录
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {history.map((item) => (
              <div 
                key={item.id}
                className="group relative p-4 hover:bg-brand-50/50 cursor-pointer transition-colors border-l-2 border-transparent hover:border-brand-500"
                onClick={() => onSelect(item)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-400 mb-1">{formatDate(item.timestamp)}</p>
                    <p className="text-sm font-medium text-gray-700 truncate mb-1">
                      {item.input.fileName || item.input.text.slice(0, 50) || '无标题'}
                    </p>
                    <div className="flex gap-2">
                      <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded">
                        {item.input.fileName ? '文件' : '文本'}
                      </span>
                    </div>
                  </div>
                  <ChevronRight size={14} className="text-gray-300 group-hover:text-brand-500 mt-1" />
                </div>
                
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(item.id);
                  }}
                  className="absolute bottom-4 right-4 p-1.5 bg-white border border-gray-100 shadow-sm rounded text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <div className="p-4 border-t border-gray-100 text-center">
        <button 
          onClick={onClose}
          className="text-xs text-gray-400 hover:text-gray-600 font-medium"
        >
          收起面板
        </button>
      </div>
    </div>
  );
};

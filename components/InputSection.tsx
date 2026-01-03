
import React, { useCallback, useRef, useState, useEffect } from 'react';
import { Upload, FileText, X, Youtube, Settings, Clock, FileType as FileIcon, Loader2, BookOpen, List, Search } from 'lucide-react';
import { UploadedFile, FileType, XhsStyle } from '../types';
import { fileToBase64, extractYoutubeId, fetchYoutubeTranscript } from '../utils/fileHelper';

interface InputSectionProps {
  inputText: string;
  setInputText: (text: string) => void;
  attachedFile: UploadedFile | null;
  setAttachedFile: (file: UploadedFile | null) => void;
  onGenerate: () => void;
  isGenerating: boolean;
  toggleHistory: () => void;
  autoExtractYoutube: boolean;
  setAutoExtractYoutube: (val: boolean) => void;
  selectedXhsStyle: XhsStyle;
  setSelectedXhsStyle: (style: XhsStyle) => void;
}

const STYLE_OPTIONS = [
  { id: XhsStyle.STORYTELLING, label: '感性故事', icon: BookOpen },
  { id: XhsStyle.LISTICLE, label: '干货清单', icon: List },
  { id: XhsStyle.REVIEW, label: '深度评测', icon: Search },
];

export const InputSection: React.FC<InputSectionProps> = ({
  inputText,
  setInputText,
  attachedFile,
  setAttachedFile,
  onGenerate,
  isGenerating,
  toggleHistory,
  autoExtractYoutube,
  setAutoExtractYoutube,
  selectedXhsStyle,
  setSelectedXhsStyle
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractStatus, setExtractStatus] = useState<string>('');
  const [showSettings, setShowSettings] = useState(false);

  // Auto-detect YouTube URL
  useEffect(() => {
    if (!autoExtractYoutube) return;

    const checkAndExtract = async () => {
      const trimmed = inputText.trim();
      if (!trimmed || isExtracting || extractStatus === 'done') return;

      const videoId = extractYoutubeId(trimmed);
      const isCleanUrl = trimmed.match(/^https?:\/\/(www\.)?(youtube\.com|youtu\.be)\/[^\s]+$/);

      if (videoId && isCleanUrl) {
        setIsExtracting(true);
        setExtractStatus('loading');
        try {
          const transcript = await fetchYoutubeTranscript(videoId);
          if (transcript) {
            setInputText(transcript);
            setExtractStatus('done');
          } else {
            setExtractStatus('error');
          }
        } catch (e) {
          setExtractStatus('error');
        } finally {
          setIsExtracting(false);
        }
      }
    };

    const timeoutId = setTimeout(checkAndExtract, 800);
    return () => clearTimeout(timeoutId);
  }, [inputText, isExtracting, extractStatus, setInputText, autoExtractYoutube]);

  useEffect(() => {
    if (!inputText) {
      setExtractStatus('');
    }
  }, [inputText]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== 'application/pdf' && file.type !== 'text/plain') {
      alert('目前仅支持 PDF 和 TXT 文本文件。');
      return;
    }
    try {
      const base64 = await fileToBase64(file);
      setAttachedFile({ name: file.name, type: file.type, data: base64 });
    } catch (err) {
      alert('读取文件失败');
    }
  };

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (!file) return;
    if (file.type !== 'application/pdf' && file.type !== 'text/plain') {
       alert('目前仅支持 PDF 和 TXT 文本文件。');
       return;
    }
    try {
      const base64 = await fileToBase64(file);
      setAttachedFile({ name: file.name, type: file.type, data: base64 });
    } catch (err) {}
  }, [setAttachedFile]);

  return (
    <div className="flex flex-col h-full bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden relative">
      <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center text-white">
              <FileText size={18} />
            </div>
            内容输入
          </h2>
          <p className="text-sm text-gray-500 mt-1">上传文件或粘贴内容以重组。</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={toggleHistory}
            className="p-2 hover:bg-white border border-transparent hover:border-gray-200 rounded-lg text-gray-500 transition-all"
            title="历史记录"
          >
            <Clock size={20} />
          </button>
          <button 
            onClick={() => setShowSettings(!showSettings)}
            className={`p-2 hover:bg-white border border-transparent hover:border-gray-200 rounded-lg transition-all ${showSettings ? 'text-brand-600' : 'text-gray-500'}`}
            title="设置"
          >
            <Settings size={20} />
          </button>
        </div>
      </div>

      {/* Settings Dropdown Overlay */}
      {showSettings && (
        <div className="absolute top-20 right-4 z-20 w-72 bg-white border border-gray-200 rounded-xl shadow-xl p-5 animate-in fade-in slide-in-from-top-4 duration-200">
          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">首选项</h4>
          
          <div className="space-y-6">
            <section>
              <h5 className="text-[10px] font-bold text-gray-500 mb-2 uppercase">通用设置</h5>
              <label className="flex items-center justify-between cursor-pointer group mb-2">
                <span className="text-sm text-gray-600 group-hover:text-gray-900 transition-colors">自动提取 YouTube 字幕</span>
                <input 
                  type="checkbox" 
                  checked={autoExtractYoutube}
                  onChange={(e) => setAutoExtractYoutube(e.target.checked)}
                  className="w-4 h-4 text-brand-600 rounded border-gray-300 focus:ring-brand-500" 
                />
              </label>
            </section>

            <section>
              <h5 className="text-[10px] font-bold text-gray-500 mb-3 uppercase">小红书写作风格</h5>
              <div className="grid grid-cols-1 gap-2">
                {STYLE_OPTIONS.map((style) => {
                  const Icon = style.icon;
                  const isActive = selectedXhsStyle === style.id;
                  return (
                    <button
                      key={style.id}
                      onClick={() => setSelectedXhsStyle(style.id)}
                      className={`flex items-center gap-3 p-2.5 rounded-lg border transition-all text-sm ${
                        isActive 
                        ? 'border-brand-500 bg-brand-50 text-brand-700 font-medium' 
                        : 'border-gray-100 bg-gray-50 text-gray-600 hover:border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      <Icon size={16} />
                      {style.label}
                      {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-brand-500" />}
                    </button>
                  );
                })}
              </div>
            </section>

            <div className="pt-2 border-t border-gray-50 flex justify-end">
              <button 
                onClick={() => setShowSettings(false)}
                className="text-xs font-medium text-brand-600 hover:text-brand-700"
              >
                完成
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 p-6 flex flex-col gap-4 overflow-y-auto">
        <div className="flex-1 min-h-[200px] flex flex-col gap-2 relative">
          <label className="text-sm font-medium text-gray-700 flex justify-between">
            <span>粘贴内容 / URL</span>
            <span className="text-xs text-gray-400 font-normal">支持 YouTube 自动提取</span>
          </label>
          <div className="relative flex-1">
            <textarea
              className={`w-full h-full p-4 rounded-lg border border-gray-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none transition-all resize-none text-sm leading-relaxed ${
                isExtracting ? 'opacity-50' : ''
              }`}
              placeholder="在此粘贴文章内容、YouTube 视频链接..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              disabled={isExtracting}
            />
            {isExtracting && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/50 rounded-lg backdrop-blur-sm">
                <Loader2 className="w-8 h-8 text-brand-500 animate-spin mb-2" />
                <span className="text-sm font-medium text-brand-700">正在提取 YouTube 字幕...</span>
              </div>
            )}
            {!isExtracting && extractStatus === 'done' && (
               <div className="absolute bottom-4 right-4 text-xs text-green-600 bg-green-50 px-2 py-1 rounded border border-green-100 flex items-center gap-1 animate-fade-in-up">
                 <Youtube size={12} /> 字幕提取成功
               </div>
            )}
          </div>
        </div>

        <div 
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          className={`relative border-2 border-dashed rounded-xl p-6 transition-all ${
            attachedFile ? 'border-brand-200 bg-brand-50' : 'border-gray-200 hover:border-brand-300 hover:bg-gray-50'
          }`}
        >
          <input type="file" ref={fileInputRef} className="hidden" accept=".pdf,.txt" onChange={handleFileChange} />
          {attachedFile ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-white border border-brand-200 flex items-center justify-center text-brand-600">
                  <FileIcon size={20} />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 truncate max-w-[200px]">{attachedFile.name}</p>
                  <p className="text-xs text-gray-500 uppercase">{attachedFile.type.split('/')[1]}</p>
                </div>
              </div>
              <button onClick={() => setAttachedFile(null)} className="p-1 hover:bg-red-100 text-gray-400 hover:text-red-500 rounded-full transition-colors"><X size={18} /></button>
            </div>
          ) : (
            <div onClick={() => fileInputRef.current?.click()} className="flex flex-col items-center justify-center cursor-pointer gap-2 py-4">
              <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center mb-1"><Upload size={20} /></div>
              <p className="text-sm font-medium text-gray-600">上传 PDF 或 TXT</p>
            </div>
          )}
        </div>
      </div>

      <div className="p-6 border-t border-gray-100 bg-gray-50/50">
        <button
          onClick={onGenerate}
          disabled={isGenerating || (!inputText && !attachedFile) || isExtracting}
          className={`w-full py-3 px-4 rounded-xl flex items-center justify-center gap-2 font-medium transition-all shadow-sm ${
            isGenerating || (!inputText && !attachedFile) || isExtracting
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
              : 'bg-brand-600 hover:bg-brand-700 text-white shadow-brand-500/20 active:scale-[0.98]'
          }`}
        >
          {isGenerating ? (
            <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />正在生成内容...</>
          ) : (
            <>生成内容<div className="px-1.5 py-0.5 bg-white/20 rounded text-xs font-bold">⌘ Enter</div></>
          )}
        </button>
      </div>
    </div>
  );
};

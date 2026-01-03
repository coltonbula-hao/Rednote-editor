
import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Copy, Check, FileText, Smartphone, Image as ImageIcon, Code, Wand2, Download } from 'lucide-react';
import { ContentState, Tab } from '../types';

interface ResultSectionProps {
  content: ContentState;
  hasResult: boolean;
  onGenerateImages: () => void;
  isGeneratingImages: boolean;
}

export const ResultSection: React.FC<ResultSectionProps> = ({ 
  content, 
  hasResult, 
  onGenerateImages,
  isGeneratingImages 
}) => {
  const [activeTab, setActiveTab] = useState<Tab>(Tab.BLOG);
  const [copied, setCopied] = useState(false);

  const getActiveContent = () => {
    switch (activeTab) {
      case Tab.BLOG: return content.blogPost;
      case Tab.XHS: return `${content.xhsTitles}\n\n---\n\n${content.xhsContent}`;
      case Tab.INFO: return content.infographicPrompts;
      case Tab.RAW: return content.rawResponse;
      default: return '';
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(getActiveContent());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!hasResult) {
    return (
      <div className="h-full bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col items-center justify-center text-center p-8 text-gray-400">
        <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mb-4">
          <Smartphone size={32} className="opacity-20" />
        </div>
        <h3 className="text-lg font-medium text-gray-600 mb-2">准备就绪</h3>
        <p className="max-w-xs mx-auto text-sm">
          Agent 生成的内容将显示在此处，已适配多个平台。
        </p>
      </div>
    );
  }

  const tabs = [
    { id: Tab.BLOG, label: '博客长文', icon: FileText },
    { id: Tab.XHS, label: '小红书', icon: Smartphone, color: 'text-xhs-red' },
    { id: Tab.INFO, label: '信息图 & 提示词', icon: ImageIcon },
    { id: Tab.RAW, label: '源码', icon: Code },
  ];

  return (
    <div className="flex flex-col h-full bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Tabs */}
      <div className="flex border-b border-gray-100 overflow-x-auto hide-scrollbar">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-4 text-sm font-medium transition-colors whitespace-nowrap min-w-[120px] border-b-2 ${
                isActive
                  ? 'border-brand-500 text-brand-600 bg-brand-50/30'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Icon size={16} className={tab.color && isActive ? tab.color : ''} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar bg-white relative">
        <div className="p-8 max-w-3xl mx-auto">
          {activeTab === Tab.BLOG ? (
            <div className="prose prose-slate prose-headings:font-semibold prose-a:text-brand-600 hover:prose-a:text-brand-500 max-w-none">
              <ReactMarkdown>{content.blogPost}</ReactMarkdown>
            </div>
          ) : activeTab === Tab.XHS ? (
            <div className="space-y-8">
              <div className="bg-rose-50 rounded-xl p-6 border border-rose-100">
                <h3 className="text-xs font-bold text-rose-500 uppercase tracking-wide mb-3 flex items-center gap-2">
                  <Smartphone size={14} /> 备选标题
                </h3>
                <div className="space-y-2 text-gray-800 font-medium whitespace-pre-line">
                  {content.xhsTitles}
                </div>
              </div>
              <div>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">正文内容</h3>
                <div className="whitespace-pre-wrap text-gray-700 leading-relaxed font-sans text-[15px]">
                  {content.xhsContent}
                </div>
              </div>
            </div>
          ) : activeTab === Tab.INFO ? (
            <div className="space-y-8">
              {/* Image Generation Section */}
              <div className="bg-indigo-50/50 rounded-xl p-6 border border-indigo-100">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-indigo-900 uppercase tracking-wide flex items-center gap-2">
                    <ImageIcon size={16} /> 视觉生成
                  </h3>
                  {content.generatedImages.length === 0 && (
                    <button
                      onClick={onGenerateImages}
                      disabled={isGeneratingImages}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all text-white shadow-sm ${
                        isGeneratingImages
                          ? 'bg-indigo-300 cursor-not-allowed'
                          : 'bg-indigo-600 hover:bg-indigo-700 active:scale-95'
                      }`}
                    >
                      {isGeneratingImages ? (
                         <>
                           <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                           正在绘图...
                         </>
                      ) : (
                        <>
                          <Wand2 size={16} />
                          生成 5 张信息图 (Gemini 3 Pro Image)
                        </>
                      )}
                    </button>
                  )}
                </div>

                {/* Display Generated Images */}
                {content.generatedImages.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                    {content.generatedImages.map((base64, idx) => (
                      <div key={idx} className="relative group aspect-[3/4] rounded-lg overflow-hidden border border-gray-200 bg-white shadow-sm">
                        <img 
                          src={`data:image/png;base64,${base64}`} 
                          alt={`Generated ${idx + 1}`} 
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                           <a 
                             href={`data:image/png;base64,${base64}`} 
                             download={`infographic-${idx+1}.png`}
                             className="p-2 bg-white/20 hover:bg-white/40 rounded-full text-white backdrop-blur-sm transition-colors"
                             title="下载图片"
                           >
                             <Download size={18} />
                           </a>
                        </div>
                        <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/50 backdrop-blur-md rounded text-[10px] text-white font-medium">
                          图 {idx + 1}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {content.generatedImages.length > 0 && (
                   <div className="text-center">
                     <button
                        onClick={onGenerateImages}
                        disabled={isGeneratingImages}
                        className="text-xs text-indigo-600 hover:text-indigo-800 underline"
                     >
                       重新生成图片
                     </button>
                   </div>
                )}
              </div>

              {/* Prompts Section */}
              <div>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">AI 提示词 (Prompts)</h3>
                <div className="whitespace-pre-wrap text-gray-600 leading-relaxed font-mono text-sm bg-gray-50 p-6 rounded-lg border border-gray-100">
                  {content.infographicPrompts}
                </div>
              </div>
            </div>
          ) : (
            <div className="whitespace-pre-wrap text-gray-700 leading-relaxed font-mono text-sm bg-gray-50 p-6 rounded-lg border border-gray-100">
              {getActiveContent()}
            </div>
          )}
        </div>
      </div>

      {/* Action Bar */}
      <div className="p-4 border-t border-gray-100 bg-white flex justify-between items-center">
        <div className="text-xs text-gray-400">
          由 Gemini 3.0 Flash & Gemini 3 Pro Image 提供支持
        </div>
        {activeTab !== Tab.INFO && ( // In Info tab, the main action is generation, handled separately
          <button
            onClick={handleCopy}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              copied
                ? 'bg-green-100 text-green-700'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
            {copied ? '已复制！' : '复制内容'}
          </button>
        )}
      </div>
    </div>
  );
};

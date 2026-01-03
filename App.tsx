
import React, { useState, useEffect } from 'react';
import { UploadedFile, ContentState, HistoryItem, UserPreferences, Tab, XhsStyle } from './types';
import { InputSection } from './components/InputSection';
import { ResultSection } from './components/ResultSection';
import { HistoryPanel } from './components/HistoryPanel';
import { generateContent, generateImageFromPrompt } from './services/geminiService';
import { parseGeminiResponse, extractImagePrompts } from './utils/fileHelper';
import * as storage from './utils/storage';
import { Sparkles, Command } from 'lucide-react';

const App: React.FC = () => {
  // Main States
  const [inputText, setInputText] = useState('');
  const [attachedFile, setAttachedFile] = useState<UploadedFile | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingImages, setIsGeneratingImages] = useState(false);
  const [content, setContent] = useState<ContentState>({
    blogPost: '',
    xhsTitles: '',
    xhsContent: '',
    infographicPrompts: '',
    rawResponse: '',
    generatedImages: []
  });
  const [hasResult, setHasResult] = useState(false);

  // Persistence States
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [prefs, setPrefs] = useState<UserPreferences>(storage.getPreferences());
  const [showHistory, setShowHistory] = useState(false);

  // Load History on Mount
  useEffect(() => {
    setHistory(storage.getHistory());
  }, []);

  // Sync Prefs to Storage
  useEffect(() => {
    storage.savePreferences(prefs);
  }, [prefs]);

  const handleGenerate = async () => {
    if (!inputText && !attachedFile) return;

    setIsGenerating(true);
    setHasResult(false);
    setContent(prev => ({ ...prev, generatedImages: [] }));
    
    try {
      const resultText = await generateContent(inputText, attachedFile, prefs.selectedXhsStyle);
      const parsed = parseGeminiResponse(resultText);
      
      const newContent = {
        rawResponse: resultText,
        ...parsed,
        generatedImages: []
      };

      setContent(newContent);
      setHasResult(true);

      // Save to History
      if (prefs.saveHistory) {
        const historyItem: HistoryItem = {
          id: crypto.randomUUID(),
          timestamp: Date.now(),
          input: {
            text: inputText,
            fileName: attachedFile?.name || null
          },
          content: {
            blogPost: parsed.blogPost,
            xhsTitles: parsed.xhsTitles,
            xhsContent: parsed.xhsContent,
            infographicPrompts: parsed.infographicPrompts,
            rawResponse: resultText
          }
        };
        storage.saveHistoryItem(historyItem);
        setHistory(storage.getHistory());
      }
    } catch (error: any) {
      console.error("Generation failed", error);
      if (error.status === 500) {
        alert("服务器繁忙 (500)。请稍后重试。");
      } else {
        alert("生成出错，请检查 API Key。");
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleHistorySelect = (item: HistoryItem) => {
    setInputText(item.input.text);
    // Note: We can't easily restore the attached file's content (the base64 blob) 
    // from history without massive storage use, so we just restore text inputs.
    setContent({
      ...item.content,
      generatedImages: []
    });
    setHasResult(true);
    setShowHistory(false);
  };

  const handleDeleteHistory = (id: string) => {
    storage.deleteHistoryItem(id);
    setHistory(storage.getHistory());
  };

  const handleClearHistory = () => {
    if (confirm('确定要清空所有历史记录吗？')) {
      storage.clearHistory();
      setHistory([]);
    }
  };

  const handleGenerateImages = async () => {
    if (!content.infographicPrompts) return;
    try {
      if ((window as any).aistudio) {
        const hasKey = await (window as any).aistudio.hasSelectedApiKey();
        if (!hasKey) await (window as any).aistudio.openSelectKey();
      }
    } catch (e) {}

    setIsGeneratingImages(true);
    try {
      const prompts = extractImagePrompts(content.infographicPrompts);
      if (prompts.length === 0) {
        alert("未能识别提示词格式。");
        setIsGeneratingImages(false);
        return;
      }
      const imagePromises = prompts.slice(0, 5).map(prompt => generateImageFromPrompt(prompt));
      const results = await Promise.all(imagePromises);
      const successfulImages = results.filter((img): img is string => img !== null);
      setContent(prev => ({ ...prev, generatedImages: successfulImages }));
    } catch (error: any) {
      console.error("Image generation failed", error);
      alert("图片生成出错。");
    } finally {
      setIsGeneratingImages(false);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        if (!isGenerating && (inputText || attachedFile)) handleGenerate();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [inputText, attachedFile, isGenerating]);

  return (
    <div className="min-h-screen bg-slate-50 text-gray-900 font-sans selection:bg-brand-100 selection:text-brand-900 overflow-hidden flex flex-col">
      <header className="h-16 bg-white border-b border-gray-200 fixed top-0 w-full z-10 flex items-center justify-between px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-brand-500/20">
            <Sparkles size={18} />
          </div>
          <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600">
            小红书 <span className="font-medium text-gray-400 text-sm ml-1">Agent</span>
          </h1>
        </div>
        <div className="hidden md:flex items-center gap-4 text-sm font-medium text-gray-500">
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-gray-50 border border-gray-200">
            <Command size={12} />
            <span>+ Enter 运行</span>
          </span>
        </div>
      </header>

      <main className="pt-16 flex-1 flex min-h-0 relative">
        {/* Sliding History Panel */}
        {showHistory && (
          <div className="absolute inset-0 z-20 flex lg:relative lg:inset-auto">
            <HistoryPanel 
              history={history}
              onSelect={handleHistorySelect}
              onDelete={handleDeleteHistory}
              onClear={handleClearHistory}
              onClose={() => setShowHistory(false)}
            />
            {/* Overlay for mobile */}
            <div 
              className="flex-1 bg-black/20 lg:hidden" 
              onClick={() => setShowHistory(false)}
            />
          </div>
        )}

        <div className="flex-1 p-4 sm:p-6 lg:p-8 flex flex-col lg:flex-row gap-6 min-h-0 overflow-hidden">
          <div className="w-full lg:w-[450px] shrink-0 h-[400px] lg:h-auto min-h-0">
            <InputSection
              inputText={inputText}
              setInputText={setInputText}
              attachedFile={attachedFile}
              setAttachedFile={setAttachedFile}
              onGenerate={handleGenerate}
              isGenerating={isGenerating}
              toggleHistory={() => setShowHistory(!showHistory)}
              autoExtractYoutube={prefs.autoExtractYoutube}
              setAutoExtractYoutube={(val) => setPrefs(p => ({ ...p, autoExtractYoutube: val }))}
              selectedXhsStyle={prefs.selectedXhsStyle}
              setSelectedXhsStyle={(style) => setPrefs(p => ({ ...p, selectedXhsStyle: style }))}
            />
          </div>

          <div className="flex-1 min-h-0">
            <ResultSection 
              content={content} 
              hasResult={hasResult}
              onGenerateImages={handleGenerateImages}
              isGeneratingImages={isGeneratingImages}
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;

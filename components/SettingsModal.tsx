
import React, { useState, useRef, useEffect } from 'react';
import { X, Save, Key, Check, Download, Upload, AlertTriangle, Sparkles, Zap, Brain, ChevronDown, Edit3, Globe } from 'lucide-react';
import { AppSettings, ModelProvider } from '../types';
import { exportAllData, importAllData } from '../services/storageService';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSave: (newSettings: AppSettings) => void;
  onDataImported?: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, settings, onSave, onDataImported }) => {
  const [geminiKey, setGeminiKey] = useState(settings.geminiKey);
  const [openaiKey, setOpenaiKey] = useState(settings.openaiKey);
  const [anthropicKey, setAnthropicKey] = useState(settings.anthropicKey);
  const [deepseekKey, setDeepseekKey] = useState(settings.deepseekKey);
  const [provider, setProvider] = useState<ModelProvider>(settings.selectedProvider);
  
  // Model States
  const [openaiModel, setOpenaiModel] = useState(settings.openaiModel || 'gpt-4o');
  const [anthropicModel, setAnthropicModel] = useState(settings.anthropicModel || 'claude-3-7-sonnet-20250219');
  const [deepseekModel, setDeepseekModel] = useState(settings.deepseekModel || 'deepseek-chat');

  // Custom / Universal Provider States
  const [customBaseUrl, setCustomBaseUrl] = useState(settings.customBaseUrl || 'https://api.x.ai/v1');
  const [customKey, setCustomKey] = useState(settings.customKey || '');
  const [customModelId, setCustomModelId] = useState(settings.customModelId || 'grok-beta');

  const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
        setGeminiKey(settings.geminiKey);
        setOpenaiKey(settings.openaiKey);
        setAnthropicKey(settings.anthropicKey);
        setDeepseekKey(settings.deepseekKey);
        setProvider(settings.selectedProvider);
        
        setOpenaiModel(settings.openaiModel || 'gpt-4o');
        setAnthropicModel(settings.anthropicModel || 'claude-3-7-sonnet-20250219');
        setDeepseekModel(settings.deepseekModel || 'deepseek-chat');

        setCustomBaseUrl(settings.customBaseUrl || 'https://api.x.ai/v1');
        setCustomKey(settings.customKey || '');
        setCustomModelId(settings.customModelId || 'grok-beta');
    }
  }, [isOpen, settings]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave({
      geminiKey,
      openaiKey,
      anthropicKey,
      deepseekKey,
      selectedProvider: provider,
      openaiModel,
      anthropicModel,
      deepseekModel,
      customBaseUrl,
      customKey,
      customModelId
    });
    onClose();
  };

  const handleExport = () => {
    const jsonString = exportAllData();
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `queryquant-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const success = importAllData(content);
      if (success) {
        setImportStatus('success');
        if (onDataImported) onDataImported();
        setTimeout(() => setImportStatus('idle'), 3000);
      } else {
        setImportStatus('error');
        setTimeout(() => setImportStatus('idle'), 3000);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const ProviderCard = ({ id, name, desc, icon: Icon }: { id: ModelProvider, name: string, desc: string, icon: any }) => (
    <button
      onClick={() => setProvider(id)}
      className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all min-h-[100px] ${
        provider === id 
          ? 'bg-[#EACEAA]/50 border-[#85431E] text-[#85431E] ring-1 ring-[#85431E]' 
          : 'bg-white border-[#EACEAA] text-[#D39858] hover:bg-[#EACEAA]/20'
      }`}
    >
      <Icon size={24} className={provider === id ? 'text-[#85431E]' : 'opacity-70'} />
      <div className="text-center">
        <span className="font-semibold block text-sm">{name}</span>
        <span className="text-[10px] opacity-70 leading-tight block mt-1">{desc}</span>
      </div>
    </button>
  );

  // Helper component for Model Selector
  const ModelConfig = ({ 
    label, 
    value, 
    onChange, 
    options 
  }: { 
    label: string, 
    value: string, 
    onChange: (val: string) => void, 
    options: { label: string, value: string }[] 
  }) => {
    const isCustom = !options.some(opt => opt.value === value);
    const [mode, setMode] = useState<'select' | 'custom'>(isCustom ? 'custom' : 'select');
    const [customValue, setCustomValue] = useState(value);

    const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const val = e.target.value;
        if (val === 'CUSTOM_ENTRY') {
            setMode('custom');
        } else {
            onChange(val);
        }
    };

    const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setCustomValue(val);
        onChange(val);
    };

    const toggleMode = () => {
        if (mode === 'custom') {
            setMode('select');
            if (options.some(o => o.value === customValue)) {
                onChange(customValue);
            } else {
                onChange(options[0].value);
            }
        } else {
            setMode('custom');
        }
    };

    return (
        <div className="mt-3 bg-white/50 p-3 rounded-lg border border-[#D39858]/30">
            <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-[#85431E] uppercase">{label}</label>
                <button onClick={toggleMode} className="text-[10px] text-[#D39858] hover:text-[#85431E] underline">
                    {mode === 'custom' ? 'Select from list' : 'Enter custom ID'}
                </button>
            </div>
            
            {mode === 'select' ? (
                <div className="relative">
                    <select 
                        value={value} 
                        onChange={handleSelectChange}
                        className="w-full bg-white border border-[#D39858] rounded-lg px-3 py-2 text-sm text-[#34150F] focus:outline-none focus:ring-1 focus:ring-[#85431E] appearance-none"
                    >
                        {options.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                        <option value="CUSTOM_ENTRY" className="font-bold text-[#85431E]">➕ Custom / Other...</option>
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-3 text-[#D39858] pointer-events-none" />
                </div>
            ) : (
                <div className="relative">
                    <input 
                        type="text" 
                        value={customValue}
                        onChange={handleCustomChange}
                        placeholder="e.g. gpt-4-turbo or o1-preview"
                        className="w-full bg-white border border-[#D39858] rounded-lg px-3 py-2 text-sm text-[#34150F] focus:outline-none focus:ring-1 focus:ring-[#85431E]"
                    />
                    <Edit3 size={14} className="absolute right-3 top-3 text-[#D39858] pointer-events-none" />
                </div>
            )}
        </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#34150F]/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white border border-[#D39858] rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh]">
        
        <div className="flex items-center justify-between p-6 border-b border-[#EACEAA] shrink-0">
          <h2 className="text-xl font-bold text-[#34150F] flex items-center gap-2">
            <Key className="text-[#85431E]" size={20} />
            Settings
          </h2>
          <button onClick={onClose} className="text-[#D39858] hover:text-[#85431E] transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-8 overflow-y-auto">
          
          {/* Section: Provider */}
          <div>
             <h3 className="text-sm font-bold text-[#85431E] uppercase tracking-wider mb-4">AI Provider</h3>
             <label className="block text-sm font-medium text-[#34150F] mb-3">Select Default Model</label>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <ProviderCard 
                id="gemini" 
                name="Google Gemini" 
                desc="Official API" 
                icon={Sparkles} 
              />
              <ProviderCard 
                id="openai" 
                name="ChatGPT" 
                desc="GPT-4o" 
                icon={Zap} 
              />
              <ProviderCard 
                id="anthropic" 
                name="Claude" 
                desc="Sonnet 3.7" 
                icon={Brain} 
              />
              <ProviderCard 
                id="deepseek" 
                name="DeepSeek" 
                desc="V3/R1" 
                icon={Zap} 
              />
              <div className="col-span-2 sm:col-span-1">
                 <ProviderCard 
                    id="custom" 
                    name="Custom / Other" 
                    desc="Grok, Ollama, etc" 
                    icon={Globe} 
                  />
              </div>
            </div>
          </div>

          {/* Section: API Keys & Models */}
          <div className="space-y-4 animate-fade-in bg-[#F5EFE6] p-4 rounded-xl border border-[#EACEAA]">
             {provider === 'gemini' && (
                <div>
                   <label className="block text-sm font-medium text-[#34150F] mb-2">Gemini API Key (Optional)</label>
                   <input 
                     type="password" 
                     value={geminiKey}
                     onChange={(e) => setGeminiKey(e.target.value)}
                     placeholder="AIzaSy..."
                     className="w-full bg-white border border-[#D39858] rounded-lg px-4 py-3 text-[#34150F] placeholder-[#D39858]/50 focus:outline-none focus:ring-2 focus:ring-[#85431E]"
                   />
                   <p className="text-[10px] text-[#D39858] mt-2">
                     If left blank, uses the built-in key (if deployed on official server). 
                     <br/><strong>Required for local/GitHub Pages deployment.</strong>
                   </p>
                </div>
             )}

             {provider === 'openai' && (
              <div>
                <label className="block text-sm font-medium text-[#34150F] mb-2">OpenAI API Key</label>
                <input 
                  type="password" 
                  value={openaiKey}
                  onChange={(e) => setOpenaiKey(e.target.value)}
                  placeholder="sk-proj-..."
                  className="w-full bg-white border border-[#D39858] rounded-lg px-4 py-3 text-[#34150F] placeholder-[#D39858]/50 focus:outline-none focus:ring-2 focus:ring-[#85431E]"
                />
                
                <ModelConfig 
                    label="OpenAI Model"
                    value={openaiModel}
                    onChange={setOpenaiModel}
                    options={[
                        { label: 'GPT-4o', value: 'gpt-4o' },
                        { label: 'GPT-4o Mini', value: 'gpt-4o-mini' },
                        { label: 'o1-preview', value: 'o1-preview' },
                        { label: 'o1-mini', value: 'o1-mini' },
                        { label: 'GPT-4 Turbo', value: 'gpt-4-turbo' },
                        { label: 'GPT-3.5 Turbo', value: 'gpt-3.5-turbo' },
                    ]}
                />
              </div>
            )}

            {provider === 'anthropic' && (
              <div>
                <label className="block text-sm font-medium text-[#34150F] mb-2">Anthropic API Key</label>
                <input 
                  type="password" 
                  value={anthropicKey}
                  onChange={(e) => setAnthropicKey(e.target.value)}
                  placeholder="sk-ant-..."
                  className="w-full bg-white border border-[#D39858] rounded-lg px-4 py-3 text-[#34150F] placeholder-[#D39858]/50 focus:outline-none focus:ring-2 focus:ring-[#85431E]"
                />
                
                <ModelConfig 
                    label="Claude Model"
                    value={anthropicModel}
                    onChange={setAnthropicModel}
                    options={[
                        { label: 'Claude 3.7 Sonnet', value: 'claude-3-7-sonnet-20250219' },
                        { label: 'Claude 3.5 Sonnet', value: 'claude-3-5-sonnet-20241022' },
                        { label: 'Claude 3 Opus', value: 'claude-3-opus-20240229' },
                        { label: 'Claude 3 Haiku', value: 'claude-3-haiku-20240307' },
                    ]}
                />
              </div>
            )}

             {provider === 'deepseek' && (
              <div>
                <label className="block text-sm font-medium text-[#34150F] mb-2">DeepSeek API Key</label>
                <input 
                  type="password" 
                  value={deepseekKey}
                  onChange={(e) => setDeepseekKey(e.target.value)}
                  placeholder="sk-..."
                  className="w-full bg-white border border-[#D39858] rounded-lg px-4 py-3 text-[#34150F] placeholder-[#D39858]/50 focus:outline-none focus:ring-2 focus:ring-[#85431E]"
                />
                
                <ModelConfig 
                    label="DeepSeek Model"
                    value={deepseekModel}
                    onChange={setDeepseekModel}
                    options={[
                        { label: 'DeepSeek-V3 (Chat)', value: 'deepseek-chat' },
                        { label: 'DeepSeek-R1 (Reasoner)', value: 'deepseek-reasoner' },
                    ]}
                />
              </div>
            )}

            {provider === 'custom' && (
              <div className="space-y-4">
                <div className="bg-[#EACEAA]/30 p-3 rounded-lg text-xs text-[#85431E]">
                   Universal provider for any <strong>OpenAI-compatible</strong> API (Grok, Ollama, OpenRouter, etc).
                </div>

                <div>
                    <label className="block text-sm font-medium text-[#34150F] mb-2">Base URL</label>
                    <input 
                      type="text" 
                      value={customBaseUrl}
                      onChange={(e) => setCustomBaseUrl(e.target.value)}
                      placeholder="https://api.x.ai/v1"
                      className="w-full bg-white border border-[#D39858] rounded-lg px-4 py-3 text-[#34150F] placeholder-[#D39858]/50 focus:outline-none focus:ring-2 focus:ring-[#85431E]"
                    />
                    <p className="text-[10px] text-[#D39858] mt-1">e.g. <code>https://api.x.ai/v1</code> for Grok, or <code>http://localhost:11434/v1</code> for Ollama.</p>
                </div>

                <div>
                    <label className="block text-sm font-medium text-[#34150F] mb-2">API Key</label>
                    <input 
                      type="password" 
                      value={customKey}
                      onChange={(e) => setCustomKey(e.target.value)}
                      placeholder="sk-..."
                      className="w-full bg-white border border-[#D39858] rounded-lg px-4 py-3 text-[#34150F] placeholder-[#D39858]/50 focus:outline-none focus:ring-2 focus:ring-[#85431E]"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-[#34150F] mb-2">Model ID</label>
                    <input 
                      type="text" 
                      value={customModelId}
                      onChange={(e) => setCustomModelId(e.target.value)}
                      placeholder="e.g. grok-beta"
                      className="w-full bg-white border border-[#D39858] rounded-lg px-4 py-3 text-[#34150F] placeholder-[#D39858]/50 focus:outline-none focus:ring-2 focus:ring-[#85431E]"
                    />
                </div>
              </div>
            )}
          </div>

          {/* Section: Data Sync */}
          <div>
            <h3 className="text-sm font-bold text-[#85431E] uppercase tracking-wider mb-4">Data Management</h3>
            
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={handleExport}
                className="flex items-center justify-center gap-2 p-3 bg-white hover:bg-[#EACEAA]/30 border border-[#D39858] rounded-xl text-[#34150F] transition-colors text-sm font-medium"
              >
                <Download size={16} />
                Export Data
              </button>
              
              <button 
                onClick={handleImportClick}
                className="flex items-center justify-center gap-2 p-3 bg-white hover:bg-[#EACEAA]/30 border border-[#D39858] rounded-xl text-[#34150F] transition-colors text-sm font-medium relative overflow-hidden"
              >
                <input 
                   type="file" 
                   ref={fileInputRef} 
                   onChange={handleFileChange}
                   accept=".json"
                   className="hidden" 
                />
                <Upload size={16} />
                Import Data
              </button>
            </div>

            {importStatus === 'success' && (
              <div className="mt-3 flex items-center gap-2 text-[#85431E] text-sm animate-fade-in">
                <Check size={16} />
                <span>Data imported successfully! Reloading...</span>
              </div>
            )}
             {importStatus === 'error' && (
              <div className="mt-3 flex items-center gap-2 text-rose-500 text-sm animate-fade-in">
                <AlertTriangle size={16} />
                <span>Invalid file format.</span>
              </div>
            )}
          </div>

        </div>

        <div className="p-6 border-t border-[#EACEAA] flex justify-end shrink-0">
          <button 
            onClick={handleSave}
            className="bg-[#85431E] hover:bg-[#6e3618] text-[#EACEAA] px-6 py-2.5 rounded-xl font-medium flex items-center gap-2 transition-colors shadow-lg shadow-[#85431E]/20"
          >
            <Save size={18} />
            Save Changes
          </button>
        </div>

      </div>
    </div>
  );
};

export default SettingsModal;

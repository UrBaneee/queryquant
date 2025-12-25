
import React, { useState, useEffect, useCallback } from 'react';
import { LayoutDashboard, MessageSquareText, BarChart3, PlusCircle, Settings } from 'lucide-react';
import Dashboard from './components/Dashboard';
import ChatInterface from './components/ChatInterface';
import SettingsModal from './components/SettingsModal';
import { DailyStat, ViewState, AppSettings } from './types';
import { getStats, incrementCount } from './services/storageService';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>(ViewState.DASHBOARD);
  const [stats, setStats] = useState<Record<string, DailyStat>>({});
  const [manualLogSuccess, setManualLogSuccess] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  // App Settings State
  const [appSettings, setAppSettings] = useState<AppSettings>({
    geminiKey: localStorage.getItem('gemini_key') || '',
    openaiKey: localStorage.getItem('openai_key') || '',
    anthropicKey: localStorage.getItem('anthropic_key') || '',
    deepseekKey: localStorage.getItem('deepseek_key') || '',
    selectedProvider: (localStorage.getItem('provider') as any) || 'gemini',
    
    // Load saved models or default to current best standards
    openaiModel: localStorage.getItem('openai_model') || 'gpt-4o',
    anthropicModel: localStorage.getItem('anthropic_model') || 'claude-3-7-sonnet-20250219',
    deepseekModel: localStorage.getItem('deepseek_model') || 'deepseek-chat',

    // Custom Provider Defaults
    customBaseUrl: localStorage.getItem('custom_base_url') || 'https://api.x.ai/v1',
    customKey: localStorage.getItem('custom_key') || '',
    customModelId: localStorage.getItem('custom_model_id') || 'grok-beta',
  });

  // Load stats on mount
  useEffect(() => {
    setStats(getStats());
  }, []);

  const refreshStats = useCallback(() => {
    setStats(getStats());
  }, []);

  // Handler for internal chat questions
  const handleInternalMessage = useCallback(() => {
    const newStats = incrementCount('internal');
    setStats(newStats);
  }, []);

  // Handler for manual external logging
  const handleExternalLog = useCallback(() => {
    const newStats = incrementCount('external');
    setStats(newStats);
    setManualLogSuccess(true);
    setTimeout(() => setManualLogSuccess(false), 2000);
  }, []);

  const handleSaveSettings = (newSettings: AppSettings) => {
    setAppSettings(newSettings);
    // Keys
    localStorage.setItem('gemini_key', newSettings.geminiKey);
    localStorage.setItem('openai_key', newSettings.openaiKey);
    localStorage.setItem('anthropic_key', newSettings.anthropicKey);
    localStorage.setItem('deepseek_key', newSettings.deepseekKey);
    localStorage.setItem('provider', newSettings.selectedProvider);
    
    // Models
    localStorage.setItem('openai_model', newSettings.openaiModel);
    localStorage.setItem('anthropic_model', newSettings.anthropicModel);
    localStorage.setItem('deepseek_model', newSettings.deepseekModel);

    // Custom Provider
    localStorage.setItem('custom_base_url', newSettings.customBaseUrl);
    localStorage.setItem('custom_key', newSettings.customKey);
    localStorage.setItem('custom_model_id', newSettings.customModelId);
  };

  return (
    <div className="h-screen bg-[#EACEAA] text-[#34150F] font-sans selection:bg-[#85431E] selection:text-[#EACEAA] flex flex-col overflow-hidden">
      
      {/* Navigation Bar - Changed to relative to consume flex space naturally */}
      <nav className="relative z-40 bg-[#34150F] text-[#EACEAA] shadow-md border-b border-[#85431E]/30 h-16 shrink-0">
        <div className="w-full px-4 sm:px-6 lg:px-8 h-full">
          <div className="flex items-center justify-between h-full">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-[#85431E] rounded-lg flex items-center justify-center shadow-lg shadow-black/20">
                <BarChart3 className="text-[#EACEAA]" size={20} />
              </div>
              <span className="text-xl font-bold tracking-tight hidden sm:inline-block">
                QueryQuant
              </span>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="flex space-x-1 bg-[#2a110c] p-1 rounded-xl border border-[#522115]">
                <button
                  onClick={() => setCurrentView(ViewState.DASHBOARD)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    currentView === ViewState.DASHBOARD 
                      ? 'bg-[#EACEAA] text-[#34150F] shadow-sm' 
                      : 'text-[#D39858] hover:text-[#EACEAA] hover:bg-[#85431E]/20'
                  }`}
                >
                  <LayoutDashboard size={18} />
                  <span className="hidden sm:inline">Dashboard</span>
                </button>
                <button
                  onClick={() => setCurrentView(ViewState.CHAT)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    currentView === ViewState.CHAT 
                      ? 'bg-[#EACEAA] text-[#34150F] shadow-sm' 
                      : 'text-[#D39858] hover:text-[#EACEAA] hover:bg-[#85431E]/20'
                  }`}
                >
                  <MessageSquareText size={18} />
                  <span className="hidden sm:inline">Ask AI</span>
                </button>
              </div>

              <button 
                onClick={() => setIsSettingsOpen(true)}
                className="p-2.5 bg-[#2a110c] hover:bg-[#85431E]/30 text-[#D39858] hover:text-[#EACEAA] rounded-xl transition-colors border border-[#522115]"
              >
                <Settings size={20} />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className={`
        flex-1 flex flex-col overflow-hidden relative
        ${currentView === ViewState.DASHBOARD ? 'w-full' : 'w-full h-full bg-[#F5EFE6]'}
      `}>
        
        {/* Toast Notification */}
        <div className={`fixed bottom-8 right-8 z-50 transform transition-all duration-300 ${manualLogSuccess ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
          <div className="bg-[#85431E] text-[#EACEAA] px-6 py-3 rounded-xl shadow-2xl flex items-center gap-3 font-medium border border-[#D39858]">
             <PlusCircle size={20} />
             External query logged!
          </div>
        </div>

        {currentView === ViewState.DASHBOARD ? (
          <div className="flex-1 overflow-y-auto w-full">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <Dashboard 
                stats={stats} 
                onManualLog={handleExternalLog}
                onNavigateToChat={() => setCurrentView(ViewState.CHAT)}
              />
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col h-full animate-fade-in">
            <ChatInterface 
              onMessageSent={handleInternalMessage} 
              settings={appSettings}
            />
          </div>
        )}
      </main>

      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        settings={appSettings}
        onSave={handleSaveSettings}
        onDataImported={() => {
          refreshStats();
          window.location.reload(); 
        }}
      />
    </div>
  );
};

export default App;


import React, { useState, useRef, useEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { 
  Send, User, Bot, Loader2, Sparkles, Paperclip, 
  X, Image as ImageIcon, MessageSquare, Trash2, Plus, 
  Menu, ArrowUp, Copy, Edit2, Volume2, RotateCcw, Check, StopCircle,
  PanelRight, ChevronRight, Hash, GripVertical, Brain, Zap, Globe
} from 'lucide-react';
import { ChatMessage, Attachment, ChatSession, AppSettings } from '../types';
import { sendMessageToGemini, generateSpeechFromText } from '../services/geminiService';
import { sendMessageToOpenAI } from '../services/openaiService';
import { sendMessageToAnthropic } from '../services/anthropicService';
import { sendMessageToDeepSeek } from '../services/deepseekService';
import { sendMessageToCustomProvider } from '../services/customService';
import { getSessions, createSession, updateSession, deleteSession } from '../services/storageService';

interface ChatInterfaceProps {
  onMessageSent: () => void;
  settings: AppSettings;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ onMessageSent, settings }) => {
  // State for Layout
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  
  // Left Sidebar State
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 1024);
  const [sidebarWidth, setSidebarWidth] = useState(260); // Default 260px
  const [isResizing, setIsResizing] = useState(false);
  
  // Right Sidebar State
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(window.innerWidth > 1280);
  const [rightSidebarWidth, setRightSidebarWidth] = useState(260); // Default 260px
  const [isResizingRight, setIsResizingRight] = useState(false);

  // State for Chat Interaction
  const [input, setInput] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  // Logic Control Refs
  const requestIdRef = useRef<number>(0);
  
  // Audio State
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [isSpeakingLoading, setIsSpeakingLoading] = useState<string | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Initialization ---
  useEffect(() => {
    const loadedSessions = getSessions();
    setSessions(loadedSessions);
    if (loadedSessions.length > 0) {
      setActiveSessionId(loadedSessions[0].id);
    } else {
      createNewSession();
    }
    
    // Init Audio Context
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      audioContextRef.current = new AudioContextClass();
    }

    return () => {
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
    };
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [activeSessionId, sessions.length]); 

  // Handle Resize Window
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 1024) setIsSidebarOpen(false);
      else setIsSidebarOpen(true);
      
      if (window.innerWidth <= 1280) setIsRightSidebarOpen(false);
      else setIsRightSidebarOpen(true);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // --- Left Sidebar Resizing Logic ---
  const startResizing = useCallback((mouseDownEvent: React.MouseEvent) => {
    mouseDownEvent.preventDefault();
    setIsResizing(true);
    const startX = mouseDownEvent.clientX;
    const startWidth = sidebarWidth;

    const doDrag = (mouseMoveEvent: MouseEvent) => {
      const newWidth = startWidth + (mouseMoveEvent.clientX - startX);
      if (newWidth > 150 && newWidth < 450) {
        setSidebarWidth(newWidth);
      }
    };

    const stopDrag = () => {
      setIsResizing(false);
      document.removeEventListener('mousemove', doDrag);
      document.removeEventListener('mouseup', stopDrag);
      document.body.style.userSelect = ''; 
    };

    document.addEventListener('mousemove', doDrag);
    document.addEventListener('mouseup', stopDrag);
    document.body.style.userSelect = 'none'; 
  }, [sidebarWidth]);

  // --- Right Sidebar Resizing Logic ---
  const startResizingRight = useCallback((mouseDownEvent: React.MouseEvent) => {
    mouseDownEvent.preventDefault();
    setIsResizingRight(true);
    const startX = mouseDownEvent.clientX;
    const startWidth = rightSidebarWidth;

    const doDrag = (mouseMoveEvent: MouseEvent) => {
      // Dragging left increases width
      const newWidth = startWidth + (startX - mouseMoveEvent.clientX);
      if (newWidth > 150 && newWidth < 450) {
        setRightSidebarWidth(newWidth);
      }
    };

    const stopDrag = () => {
      setIsResizingRight(false);
      document.removeEventListener('mousemove', doDrag);
      document.removeEventListener('mouseup', stopDrag);
      document.body.style.userSelect = '';
    };

    document.addEventListener('mousemove', doDrag);
    document.addEventListener('mouseup', stopDrag);
    document.body.style.userSelect = 'none';
  }, [rightSidebarWidth]);

  // --- Session Management ---
  const activeSession = sessions.find(s => s.id === activeSessionId) || sessions[0];
  const messages = activeSession?.messages || [];

  const userQuestions = messages.filter(m => m.role === 'user');

  const createNewSession = () => {
    const newSession = createSession();
    setSessions(prev => [newSession, ...prev]);
    setActiveSessionId(newSession.id);
    if (window.innerWidth <= 768) {
      setIsSidebarOpen(false); 
    }
  };

  const handleSessionSelect = (id: string) => {
    stopAudio();
    setActiveSessionId(id);
    if (window.innerWidth <= 768) {
      setIsSidebarOpen(false);
    }
  };

  const handleDeleteSession = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const remaining = deleteSession(id);
    setSessions(remaining);
    if (activeSessionId === id) {
      if (remaining.length > 0) {
        setActiveSessionId(remaining[0].id);
      } else {
        createNewSession();
      }
    }
  };

  // --- Scrolling & Navigation ---
  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const scrollToMessage = (messageId: string) => {
    const element = document.getElementById(`msg-${messageId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      element.classList.add('bg-[#EACEAA]/20');
      setTimeout(() => {
        element.classList.remove('bg-[#EACEAA]/20');
      }, 2000);
    }
  };

  // --- File Handling ---
  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const processFile = async (file: File) => {
     if (!file.type.startsWith('image/')) {
      alert('Currently only image uploads are supported.');
      return;
    }

    try {
      const base64 = await convertFileToBase64(file);
      const base64Data = base64.split(',')[1];
      
      const newAttachment: Attachment = {
        type: 'image',
        mimeType: file.type,
        data: base64Data,
        name: file.name || `pasted-image-${Date.now()}.png`
      };
      setAttachments(prev => [...prev, newAttachment]);
    } catch (err) {
      console.error("File read error", err);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      await processFile(e.target.files[0]);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handlePaste = async (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    let imageFound = false;

    for (const item of items) {
      if (item.type.startsWith('image/')) {
        imageFound = true;
        const file = item.getAsFile();
        if (file) {
          await processFile(file);
        }
      }
    }
    if (imageFound) {
      e.preventDefault();
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  // --- Actions ---

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const stopAudio = () => {
    if (audioSourceRef.current) {
      try {
        audioSourceRef.current.stop();
      } catch (e) { }
      audioSourceRef.current = null;
    }
    setSpeakingId(null);
    setIsSpeakingLoading(null);
  };

  const cleanTextForSpeech = (text: string): string => {
    return text
      .replace(/```[\s\S]*?```/g, " Code block omitted. ")
      .replace(/`([^`]+)`/g, "$1")
      .replace(/[*_]{1,3}([^*_]+)[*_]{1,3}/g, "$1")
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .replace(/^#+\s+/gm, "")
      .replace(/!\[[^\]]*\]\([^)]+\)/g, "")
      .replace(/\n+/g, ". "); 
  };

  const pcmToAudioBuffer = (
    buffer: ArrayBuffer,
    ctx: AudioContext,
    sampleRate: number = 24000
  ): AudioBuffer => {
    const dataInt16 = new Int16Array(buffer);
    const numChannels = 1;
    const frameCount = dataInt16.length;
    const audioBuffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
    const channelData = audioBuffer.getChannelData(0);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i] / 32768.0;
    }
    return audioBuffer;
  };

  const handleSpeak = async (text: string, id: string) => {
    if (speakingId === id) {
      stopAudio();
      return;
    }
    stopAudio();
    setIsSpeakingLoading(id);

    try {
      const cleanedText = cleanTextForSpeech(text);
      if (!cleanedText.trim()) {
        alert("Nothing readable found in this message.");
        setIsSpeakingLoading(null);
        return;
      }
      if (audioContextRef.current?.state === 'suspended') {
        await audioContextRef.current.resume();
      }

      // Pass Gemini user key if available
      const audioArrayBuffer = await generateSpeechFromText(cleanedText, settings.geminiKey);
      const ctx = audioContextRef.current;
      if (!ctx) throw new Error("Audio Context not available");

      const audioBuffer = pcmToAudioBuffer(audioArrayBuffer, ctx, 24000);
      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(ctx.destination);
      source.onended = () => setSpeakingId(null);

      audioSourceRef.current = source;
      source.start(0);
      setSpeakingId(id);

    } catch (error) {
      console.error("Failed to play speech", error);
      alert("Could not play audio. Ensure Gemini API Key is set.");
    } finally {
      setIsSpeakingLoading(null);
    }
  };

  const handleEditMessage = (index: number) => {
    if (!activeSession) return;
    const msg = activeSession.messages[index];
    if (msg.role !== 'user') return;

    requestIdRef.current = 0; 
    setIsLoading(false);
    stopAudio();

    setInput(msg.text);
    if (msg.attachments) {
      setAttachments(msg.attachments);
    }

    const newMessages = activeSession.messages.slice(0, index);
    const updatedSession = { ...activeSession, messages: newMessages, updatedAt: Date.now() };
    updateSession(updatedSession);
    setSessions(prev => prev.map(s => s.id === updatedSession.id ? updatedSession : s));
  };

  // --- Routing Logic ---
  const routeMessage = async (text: string, history: ChatMessage[], atts: Attachment[]) => {
    const p = settings.selectedProvider;
    if (p === 'gemini') {
      return await sendMessageToGemini(text, history, atts, settings.geminiKey);
    } else if (p === 'openai') {
      return await sendMessageToOpenAI(text, history, settings.openaiKey, settings.openaiModel);
    } else if (p === 'anthropic') {
      return await sendMessageToAnthropic(text, history, settings.anthropicKey, atts, settings.anthropicModel);
    } else if (p === 'deepseek') {
      return await sendMessageToDeepSeek(text, history, settings.deepseekKey, settings.deepseekModel);
    } else if (p === 'custom') {
      return await sendMessageToCustomProvider(text, history, settings.customBaseUrl, settings.customKey, settings.customModelId);
    }
    throw new Error('Unknown provider');
  };

  const handleRegenerate = async () => {
    if (!activeSession || isLoading) return;
    stopAudio();

    const msgs = activeSession.messages;
    if (msgs.length === 0) return;

    let targetHistory = [...msgs];
    let lastUserText = "";
    let lastAttachments: Attachment[] = [];

    if (msgs[msgs.length - 1].role === 'model') {
      targetHistory.pop();
    }

    const lastMsg = targetHistory[targetHistory.length - 1];
    if (lastMsg && lastMsg.role === 'user') {
      lastUserText = lastMsg.text;
      lastAttachments = lastMsg.attachments || [];
      
      const updatedSession = { ...activeSession, messages: targetHistory, updatedAt: Date.now() };
      updateSession(updatedSession);
      setSessions(prev => prev.map(s => s.id === updatedSession.id ? updatedSession : s));

      setIsLoading(true);
      const currentRequestId = Date.now();
      requestIdRef.current = currentRequestId;

      try {
        // Use router logic
        const responseText = await routeMessage(lastUserText, targetHistory.slice(0, -1), lastAttachments);
        
        if (requestIdRef.current !== currentRequestId) return;

        const aiMsg: ChatMessage = {
          id: Date.now().toString(),
          role: 'model',
          text: responseText,
          timestamp: Date.now()
        };
        const finalMessages = [...targetHistory, aiMsg];
        const finalSession = { ...updatedSession, messages: finalMessages };
        updateSession(finalSession);
        setSessions(prev => prev.map(s => s.id === finalSession.id ? finalSession : s));
      } catch (error: any) {
        if (requestIdRef.current !== currentRequestId) return;
        console.error(error);
        const errorMsg: ChatMessage = {
          id: Date.now().toString(),
          role: 'model',
          text: `Error regenerating (${settings.selectedProvider}): ${error.message}`,
          timestamp: Date.now()
        };
        const errorSession = { ...updatedSession, messages: [...targetHistory, errorMsg] };
        updateSession(errorSession);
        setSessions(prev => prev.map(s => s.id === errorSession.id ? errorSession : s));
      } finally {
        if (requestIdRef.current === currentRequestId) {
          setIsLoading(false);
          scrollToBottom();
        }
      }
    }
  };

  const handleSend = async () => {
    if ((!input.trim() && attachments.length === 0) || isLoading || !activeSession) return;
    stopAudio();

    const currentInput = input;
    const currentAttachments = [...attachments];

    setInput('');
    setAttachments([]);
    setIsLoading(true);

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: currentInput.trim(),
      timestamp: Date.now(),
      attachments: currentAttachments
    };

    const updatedMessages = [...messages, userMsg];
    const updatedSession = { 
      ...activeSession, 
      messages: updatedMessages, 
      updatedAt: Date.now(),
      title: (messages.length === 0 && activeSession.title === 'New Chat') 
        ? (currentInput.slice(0, 30) || 'Image Query') 
        : activeSession.title
    };
    
    updateSession(updatedSession);
    setSessions(prev => prev.map(s => s.id === updatedSession.id ? updatedSession : s));
    onMessageSent();
    scrollToBottom();

    const currentRequestId = Date.now();
    requestIdRef.current = currentRequestId;

    try {
      // Route Message based on provider
      const responseText = await routeMessage(userMsg.text, messages, currentAttachments);
      
      if (requestIdRef.current !== currentRequestId) return;

      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: responseText,
        timestamp: Date.now()
      };
      const finalMessages = [...updatedMessages, aiMsg];
      const finalSession = { ...updatedSession, messages: finalMessages };
      updateSession(finalSession);
      setSessions(prev => prev.map(s => s.id === finalSession.id ? finalSession : s));
    } catch (error: any) {
      if (requestIdRef.current !== currentRequestId) return;
      console.error(error);
      const errorMessage = error.message || "An error occurred.";
      const errorMsg: ChatMessage = {
        id: Date.now().toString(),
        role: 'model',
        text: `Error connecting to ${settings.selectedProvider}: ${errorMessage}`,
        timestamp: Date.now()
      };
      const errorMessages = [...updatedMessages, errorMsg];
      const errorSession = { ...updatedSession, messages: errorMessages };
      updateSession(errorSession);
      setSessions(prev => prev.map(s => s.id === errorSession.id ? errorSession : s));
    } finally {
      if (requestIdRef.current === currentRequestId) {
        setIsLoading(false);
        scrollToBottom();
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const getProviderIcon = () => {
     switch(settings.selectedProvider) {
       case 'gemini': return 'Gemini';
       case 'openai': return settings.openaiModel || 'GPT-4o';
       case 'anthropic': return settings.anthropicModel || 'Claude 3.7';
       case 'deepseek': return settings.deepseekModel || 'DeepSeek V3';
       case 'custom': return settings.customModelId || 'Custom';
       default: return 'AI Model';
     }
  };

  return (
    <div className="flex w-full h-full bg-white relative overflow-hidden">
      
      {/* Sidebar Overlay (Mobile Left) */}
      {isSidebarOpen && (
        <div 
          className="absolute inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* LEFT Sidebar - Sessions */}
      <div 
        style={{ 
          width: window.innerWidth > 1024 ? (isSidebarOpen ? sidebarWidth : 0) : '18rem',
          transform: window.innerWidth <= 1024 ? (isSidebarOpen ? 'translateX(0)' : 'translateX(-100%)') : 'none'
        }}
        className={`
          bg-[#34150F] border-r border-[#85431E]/30 flex flex-col shrink-0 z-30 h-full
          ${window.innerWidth <= 1024 ? 'absolute transition-transform duration-300' : 'relative'}
          ${isResizing ? 'transition-none select-none' : 'transition-all duration-300'}
          overflow-hidden
        `}
      >
        <div className="p-4 flex items-center justify-between shrink-0 border-b border-[#85431E]/30 min-w-[200px]">
          <h3 className="font-semibold text-[#EACEAA] text-sm tracking-wide">Conversations</h3>
          <button 
            onClick={createNewSession} 
            className="p-2 bg-[#85431E] hover:bg-[#D39858] text-[#EACEAA] rounded-lg transition-colors flex items-center gap-2 text-xs font-medium"
          >
            <Plus size={14} />
            New
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto px-2 pb-2 space-y-1 mt-2 min-w-[200px]">
          {sessions.map(session => (
            <div 
              key={session.id}
              onClick={() => handleSessionSelect(session.id)}
              className={`group flex items-center gap-3 p-3 rounded-xl cursor-pointer text-sm transition-all border ${
                activeSessionId === session.id 
                  ? 'bg-[#85431E] border-[#D39858] text-[#EACEAA] shadow-sm' 
                  : 'border-transparent text-[#D39858] hover:bg-[#85431E]/20 hover:text-[#EACEAA]'
              }`}
            >
              <MessageSquare size={16} className={activeSessionId === session.id ? 'text-[#EACEAA]' : 'opacity-50'} />
              <span className="truncate flex-1">{session.title}</span>
              {sessions.length > 1 && (
                <button 
                  onClick={(e) => handleDeleteSession(e, session.id)}
                  className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-[#34150F] hover:text-[#D39858] rounded-md transition-all"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* LEFT Resizer Handle */}
      {isSidebarOpen && window.innerWidth > 1024 && (
        <div
          onMouseDown={startResizing}
          className="w-1 bg-[#85431E]/10 hover:bg-[#D39858] cursor-col-resize z-40 h-full flex items-center justify-center transition-colors group absolute"
          style={{ left: sidebarWidth }}
        />
      )}

      {/* CENTER - Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-white relative">
        
        {/* Header */}
        <div className="h-16 border-b border-[#EACEAA] flex items-center px-4 md:px-6 justify-between shrink-0 bg-white/80 backdrop-blur-sm z-10">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className={`p-2 hover:bg-[#EACEAA] rounded-lg transition-colors ${!isSidebarOpen ? 'text-[#85431E]' : 'text-[#D39858]'}`}
              title="Toggle Conversations"
            >
              <Menu size={20} />
            </button>
            <div className="flex items-center gap-2 opacity-90">
               <span className="font-bold text-[#34150F] truncate max-w-[150px] md:max-w-[300px]">
                 {activeSession?.title}
               </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden md:flex items-center gap-2 text-xs text-[#D39858] mr-2">
              {settings.selectedProvider === 'gemini' && <Sparkles size={14} className="text-[#85431E]" />}
              {settings.selectedProvider === 'anthropic' && <Brain size={14} className="text-[#85431E]" />}
              {(settings.selectedProvider === 'openai' || settings.selectedProvider === 'deepseek') && <Zap size={14} className="text-[#85431E]" />}
              {settings.selectedProvider === 'custom' && <Globe size={14} className="text-[#85431E]" />}
              <span className="max-w-[100px] truncate">{getProviderIcon()}</span>
            </div>
            {/* Toggle Right Sidebar */}
            <button 
              onClick={() => setIsRightSidebarOpen(!isRightSidebarOpen)}
              className={`p-2 rounded-lg transition-colors ${isRightSidebarOpen ? 'bg-[#EACEAA] text-[#85431E]' : 'text-[#85431E] hover:bg-[#EACEAA]/50'}`}
              title="Toggle Question Index"
            >
              <PanelRight size={20} />
            </button>
          </div>
        </div>

        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto px-4 md:px-10 py-6 space-y-8 scroll-smooth">
           {messages.length === 0 && (
             <div className="flex flex-col items-center justify-center h-full text-[#85431E] space-y-6 opacity-60">
                <div className="w-20 h-20 bg-[#EACEAA]/50 rounded-3xl flex items-center justify-center border border-[#EACEAA]">
                   {settings.selectedProvider === 'gemini' ? <Sparkles size={40} className="text-[#85431E]" /> :
                    settings.selectedProvider === 'anthropic' ? <Brain size={40} className="text-[#85431E]" /> :
                    settings.selectedProvider === 'custom' ? <Globe size={40} className="text-[#85431E]" /> :
                    <Zap size={40} className="text-[#85431E]" />}
                </div>
                <div className="text-center">
                   <p className="text-lg font-medium">How can I help you today?</p>
                   <p className="text-sm opacity-70 mt-1">Using {getProviderIcon()}</p>
                </div>
             </div>
           )}

           {messages.map((msg, index) => (
            <div 
              key={msg.id}
              id={`msg-${msg.id}`}
              className={`group flex gap-4 md:gap-6 w-full max-w-4xl mx-auto transition-colors duration-500 rounded-xl p-2 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
            >
              {/* Avatar */}
              <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm ${
                msg.role === 'user' ? 'bg-[#EACEAA] text-[#85431E]' : 'bg-[#34150F] text-[#EACEAA]'
              }`}>
                {msg.role === 'user' ? <User size={18} /> : <Sparkles size={20} />}
              </div>
              
              {/* Content */}
              <div className={`flex flex-col min-w-0 max-w-[85%] md:max-w-[80%] ${
                msg.role === 'user' ? 'items-end' : 'items-start'
              }`}>
                {msg.role === 'user' ? (
                  <div className="flex items-center gap-3">
                     <div className="opacity-0 group-hover:opacity-100 flex flex-col gap-1 transition-opacity">
                        <button onClick={() => handleCopy(msg.text, msg.id)} className="p-1.5 text-[#D39858] hover:text-[#85431E] hover:bg-[#EACEAA]/30 rounded-lg">
                          {copiedId === msg.id ? <Check size={14} /> : <Copy size={14} />}
                        </button>
                        <button onClick={() => handleEditMessage(index)} className="p-1.5 text-[#D39858] hover:text-[#85431E] hover:bg-[#EACEAA]/30 rounded-lg">
                          <Edit2 size={14} />
                        </button>
                     </div>
                     <div className="bg-[#85431E] text-[#EACEAA] px-5 py-3.5 rounded-[2rem] rounded-tr-sm shadow-sm border border-[#522115]">
                      {msg.attachments?.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-3 justify-end">
                          {msg.attachments.map((att, idx) => (
                            <img key={idx} src={`data:${att.mimeType};base64,${att.data}`} className="h-32 object-cover rounded-xl border border-[#EACEAA]/30" />
                          ))}
                        </div>
                      )}
                      <div className="whitespace-pre-wrap text-[15px] leading-relaxed">{msg.text}</div>
                    </div>
                  </div>
                ) : (
                  <div className="w-full">
                    <div className="px-1 py-1 w-full markdown-body">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.text}</ReactMarkdown>
                    </div>
                    <div className="flex items-center gap-2 mt-2 ml-1">
                      <button onClick={() => handleSpeak(msg.text, msg.id)} disabled={isSpeakingLoading === msg.id} className={`p-2 rounded-lg text-sm font-medium flex items-center gap-1.5 ${speakingId === msg.id ? 'text-[#85431E] bg-[#EACEAA]' : 'text-[#D39858] hover:bg-[#EACEAA]/30'}`}>
                         {isSpeakingLoading === msg.id ? <Loader2 size={16} className="animate-spin" /> : speakingId === msg.id ? <StopCircle size={16} /> : <Volume2 size={16} />}
                      </button>
                      <button onClick={() => handleCopy(msg.text, msg.id)} className="p-2 text-[#D39858] hover:bg-[#EACEAA]/30 rounded-lg">
                         {copiedId === msg.id ? <Check size={16} /> : <Copy size={16} />}
                      </button>
                      <button onClick={handleRegenerate} className="p-2 text-[#D39858] hover:bg-[#EACEAA]/30 rounded-lg">
                        <RotateCcw size={16} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-4 md:gap-6 w-full max-w-4xl mx-auto">
               <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-[#34150F] flex items-center justify-center flex-shrink-0 animate-pulse">
                 {settings.selectedProvider === 'anthropic' ? <Brain size={20} className="text-[#EACEAA]" /> : <Sparkles size={20} className="text-[#EACEAA]" />}
               </div>
               <div className="flex items-center gap-2 mt-2">
                  <Loader2 size={18} className="animate-spin text-[#85431E]" />
                  <span className="text-[#85431E] text-sm font-medium">Thinking...</span>
               </div>
            </div>
          )}
          <div ref={messagesEndRef} className="h-4" />
        </div>

        {/* Input Area - Reduced padding */}
        <div className="p-3 md:p-4 bg-white shrink-0">
          <div className="max-w-4xl mx-auto bg-[#EACEAA]/20 rounded-[2rem] border border-[#85431E]/20 shadow-sm focus-within:border-[#85431E] focus-within:ring-1 focus-within:ring-[#85431E] transition-all p-2 flex flex-col gap-2 relative">
            {attachments.length > 0 && (
              <div className="flex gap-3 px-4 pt-3 pb-1 overflow-x-auto">
                {attachments.map((att, idx) => (
                  <div key={idx} className="relative group flex-shrink-0">
                    <div className="w-16 h-16 rounded-xl border border-[#D39858] overflow-hidden bg-white">
                       <img src={`data:${att.mimeType};base64,${att.data}`} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <button onClick={() => removeAttachment(idx)} className="absolute -top-1.5 -right-1.5 bg-[#85431E] text-[#EACEAA] rounded-full p-1 border border-[#EACEAA] shadow-md"><X size={10} /></button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex items-end gap-2 pl-2 pr-2 pb-1">
              <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept="image/*" className="hidden" />
              <button onClick={() => fileInputRef.current?.click()} className="p-3 text-[#D39858] hover:text-[#85431E] hover:bg-[#EACEAA]/50 rounded-full"><Plus size={22} strokeWidth={2.5} /></button>
              <textarea value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKeyDown} onPaste={handlePaste} placeholder={`Message ${getProviderIcon()}...`} className="w-full bg-transparent text-[#34150F] placeholder-[#D39858]/80 focus:outline-none resize-none py-3.5 max-h-[200px] min-h-[52px]" rows={1} style={{ height: 'auto', minHeight: '52px' }} />
              <button onClick={handleSend} disabled={(!input.trim() && attachments.length === 0) || isLoading} className={`p-3 rounded-full transition-all duration-200 ${(!input.trim() && attachments.length === 0) || isLoading ? 'bg-[#EACEAA] text-[#D39858] cursor-not-allowed' : 'bg-[#85431E] hover:bg-[#6e3618] text-[#EACEAA] shadow-md'}`}>
                 {isLoading ? <Loader2 size={20} className="animate-spin" /> : <ArrowUp size={22} strokeWidth={2.5} />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT Resizer Handle */}
      {isRightSidebarOpen && window.innerWidth > 1024 && (
        <div
          onMouseDown={startResizingRight}
          className="w-1 bg-[#85431E]/10 hover:bg-[#D39858] cursor-col-resize z-40 h-full flex items-center justify-center transition-colors group absolute"
          style={{ right: rightSidebarWidth }}
        />
      )}

      {/* RIGHT Sidebar - Question Index */}
      <div 
         style={{ 
          width: window.innerWidth > 1024 ? (isRightSidebarOpen ? rightSidebarWidth : 0) : 'auto',
          transform: window.innerWidth <= 1024 ? (isRightSidebarOpen ? 'translateX(0)' : 'translateX(100%)') : 'none'
        }}
        className={`
        border-l border-[#D39858]/20 bg-[#FBF7F3] flex flex-col shrink-0 z-20 h-full
        ${window.innerWidth <= 1024 ? 'absolute right-0 top-0 bottom-0 w-72 transition-transform duration-300 shadow-xl' : 'relative'}
        ${isResizingRight ? 'transition-none select-none' : 'transition-all duration-300'}
        overflow-hidden
      `}>
         <div className="p-4 flex items-center justify-between shrink-0 border-b border-[#D39858]/20 bg-[#FBF7F3] min-w-[200px]">
            <h3 className="font-semibold text-[#85431E] text-sm tracking-wide flex items-center gap-2">
              <Hash size={14} />
              In this chat
            </h3>
            <button onClick={() => setIsRightSidebarOpen(false)} className="xl:hidden p-1 text-[#D39858] hover:text-[#85431E]">
              <ChevronRight size={18} />
            </button>
         </div>

         <div className="flex-1 overflow-y-auto p-2 space-y-1 min-w-[200px]">
            {userQuestions.length === 0 && (
              <div className="text-center text-[#D39858] text-xs p-4 italic opacity-70">
                No questions asked yet.
              </div>
            )}
            {userQuestions.map((q, idx) => (
              <button
                key={q.id}
                onClick={() => scrollToMessage(q.id)}
                className="w-full text-left p-3 rounded-lg hover:bg-[#EACEAA]/30 group transition-all"
              >
                <div className="flex gap-2">
                  <span className="text-[#D39858] text-[10px] font-mono mt-0.5 shrink-0">
                    {(idx + 1).toString().padStart(2, '0')}
                  </span>
                  <p className="text-[#34150F] text-xs font-medium line-clamp-3 group-hover:text-[#85431E] leading-relaxed">
                    {q.text}
                  </p>
                </div>
              </button>
            ))}
         </div>
      </div>

    </div>
  );
};

export default ChatInterface;

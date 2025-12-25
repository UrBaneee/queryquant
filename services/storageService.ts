import { DailyStat, ChatSession } from '../types';
import { format, startOfDay } from 'date-fns';

const STATS_KEY = 'queryquant_stats';
const SESSIONS_KEY = 'queryquant_sessions';

// Helper to get today's date key
const getTodayKey = (): string => format(startOfDay(new Date()), 'yyyy-MM-dd');

export const getStats = (): Record<string, DailyStat> => {
  try {
    const stored = localStorage.getItem(STATS_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch (e) {
    console.error("Failed to load stats", e);
    return {};
  }
};

export const saveStats = (stats: Record<string, DailyStat>) => {
  localStorage.setItem(STATS_KEY, JSON.stringify(stats));
};

export const incrementCount = (type: 'internal' | 'external', dateKey: string = getTodayKey()) => {
  const stats = getStats();
  
  if (!stats[dateKey]) {
    stats[dateKey] = {
      date: dateKey,
      internalCount: 0,
      externalCount: 0
    };
  }

  if (type === 'internal') {
    stats[dateKey].internalCount += 1;
  } else {
    stats[dateKey].externalCount += 1;
  }

  saveStats(stats);
  return stats; // Return updated stats for state update
};

export const getTodayStats = (): DailyStat => {
  const stats = getStats();
  const key = getTodayKey();
  return stats[key] || { date: key, internalCount: 0, externalCount: 0 };
};

// --- Session Management ---

export const getSessions = (): ChatSession[] => {
  try {
    const stored = localStorage.getItem(SESSIONS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    console.error("Failed to load sessions", e);
    return [];
  }
};

export const saveSessions = (sessions: ChatSession[]) => {
  try {
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
  } catch (e) {
    console.error("Failed to save sessions (likely quota exceeded)", e);
    // In a real app, handle quota exceeded (maybe trim old images)
  }
};

export const createSession = (): ChatSession => {
  const newSession: ChatSession = {
    id: Date.now().toString(),
    title: 'New Chat',
    messages: [],
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
  const sessions = getSessions();
  // Add to beginning
  sessions.unshift(newSession);
  saveSessions(sessions);
  return newSession;
};

export const updateSession = (updatedSession: ChatSession) => {
  const sessions = getSessions();
  const index = sessions.findIndex(s => s.id === updatedSession.id);
  if (index !== -1) {
    sessions[index] = updatedSession;
    saveSessions(sessions);
  }
};

export const deleteSession = (sessionId: string) => {
  const sessions = getSessions();
  const filtered = sessions.filter(s => s.id !== sessionId);
  saveSessions(filtered);
  return filtered;
};

// --- Data Export / Import (Manual Sync) ---

export const exportAllData = (): string => {
  const data = {
    stats: getStats(),
    sessions: getSessions(),
    timestamp: Date.now(),
    version: 1
  };
  return JSON.stringify(data, null, 2);
};

export const importAllData = (jsonString: string): boolean => {
  try {
    const data = JSON.parse(jsonString);
    if (data.stats && data.sessions) {
      saveStats(data.stats);
      saveSessions(data.sessions);
      return true;
    }
    return false;
  } catch (e) {
    console.error("Import failed", e);
    return false;
  }
};
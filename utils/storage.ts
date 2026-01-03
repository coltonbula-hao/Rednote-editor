
import { HistoryItem, UserPreferences, Tab, XhsStyle } from '../types';

const STORAGE_KEYS = {
  HISTORY: 'agent_history_v1',
  PREFS: 'agent_prefs_v1'
};

export const saveHistoryItem = (item: HistoryItem) => {
  try {
    const existing = getHistory();
    // Keep only the last 20 items to avoid quota issues
    const updated = [item, ...existing].slice(0, 20);
    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to save history:', e);
  }
};

export const getHistory = (): HistoryItem[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.HISTORY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
};

export const deleteHistoryItem = (id: string) => {
  const updated = getHistory().filter(item => item.id !== id);
  localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(updated));
};

export const clearHistory = () => {
  localStorage.removeItem(STORAGE_KEYS.HISTORY);
};

export const savePreferences = (prefs: UserPreferences) => {
  localStorage.setItem(STORAGE_KEYS.PREFS, JSON.stringify(prefs));
};

export const getPreferences = (): UserPreferences => {
  const defaultPrefs: UserPreferences = {
    defaultTab: Tab.BLOG,
    autoExtractYoutube: true,
    saveHistory: true,
    selectedXhsStyle: XhsStyle.LISTICLE
  };
  try {
    const data = localStorage.getItem(STORAGE_KEYS.PREFS);
    return data ? { ...defaultPrefs, ...JSON.parse(data) } : defaultPrefs;
  } catch (e) {
    return defaultPrefs;
  }
};

import { HistoryItem } from '../types';

/**
 * History Service for FlowShare
 * Handles local storage persistence, filtering, sorting, and history deletion.
 */
class HistoryService {
  private STORAGE_KEY = 'flowshare_transfer_history';

  getHistory(): HistoryItem[] {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      if (!data) return [];
      return JSON.parse(data);
    } catch (err) {
      console.error('Failed to parse history from localStorage:', err);
      return [];
    }
  }

  saveHistoryItem(item: HistoryItem): HistoryItem[] {
    const history = this.getHistory();
    const updated = [item, ...history.filter(h => h.id !== item.id)];
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updated));
    } catch (err) {
      console.error('Failed to save history item to localStorage:', err);
    }
    return updated;
  }

  deleteHistoryItem(id: string): HistoryItem[] {
    const history = this.getHistory();
    const updated = history.filter(h => h.id !== id);
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updated));
    } catch (err) {
      console.error('Failed to update history after delete:', err);
    }
    return updated;
  }

  clearHistory(): HistoryItem[] {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
    } catch (err) {}
    return [];
  }
}

export default new HistoryService();

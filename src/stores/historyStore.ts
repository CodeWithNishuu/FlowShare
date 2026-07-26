import { create } from 'zustand';
import historyService from '../services/historyService';
import { HistoryItem } from '../types';

interface HistoryState {
  history: HistoryItem[];
  searchQuery: string;
  statusFilter: 'all' | 'Completed' | 'Failed' | 'Cancelled' | 'Pending';
  directionFilter: 'all' | 'sent' | 'received';
  sortBy: 'date_desc' | 'date_asc' | 'size_desc' | 'name';
  setSearchQuery: (query: string) => void;
  setStatusFilter: (status: 'all' | 'Completed' | 'Failed' | 'Cancelled' | 'Pending') => void;
  setDirectionFilter: (direction: 'all' | 'sent' | 'received') => void;
  setSortBy: (sort: 'date_desc' | 'date_asc' | 'size_desc' | 'name') => void;
  addHistoryItem: (item: HistoryItem) => void;
  deleteHistoryItem: (id: string) => void;
  clearAllHistory: () => void;
  refreshHistory: () => void;
}

export const useHistoryStore = create<HistoryState>((set, get) => ({
  history: historyService.getHistory(),
  searchQuery: '',
  statusFilter: 'all',
  directionFilter: 'all',
  sortBy: 'date_desc',

  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setStatusFilter: (statusFilter) => set({ statusFilter }),
  setDirectionFilter: (directionFilter) => set({ directionFilter }),
  setSortBy: (sortBy) => set({ sortBy }),

  addHistoryItem: (item) => {
    const updated = historyService.saveHistoryItem(item);
    set({ history: updated });
  },

  deleteHistoryItem: (id) => {
    const updated = historyService.deleteHistoryItem(id);
    set({ history: updated });
  },

  clearAllHistory: () => {
    const updated = historyService.clearHistory();
    set({ history: updated });
  },

  refreshHistory: () => {
    set({ history: historyService.getHistory() });
  },
}));

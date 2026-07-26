import { useMemo } from 'react';
import { useHistoryStore } from '../stores/historyStore';

export function useTransferHistory() {
  const {
    history,
    searchQuery,
    statusFilter,
    directionFilter,
    sortBy,
    setSearchQuery,
    setStatusFilter,
    setDirectionFilter,
    setSortBy,
    deleteHistoryItem,
    clearAllHistory,
  } = useHistoryStore();

  const filteredHistory = useMemo(() => {
    return history
      .filter((item) => {
        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchesName = item.fileName.toLowerCase().includes(q);
          const matchesSender = item.senderName.toLowerCase().includes(q);
          const matchesReceiver = item.receiverName.toLowerCase().includes(q);
          if (!matchesName && !matchesSender && !matchesReceiver) return false;
        }

        // Status filter
        if (statusFilter !== 'all' && item.status !== statusFilter) {
          return false;
        }

        // Direction filter
        if (directionFilter !== 'all' && item.direction !== directionFilter) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'date_desc') return b.timestamp - a.timestamp;
        if (sortBy === 'date_asc') return a.timestamp - b.timestamp;
        if (sortBy === 'size_desc') return b.fileSize - a.fileSize;
        if (sortBy === 'name') return a.fileName.localeCompare(b.fileName);
        return 0;
      });
  }, [history, searchQuery, statusFilter, directionFilter, sortBy]);

  return {
    history: filteredHistory,
    totalCount: history.length,
    searchQuery,
    statusFilter,
    directionFilter,
    sortBy,
    setSearchQuery,
    setStatusFilter,
    setDirectionFilter,
    setSortBy,
    deleteHistoryItem,
    clearAllHistory,
  };
}

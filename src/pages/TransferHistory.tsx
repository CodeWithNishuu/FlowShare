import React from 'react';
import {
  Search,
  Trash2,
  RotateCcw,
  Download,
  Upload,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  ArrowUpDown,
  Filter,
} from 'lucide-react';
import { useTransferHistory } from '../hooks/useTransferHistory';
import { HistoryItem } from '../types';

export const TransferHistory: React.FC = () => {
  const {
    history,
    totalCount,
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
  } = useTransferHistory();

  const formatSize = (bytes: number) => {
    if (bytes >= 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
    if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    if (bytes >= 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${bytes} B`;
  };

  const formatSpeed = (bytesPerSec: number) => {
    if (bytesPerSec >= 1024 * 1024) return `${(bytesPerSec / (1024 * 1024)).toFixed(1)} MB/s`;
    if (bytesPerSec >= 1024) return `${(bytesPerSec / 1024).toFixed(0)} KB/s`;
    return `${bytesPerSec} B/s`;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Completed':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <CheckCircle className="w-3.5 h-3.5" />
            <span>Completed</span>
          </span>
        );
      case 'Failed':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/30">
            <XCircle className="w-3.5 h-3.5" />
            <span>Failed</span>
          </span>
        );
      case 'Cancelled':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Cancelled</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
            <Clock className="w-3.5 h-3.5" />
            <span>Pending</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-8">
      {/* Top Banner & Delete History */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gray-900/80 backdrop-blur-md p-6 rounded-3xl border border-gray-800">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Transfer History</h1>
          <p className="text-sm text-gray-400">
            Audit logs of sent, received, cancelled, and failed file transfers ({totalCount} items)
          </p>
        </div>

        <button
          onClick={clearAllHistory}
          className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/40 text-xs font-bold transition-all"
        >
          <Trash2 className="w-4 h-4" />
          <span>Clear History</span>
        </button>
      </div>

      {/* Controls Bar: Search, Filters, Sort */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-gray-900/60 p-4 rounded-2xl border border-gray-800">
        {/* Search Bar */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by file name or device..."
            className="w-full bg-gray-800 text-white pl-10 pr-4 py-2 rounded-xl text-sm border border-gray-700 focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Status Filter */}
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="bg-gray-800 text-gray-200 px-3 py-2 rounded-xl text-sm border border-gray-700 focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="Completed">Completed</option>
            <option value="Failed">Failed</option>
            <option value="Cancelled">Cancelled</option>
            <option value="Pending">Pending</option>
          </select>
        </div>

        {/* Direction Filter */}
        <select
          value={directionFilter}
          onChange={(e) => setDirectionFilter(e.target.value as any)}
          className="bg-gray-800 text-gray-200 px-3 py-2 rounded-xl text-sm border border-gray-700 focus:outline-none"
        >
          <option value="all">All Directions</option>
          <option value="sent">Sent Files</option>
          <option value="received">Received Files</option>
        </select>

        {/* Sort By */}
        <div className="flex items-center space-x-2">
          <ArrowUpDown className="w-4 h-4 text-gray-400" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-gray-800 text-gray-200 px-3 py-2 rounded-xl text-sm border border-gray-700 focus:outline-none"
          >
            <option value="date_desc">Newest First</option>
            <option value="date_asc">Oldest First</option>
            <option value="size_desc">Largest Size</option>
            <option value="name">File Name</option>
          </select>
        </div>
      </div>

      {/* History Table */}
      <div className="bg-gray-900/80 backdrop-blur-md rounded-3xl border border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-300">
            <thead className="bg-gray-800/60 text-xs font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-800">
              <tr>
                <th className="p-4">File Details</th>
                <th className="p-4">Direction</th>
                <th className="p-4">Sender / Receiver</th>
                <th className="p-4">Speed & Time</th>
                <th className="p-4">Date</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-800/60">
              {history.map((item) => (
                <tr key={item.id} className="hover:bg-gray-800/40 transition-colors">
                  <td className="p-4 font-semibold text-white max-w-xs truncate">
                    <p className="truncate">{item.fileName}</p>
                    <p className="text-xs text-gray-400 font-mono font-normal">{formatSize(item.fileSize)}</p>
                  </td>

                  <td className="p-4">
                    {item.direction === 'sent' ? (
                      <span className="inline-flex items-center space-x-1 text-xs text-indigo-400 font-semibold bg-indigo-500/10 px-2 py-0.5 rounded-full">
                        <Upload className="w-3.5 h-3.5" />
                        <span>Sent</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center space-x-1 text-xs text-cyan-400 font-semibold bg-cyan-500/10 px-2 py-0.5 rounded-full">
                        <Download className="w-3.5 h-3.5" />
                        <span>Received</span>
                      </span>
                    )}
                  </td>

                  <td className="p-4 text-xs text-gray-300">
                    <p>From: {item.senderName}</p>
                    <p className="text-gray-400">To: {item.receiverName}</p>
                  </td>

                  <td className="p-4 text-xs font-mono">
                    <p className="text-gray-200">{formatSpeed(item.transferSpeed)}</p>
                    <p className="text-gray-400">{item.transferTimeSec} sec</p>
                  </td>

                  <td className="p-4 text-xs text-gray-400 font-mono">
                    {new Date(item.timestamp).toLocaleDateString()} {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </td>

                  <td className="p-4">{getStatusBadge(item.status)}</td>

                  <td className="p-4 text-right space-x-2">
                    <button
                      onClick={() => deleteHistoryItem(item.id)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                      title="Delete record"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

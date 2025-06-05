
import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useLogContext } from "../contexts/LogContext";
import { LogEntry } from "../services/logParser";

interface LogTableProps {
  filters: {
    dateRange: { start: string; end: string };
    logLevel: string;
    keyword: string;
  };
}

const LogTable = ({ filters }: LogTableProps) => {
  const { logEntries } = useLogContext();
  const [sortField, setSortField] = useState<keyof LogEntry>('timestamp');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const entriesPerPage = 100;

  // Filter entries based on filters
  const filteredEntries = logEntries.filter(entry => {
    // Date range filter
    if (filters.dateRange.start && filters.dateRange.end) {
      const entryDate = new Date(entry.timestamp);
      const startDate = new Date(filters.dateRange.start);
      const endDate = new Date(filters.dateRange.end);
      if (entryDate < startDate || entryDate > endDate) return false;
    }

    // Log level filter
    if (filters.logLevel && entry.level !== filters.logLevel) return false;

    // Keyword filter
    if (filters.keyword) {
      const keyword = filters.keyword.toLowerCase();
      if (!entry.message.toLowerCase().includes(keyword)) return false;
    }

    return true;
  });

  // Sort entries
  const sortedEntries = [...filteredEntries].sort((a, b) => {
    const aValue = a[sortField] || '';
    const bValue = b[sortField] || '';
    
    if (sortDirection === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  // Paginate entries
  const startIndex = (currentPage - 1) * entriesPerPage;
  const paginatedEntries = sortedEntries.slice(startIndex, startIndex + entriesPerPage);
  const totalPages = Math.ceil(sortedEntries.length / entriesPerPage);

  const handleSort = (field: keyof LogEntry) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getLogLevelColor = (level: string) => {
    switch (level) {
      case 'ERROR': return 'text-red-400 bg-red-400/10';
      case 'WARN': return 'text-yellow-400 bg-yellow-400/10';
      case 'INFO': return 'text-blue-400 bg-blue-400/10';
      case 'DEBUG': return 'text-gray-400 bg-gray-400/10';
      case 'TRACE': return 'text-purple-400 bg-purple-400/10';
      default: return 'text-gray-400 bg-gray-400/10';
    }
  };

  const SortIcon = ({ field }: { field: keyof LogEntry }) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? 
      <ChevronUp className="w-4 h-4" /> : 
      <ChevronDown className="w-4 h-4" />;
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  if (logEntries.length === 0) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <p className="text-slate-400">Upload a log file to see entries</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">Log Entries</h3>
        <div className="text-sm text-slate-400">
          Showing {paginatedEntries.length} of {sortedEntries.length} entries 
          {filteredEntries.length !== logEntries.length && ` (${logEntries.length} total)`}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-700">
              <th 
                className="text-left py-3 px-4 cursor-pointer hover:text-blue-400 transition-colors"
                onClick={() => handleSort('timestamp')}
              >
                <div className="flex items-center gap-2">
                  Timestamp
                  <SortIcon field="timestamp" />
                </div>
              </th>
              <th 
                className="text-left py-3 px-4 cursor-pointer hover:text-blue-400 transition-colors"
                onClick={() => handleSort('level')}
              >
                <div className="flex items-center gap-2">
                  Level
                  <SortIcon field="level" />
                </div>
              </th>
              <th className="text-left py-3 px-4">Message</th>
              <th className="text-left py-3 px-4">Source</th>
            </tr>
          </thead>
          <tbody>
            {paginatedEntries.map((log) => (
              <tr key={log.id} className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors">
                <td className="py-3 px-4 font-mono text-sm text-slate-300">
                  {formatTimestamp(log.timestamp)}
                </td>
                <td className="py-3 px-4">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getLogLevelColor(log.level)}`}>
                    {log.level}
                  </span>
                </td>
                <td className="py-3 px-4 text-sm">
                  {log.message}
                </td>
                <td className="py-3 px-4 text-sm text-slate-400 font-mono">
                  {log.source}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-6">
        <div className="text-sm text-slate-400">
          Page {currentPage} of {totalPages}
        </div>
        <div className="flex gap-2">
          <button 
            className="px-3 py-1 bg-slate-700 hover:bg-slate-600 rounded text-sm transition-colors disabled:opacity-50"
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
          >
            Previous
          </button>
          <button 
            className="px-3 py-1 bg-slate-700 hover:bg-slate-600 rounded text-sm transition-colors disabled:opacity-50"
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default LogTable;

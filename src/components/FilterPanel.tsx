
import { Search, Calendar, Filter } from "lucide-react";

interface FilterPanelProps {
  filters: {
    dateRange: { start: string; end: string };
    logLevel: string;
    keyword: string;
  };
  onFiltersChange: (filters: any) => void;
}

const FilterPanel = ({ filters, onFiltersChange }: FilterPanelProps) => {
  const handleFilterChange = (key: string, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value
    });
  };

  return (
    <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
      <div className="flex items-center gap-2 mb-4">
        <Filter className="w-5 h-5 text-blue-400" />
        <h3 className="text-lg font-semibold">Filters</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Date Range */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            <Calendar className="w-4 h-4 inline mr-1" />
            Date Range
          </label>
          <div className="space-y-2">
            <input
              type="date"
              value={filters.dateRange.start}
              onChange={(e) => handleFilterChange('dateRange', { ...filters.dateRange, start: e.target.value })}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
            />
            <input
              type="date"
              value={filters.dateRange.end}
              onChange={(e) => handleFilterChange('dateRange', { ...filters.dateRange, end: e.target.value })}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* Log Level */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Log Level
          </label>
          <select
            value={filters.logLevel}
            onChange={(e) => handleFilterChange('logLevel', e.target.value)}
            className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
          >
            <option value="">All Levels</option>
            <option value="ERROR">ERROR</option>
            <option value="WARN">WARN</option>
            <option value="INFO">INFO</option>
            <option value="DEBUG">DEBUG</option>
          </select>
        </div>

        {/* Keyword Search */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            <Search className="w-4 h-4 inline mr-1" />
            Keyword Search
          </label>
          <input
            type="text"
            placeholder="Search in messages..."
            value={filters.keyword}
            onChange={(e) => handleFilterChange('keyword', e.target.value)}
            className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Quick Actions */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Quick Filters
          </label>
          <div className="space-y-2">
            <button
              onClick={() => handleFilterChange('logLevel', 'ERROR')}
              className="w-full bg-red-600/20 hover:bg-red-600/30 text-red-400 py-2 px-3 rounded-lg text-sm transition-colors"
            >
              Show Errors Only
            </button>
            <button
              onClick={() => onFiltersChange({ dateRange: { start: "", end: "" }, logLevel: "", keyword: "" })}
              className="w-full bg-slate-600 hover:bg-slate-500 text-white py-2 px-3 rounded-lg text-sm transition-colors"
            >
              Clear All Filters
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FilterPanel;


import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import ChartsDashboard from "../components/ChartsDashboard";
import LogTable from "../components/LogTable";
import InsightsPanel from "../components/InsightsPanel";
import FilterPanel from "../components/FilterPanel";
import ReportDownloadButton from "../components/ReportDownloadButton";
import { useState } from "react";
import { useLogContext } from "../contexts/LogContext";

const AnalyzePage = () => {
  const { uploadedFileName, logAnalysis } = useLogContext();
  const [filters, setFilters] = useState({
    dateRange: { start: "", end: "" },
    logLevel: "",
    keyword: ""
  });

  const fileSize = logAnalysis ? 
    `${(logAnalysis.totalEntries * 100 / 1024).toFixed(1)} KB` : 
    '0 KB';

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/" className="text-slate-400 hover:text-white transition-colors">
              <ArrowLeft className="w-6 h-6" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-blue-400">Log Analysis</h1>
              <p className="text-slate-300 text-sm">
                {uploadedFileName || 'No file'} ({fileSize}, {logAnalysis?.totalEntries.toLocaleString() || 0} entries)
              </p>
            </div>
          </div>
          <ReportDownloadButton />
        </div>
      </header>

      <main className="container mx-auto px-6 py-6">
        {/* Filter Panel */}
        <div className="mb-6">
          <FilterPanel filters={filters} onFiltersChange={setFilters} />
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 mb-6">
          {/* Charts Dashboard - Takes 3 columns */}
          <div className="xl:col-span-3">
            <ChartsDashboard />
          </div>
          
          {/* Insights Panel - Takes 1 column */}
          <div className="xl:col-span-1">
            <InsightsPanel />
          </div>
        </div>

        {/* Log Table */}
        <div className="bg-slate-800 rounded-xl border border-slate-700">
          <LogTable filters={filters} />
        </div>
      </main>
    </div>
  );
};

export default AnalyzePage;

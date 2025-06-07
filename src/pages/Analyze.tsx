
import { Link, useSearchParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import ChartsDashboard from "../components/ChartsDashboard";
import LogTable from "../components/LogTable";
import InsightsPanel from "../components/InsightsPanel";
import FilterPanel from "../components/FilterPanel";
import ReportDownloadButton from "../components/ReportDownloadButton";
import { useState, useEffect } from "react";
import { useLogContext } from "../contexts/LogContext";
import { apiService } from "../services/api";

const AnalyzePage = () => {
  const { uploadedFileName, logAnalysis, currentUploadId } = useLogContext();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    dateRange: { start: "", end: "" },
    logLevel: "",
    keyword: ""
  });

  // Load data when component mounts or uploadId changes
  useEffect(() => {
    const uploadId = searchParams.get('uploadId');
    if (uploadId && currentUploadId === null) {
      // If we have an uploadId in URL but not in context, try to load it
      const loadUploadData = async () => {
        try {
          setLoading(true);
          // Fetch upload details to get the filename
          const uploads = await apiService.getUploadHistory();
          const currentUpload = uploads.find(upload => upload.id === parseInt(uploadId));
          if (currentUpload) {
            // The LogContext will handle refreshing the analysis and logs
            // as it's already listening to URL changes
          }
        } catch (error) {
          console.error('Failed to load upload data:', error);
        } finally {
          setLoading(false);
        }
      };
      loadUploadData();
    } else {
      setLoading(false);
    }
  }, [searchParams, currentUploadId]);

  const fileSize = logAnalysis ? 
    `${(logAnalysis.totalEntries * 100 / 1024).toFixed(1)} KB` : 
    '0 KB';
  console.log("Log Analysis Data:");
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
          <p>Loading log data...</p>
        </div>
      </div>
    );
  }

  if (!currentUploadId) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-400 mb-4">No log file selected</h2>
          <p className="mb-4">Please go back and upload a log file to analyze.</p>
          <Link 
            to="/" 
            className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

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

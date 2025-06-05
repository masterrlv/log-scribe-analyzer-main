
import { useState } from "react";
import { Download, FileText, FileSpreadsheet } from "lucide-react";

const ReportDownloadButton = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleDownload = (format: 'pdf' | 'csv') => {
    // Mock download functionality
    console.log(`Downloading report in ${format} format`);
    setIsMenuOpen(false);
    
    // In a real app, this would trigger the actual download
    const filename = `log-analysis-report-${new Date().toISOString().split('T')[0]}.${format}`;
    alert(`Would download: ${filename}`);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
      >
        <Download className="w-4 h-4" />
        Download Report
      </button>

      {isMenuOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50">
          <div className="py-2">
            <button
              onClick={() => handleDownload('pdf')}
              className="w-full text-left px-4 py-2 hover:bg-slate-700 transition-colors flex items-center gap-3"
            >
              <FileText className="w-4 h-4 text-red-400" />
              <div>
                <div className="font-medium">PDF Report</div>
                <div className="text-xs text-slate-400">Complete analysis with charts</div>
              </div>
            </button>
            <button
              onClick={() => handleDownload('csv')}
              className="w-full text-left px-4 py-2 hover:bg-slate-700 transition-colors flex items-center gap-3"
            >
              <FileSpreadsheet className="w-4 h-4 text-green-400" />
              <div>
                <div className="font-medium">CSV Export</div>
                <div className="text-xs text-slate-400">Raw log data for analysis</div>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Backdrop to close menu */}
      {isMenuOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsMenuOpen(false)}
        />
      )}
    </div>
  );
};

export default ReportDownloadButton;

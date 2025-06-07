import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
// Temporarily commenting out framer-motion due to missing type declarations
// import { motion } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, FileText } from "lucide-react";
import { apiService as api, Upload } from "@/services/api";

const History: React.FC = () => {
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [selectedUpload, setSelectedUpload] = useState<Upload | null>(null);
  const [uploadHistory, setUploadHistory] = useState<Upload[]>([]);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const history = await api.getUploadHistory();
        setUploadHistory(history);
      } catch (error) {
        console.error('Failed to fetch upload history:', error);
      }
    };
    fetchHistory();
  }, []);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleUploadSelect = (upload: Upload) => {
    setSelectedUpload(upload);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white">
      {/* Sidebar */}
      {/* <motion.div
        animate={{ width: isSidebarOpen ? 300 : 0 }}
        className="bg-gray-800 border-r border-gray-700 overflow-y-auto"
      > */}
      <div
        className="bg-gray-800 border-r border-gray-700 overflow-y-auto"
        style={{ width: isSidebarOpen ? 300 : 0 }}
      >
        <div className="p-4">
          <h2 className="text-xl font-semibold mb-4 text-blue-400">Upload History</h2>
          <div className="space-y-2">
            {uploadHistory.length === 0 ? (
              <p className="text-gray-400">No uploads found.</p>
            ) : (
              uploadHistory.map((upload: Upload) => (
                <div
                  key={upload.id}
                  className={`p-3 rounded-lg cursor-pointer flex items-start gap-2 border ${selectedUpload?.id === upload.id ? 'border-blue-500 bg-blue-900/30' : 'border-gray-700 bg-gray-700/30'}`}
                  onClick={() => handleUploadSelect(upload)}
                >
                  <FileText className="w-5 h-5 text-blue-400 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{upload.filename}</p>
                    <p className="text-sm text-gray-400">{formatDate(upload.timestamp)}</p>
                  </div>
                </div>
              ))
            )
          }
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <div className="p-4 flex justify-between items-center border-b border-gray-700">
          <Button
            onClick={toggleSidebar}
            className="bg-gray-800 hover:bg-gray-700 text-white"
            size="sm"
          >
            {isSidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            History
          </Button>
          <Button
            onClick={() => navigate('/')}
            className="bg-blue-600 hover:bg-blue-700 text-white"
            size="sm"
          >
            Back to Home
          </Button>
        </div>

        <div className="flex-1 p-6 overflow-auto">
          {selectedUpload ? (
            <div className="animate-fadeIn">
              <h2 className="text-2xl font-bold mb-2 text-blue-400">Analysis for {selectedUpload.filename}</h2>
              <p className="text-gray-400 mb-6">Uploaded on {formatDate(selectedUpload.timestamp)}</p>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700 shadow-lg">
                  <h3 className="text-xl font-semibold mb-4 text-blue-400">Log Level Distribution</h3>
                  <div className="h-80">
                    {/* Placeholder for PieChart */}
                    <div className="flex items-center justify-center h-full text-gray-400">Pie Chart Placeholder</div>
                    {/* <PieChart uploadId={selectedUpload.id} /> */}
                  </div>
                </div>
                <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700 shadow-lg">
                  <h3 className="text-xl font-semibold mb-4 text-blue-400">Log Trends Over Time</h3>
                  <div className="h-80">
                    {/* Placeholder for LineChart */}
                    <div className="flex items-center justify-center h-full text-gray-400">Line Chart Placeholder</div>
                    {/* <LineChart uploadId={selectedUpload.id} /> */}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex h-full items-center justify-center">
              <p className="text-gray-400 text-lg">Select an upload from the history to view analysis.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default History;

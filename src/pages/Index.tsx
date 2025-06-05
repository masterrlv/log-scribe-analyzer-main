
import { Link } from "react-router-dom";
import { Upload, BarChart3, FileText, LogOut } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

const Index = () => {
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-blue-400">Log Analyzer</h1>
            <p className="text-slate-300 mt-1">Intelligent server log analysis and insights</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-6 py-16">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            Analyze Your Logs with AI-Powered Insights
          </h2>
          <p className="text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
            Upload your server log files and get instant analysis with error detection, 
            performance insights, and intelligent recommendations to improve your system.
          </p>
        </div>

        {/* Feature Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="bg-slate-800 rounded-xl p-8 border border-slate-700 hover:border-blue-500 transition-colors">
            <Upload className="w-12 h-12 text-blue-400 mb-4" />
            <h3 className="text-xl font-semibold mb-3">Upload & Parse</h3>
            <p className="text-slate-300">
              Support for various log formats up to 50MB. Automatic parsing of timestamps, 
              log levels, and error messages.
            </p>
          </div>

          <div className="bg-slate-800 rounded-xl p-8 border border-slate-700 hover:border-blue-500 transition-colors">
            <BarChart3 className="w-12 h-12 text-blue-400 mb-4" />
            <h3 className="text-xl font-semibold mb-3">Visual Analytics</h3>
            <p className="text-slate-300">
              Interactive charts, heatmaps, and timeline visualizations to understand 
              your log patterns and trends.
            </p>
          </div>

          <div className="bg-slate-800 rounded-xl p-8 border border-slate-700 hover:border-blue-500 transition-colors">
            <FileText className="w-12 h-12 text-blue-400 mb-4" />
            <h3 className="text-xl font-semibold mb-3">AI Insights</h3>
            <p className="text-slate-300">
              Get intelligent recommendations and anomaly detection to proactively 
              identify potential issues in your system.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link 
            to="/upload" 
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-colors inline-flex items-center justify-center gap-2"
          >
            <Upload className="w-5 h-5" />
            Upload Log File
          </Link>
          <Link 
            to="/analyze" 
            className="bg-slate-700 hover:bg-slate-600 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-colors inline-flex items-center justify-center gap-2 border border-slate-600"
          >
            <BarChart3 className="w-5 h-5" />
            View Analysis
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-slate-800 border-t border-slate-700 mt-20">
        <div className="container mx-auto px-6 py-8 text-center text-slate-400">
          <p>&copy; 2024 Log Analyzer. Built for developers, by developers.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;

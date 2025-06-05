
import { AlertTriangle, TrendingUp, Clock, Zap } from "lucide-react";
import { useLogContext } from "../contexts/LogContext";

const InsightsPanel = () => {
  const { logAnalysis } = useLogContext();

  if (!logAnalysis || !logAnalysis.insights.length) {
    return (
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold">AI Insights</h3>
          <span className="text-xs text-slate-400 bg-slate-700 px-2 py-1 rounded">
            Live Analysis
          </span>
        </div>
        <div className="text-center py-8">
          <p className="text-slate-400">Upload a log file to generate insights</p>
        </div>
      </div>
    );
  }

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'AlertTriangle': return AlertTriangle;
      case 'TrendingUp': return TrendingUp;
      case 'Clock': return Clock;
      case 'Zap': return Zap;
      default: return AlertTriangle;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'border-red-500 bg-red-500/10';
      case 'medium': return 'border-yellow-500 bg-yellow-500/10';
      case 'low': return 'border-blue-500 bg-blue-500/10';
      default: return 'border-gray-500 bg-gray-500/10';
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-red-500/20 text-red-400';
      case 'medium': return 'bg-yellow-500/20 text-yellow-400';
      case 'low': return 'bg-blue-500/20 text-blue-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  return (
    <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">AI Insights</h3>
        <span className="text-xs text-slate-400 bg-slate-700 px-2 py-1 rounded">
          Live Analysis
        </span>
      </div>

      <div className="space-y-4">
        {logAnalysis.insights.map((insight) => {
          const Icon = getIcon(insight.icon);
          return (
            <div 
              key={insight.id} 
              className={`p-4 rounded-lg border-l-4 ${getSeverityColor(insight.severity)}`}
            >
              <div className="flex items-start gap-3">
                <Icon className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-medium text-sm">{insight.title}</h4>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${getSeverityBadge(insight.severity)}`}>
                      {insight.severity}
                    </span>
                  </div>
                  <p className="text-sm text-slate-300 leading-relaxed mb-2">
                    {insight.description}
                  </p>
                  <div className="text-xs text-slate-500">
                    {insight.timestamp}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Action Button */}
      <div className="mt-6">
        <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors">
          Generate Detailed Report
        </button>
      </div>
    </div>
  );
};

export default InsightsPanel;

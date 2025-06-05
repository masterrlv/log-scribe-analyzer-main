
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, LineChart, Line, ResponsiveContainer } from 'recharts';
import { useLogContext } from '../contexts/LogContext';

const ChartsDashboard = () => {
  const { logAnalysis } = useLogContext();

  // Use real data if available, otherwise show empty state
  if (!logAnalysis) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <p className="text-slate-400">Upload a log file to see analysis charts</p>
        </div>
      </div>
    );
  }

  const { 
    totalEntries, 
    errorCount, 
    warningCount, 
    errorRate, 
    timelineData, 
    hourlyDistribution, 
    logLevelData 
  } = logAnalysis;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
          <h3 className="text-sm text-slate-400 mb-1">Total Entries</h3>
          <p className="text-2xl font-bold text-white">{totalEntries.toLocaleString()}</p>
        </div>
        <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
          <h3 className="text-sm text-slate-400 mb-1">Errors</h3>
          <p className="text-2xl font-bold text-red-400">{errorCount.toLocaleString()}</p>
        </div>
        <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
          <h3 className="text-sm text-slate-400 mb-1">Warnings</h3>
          <p className="text-2xl font-bold text-yellow-400">{warningCount.toLocaleString()}</p>
        </div>
        <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
          <h3 className="text-sm text-slate-400 mb-1">Error Rate</h3>
          <p className="text-2xl font-bold text-blue-400">{errorRate.toFixed(2)}%</p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Log Level Distribution */}
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
          <h3 className="text-lg font-semibold mb-4">Log Level Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={logLevelData.filter(item => item.value > 0)}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {logLevelData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Error Timeline */}
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
          <h3 className="text-lg font-semibold mb-4">Error Timeline (24h)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={timelineData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="time" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1f2937', 
                  border: '1px solid #374151',
                  borderRadius: '8px'
                }}
              />
              <Line type="monotone" dataKey="errors" stroke="#ef4444" strokeWidth={2} />
              <Line type="monotone" dataKey="warnings" stroke="#f59e0b" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Hourly Distribution */}
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 lg:col-span-2">
          <h3 className="text-lg font-semibold mb-4">Hourly Log Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={hourlyDistribution}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="hour" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1f2937', 
                  border: '1px solid #374151',
                  borderRadius: '8px'
                }}
              />
              <Bar dataKey="count" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default ChartsDashboard;

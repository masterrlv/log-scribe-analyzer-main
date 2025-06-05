
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { apiService, ApiLogEntry, ApiSearchResponse } from '../services/api';

export interface LogEntry {
  id: string;
  timestamp: string;
  level: 'ERROR' | 'WARN' | 'INFO' | 'DEBUG' | 'TRACE';
  message: string;
  source?: string;
  ip?: string;
  method?: string;
  path?: string;
  statusCode?: number;
  responseTime?: number;
}

export interface LogAnalysis {
  totalEntries: number;
  errorCount: number;
  warningCount: number;
  infoCount: number;
  debugCount: number;
  errorRate: number;
  timelineData: Array<{ time: string; errors: number; warnings: number }>;
  hourlyDistribution: Array<{ hour: string; count: number }>;
  logLevelData: Array<{ name: string; value: number; color: string }>;
  insights: Array<{
    id: number;
    type: string;
    icon: string;
    title: string;
    description: string;
    severity: 'high' | 'medium' | 'low';
    timestamp: string;
  }>;
}

interface LogContextType {
  logEntries: LogEntry[];
  logAnalysis: LogAnalysis | null;
  uploadedFileName: string | null;
  currentUploadId: number | null;
  searchLogs: (params: any) => Promise<void>;
  uploadLog: (file: File) => Promise<void>;
  refreshAnalysis: () => Promise<void>;
  clearLogData: () => void;
  loading: boolean;
}

const LogContext = createContext<LogContextType | undefined>(undefined);

export const useLogContext = () => {
  const context = useContext(LogContext);
  if (!context) {
    throw new Error('useLogContext must be used within a LogProvider');
  }
  return context;
};

interface LogProviderProps {
  children: ReactNode;
}

// Helper function to convert API log entry to our LogEntry format
const convertApiLogEntry = (apiEntry: ApiLogEntry): LogEntry => ({
  id: apiEntry.id.toString(),
  timestamp: apiEntry.timestamp,
  level: apiEntry.log_level as 'ERROR' | 'WARN' | 'INFO' | 'DEBUG' | 'TRACE',
  message: apiEntry.message,
  source: apiEntry.source,
  ip: apiEntry.additional_fields?.ip,
  method: apiEntry.additional_fields?.method,
  path: apiEntry.additional_fields?.path,
  statusCode: apiEntry.additional_fields?.status ? parseInt(apiEntry.additional_fields.status) : undefined,
  responseTime: apiEntry.additional_fields?.responseTime,
});

export const LogProvider = ({ children }: LogProviderProps) => {
  const [logEntries, setLogEntries] = useState<LogEntry[]>([]);
  const [logAnalysis, setLogAnalysis] = useState<LogAnalysis | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [currentUploadId, setCurrentUploadId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const searchLogs = async (params: any) => {
    try {
      setLoading(true);
      const response = await apiService.searchLogs(params);
      const convertedEntries = response.logs.map(convertApiLogEntry);
      setLogEntries(convertedEntries);
    } catch (error) {
      console.error('Failed to search logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const uploadLog = async (file: File) => {
    try {
      setLoading(true);
      const response = await apiService.uploadLogFile(file);
      setCurrentUploadId(response.upload_id);
      setUploadedFileName(file.name);
      
      // Poll for upload completion
      const pollStatus = async () => {
        try {
          const status = await apiService.getUploadStatus(response.upload_id);
          if (status.status === 'completed') {
            await refreshAnalysis();
            await searchLogs({ per_page: 100 }); // Load initial data
          } else if (status.status === 'processing') {
            setTimeout(pollStatus, 2000); // Poll every 2 seconds
          } else if (status.status === 'failed') {
            throw new Error('Upload processing failed');
          }
        } catch (error) {
          console.error('Error checking upload status:', error);
        }
      };
      
      pollStatus();
    } catch (error) {
      console.error('Failed to upload log:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const refreshAnalysis = async () => {
    try {
      // Get analytics data from backend
      const [distributionData, timeSeriesData, topErrorsData] = await Promise.all([
        apiService.getDistribution('log_level'),
        apiService.getTimeSeries(
          new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          new Date().toISOString(),
          'hour'
        ),
        apiService.getTopErrors(5)
      ]);

      // Convert API data to our LogAnalysis format
      const logLevelData = distributionData.series.map((item, index) => ({
        name: item.name || 'Unknown',
        value: item.value || 0,
        color: ['#ef4444', '#f59e0b', '#3b82f6', '#6b7280'][index] || '#6b7280'
      }));

      const totalEntries = logLevelData.reduce((sum, item) => sum + item.value, 0);
      const errorCount = logLevelData.find(item => item.name === 'ERROR')?.value || 0;
      const warningCount = logLevelData.find(item => item.name === 'WARN')?.value || 0;
      const infoCount = logLevelData.find(item => item.name === 'INFO')?.value || 0;
      const debugCount = logLevelData.find(item => item.name === 'DEBUG')?.value || 0;

      const analysis: LogAnalysis = {
        totalEntries,
        errorCount,
        warningCount,
        infoCount,
        debugCount,
        errorRate: totalEntries > 0 ? (errorCount / totalEntries) * 100 : 0,
        timelineData: timeSeriesData.series[0]?.data?.map(point => ({
          time: new Date(point.x).getHours().toString().padStart(2, '0') + ':00',
          errors: point.y,
          warnings: 0 // Would need separate API call for warnings
        })) || [],
        hourlyDistribution: timeSeriesData.series[0]?.data?.map(point => ({
          hour: new Date(point.x).getHours().toString(),
          count: point.y
        })) || [],
        logLevelData,
        insights: [
          {
            id: 1,
            type: 'error',
            icon: 'AlertTriangle',
            title: 'Top Errors Detected',
            description: `Found ${topErrorsData.series.length} distinct error patterns in your logs.`,
            severity: topErrorsData.series.length > 5 ? 'high' : 'medium',
            timestamp: '2 minutes ago'
          }
        ]
      };

      setLogAnalysis(analysis);
    } catch (error) {
      console.error('Failed to refresh analysis:', error);
    }
  };

  const clearLogData = () => {
    setLogEntries([]);
    setLogAnalysis(null);
    setUploadedFileName(null);
    setCurrentUploadId(null);
  };

  return (
    <LogContext.Provider value={{
      logEntries,
      logAnalysis,
      uploadedFileName,
      currentUploadId,
      searchLogs,
      uploadLog,
      refreshAnalysis,
      clearLogData,
      loading
    }}>
      {children}
    </LogContext.Provider>
  );
};

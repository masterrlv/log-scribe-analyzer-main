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
  uploadLog: (file: File) => Promise<{ status: string }>;
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
      localStorage.setItem('upload_id', response.upload_id.toString());
      console.log(response.upload_id,"response.upload_id")
      setUploadedFileName(file.name);

      // Poll for upload completion
      const pollStatus = async (): Promise<{ status: string }> => {
        try {
          const status = await apiService.getUploadStatus(response.upload_id);
          if (status.status === 'completed') {
            await refreshAnalysis();
            await searchLogs({ per_page: 100, upload_id: response.upload_id });
            return { status: 'completed' };
          } else if (status.status === 'processing') {
            await new Promise(resolve => setTimeout(resolve, 2000));
            return pollStatus();
          } else if (status.status === 'failed') {
            throw new Error('Upload processing failed');
          }
          return status;
        } catch (error) {
          console.error('Error checking upload status:', error);
          throw error;
        }
      };

      return await pollStatus();
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
        console.log(currentUploadId,"currentUploadId"),
        apiService.getTimeSeries(
          new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          new Date().toISOString(),
          'hour',
          localStorage.getItem('upload_id')
        ),

        apiService.getTopErrors(5)
      ]);

      // Convert API data to our LogAnalysis format
      console.log(distributionData,"distributionData")
      console.log(timeSeriesData,"timeSeriesData")
      const logLevelData = distributionData.series.map((item: any, index: number) => ({
        name: item.name,
        value: item.data.length > 0 ? item.data[0].y : 0,
        color: ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6'][index % 5]
      }));

     console.log(logLevelData,"logAnalysis s")
      const timelineData = timeSeriesData.series.length > 0 ? timeSeriesData.series[0].data.map((point: any) => ({
        time: point.x,
        errors: point.y,
        warnings: 0
      })) : [];

      const hourlyDistribution = timeSeriesData.series.length > 0 ? timeSeriesData.series[0].data.map((point: any) => ({
        hour: point.x.split('T')[1].substring(0, 5),
        count: point.y
      })) : [];

      const totalEntries = logLevelData.reduce((sum: number, item: any) => sum + item.value, 0);
      const errorCount = logLevelData.find((item: any) => item.name === 'ERROR')?.value || 0;
      const warningCount = logLevelData.find((item: any) => item.name === 'WARNING')?.value || 0;
      const infoCount = logLevelData.find((item: any) => item.name === 'INFO')?.value || 0;
      const debugCount = logLevelData.find((item: any) => item.name === 'DEBUG')?.value || 0;
      const errorRate = totalEntries > 0 ? (errorCount / totalEntries) * 100 : 0;

      const insights = topErrorsData.series.length > 0 ? topErrorsData.series[0].data.map((error: any, index: number) => ({
        id: index,
        type: 'error',
        icon: 'AlertTriangle',
        title: 'Top Error',
        description: `${error.x}: ${error.y} occurrences`,
        severity: 'high' as const,
        timestamp: new Date().toISOString()
      })) : [];

      setLogAnalysis({
        totalEntries,
        errorCount,
        warningCount,
        infoCount,
        debugCount,
        errorRate,
        timelineData,
        hourlyDistribution,
        logLevelData,
        insights
      });
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


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

class LogParser {
  private logFormats = {
    // Apache Common Log Format
    apache: /^(\S+) \S+ \S+ \[([^\]]+)\] "(\S+) ([^"]*)" (\d+) (\d+|-)/,
    
    // Nginx access log
    nginx: /^(\S+) - \S+ \[([^\]]+)\] "(\S+) ([^"]*)" (\d+) (\d+) "([^"]*)" "([^"]*)"/,
    
    // Generic application log with timestamp and level
    generic: /^(\d{4}-\d{2}-\d{2}[T\s]\d{2}:\d{2}:\d{2}[^\s]*)\s+\[?(\w+)\]?\s+(.+)$/,
    
    // JSON logs
    json: /^\{.*\}$/,
    
    // Simple timestamped logs
    simple: /^(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})\s+(.+)$/
  };

  parseLogFile(content: string): LogEntry[] {
    const lines = content.split('\n').filter(line => line.trim());
    const entries: LogEntry[] = [];
    
    // Try to detect format from first few lines
    const format = this.detectLogFormat(lines.slice(0, 10));
    console.log('Detected log format:', format);
    
    lines.forEach((line, index) => {
      const entry = this.parseLine(line, index, format);
      if (entry) {
        entries.push(entry);
      }
    });
    
    return entries;
  }

  private detectLogFormat(sampleLines: string[]): string {
    for (const line of sampleLines) {
      if (this.logFormats.json.test(line)) return 'json';
      if (this.logFormats.apache.test(line)) return 'apache';
      if (this.logFormats.nginx.test(line)) return 'nginx';
      if (this.logFormats.generic.test(line)) return 'generic';
      if (this.logFormats.simple.test(line)) return 'simple';
    }
    return 'generic'; // fallback
  }

  private parseLine(line: string, index: number, format: string): LogEntry | null {
    try {
      switch (format) {
        case 'json':
          return this.parseJsonLog(line, index);
        case 'apache':
          return this.parseApacheLog(line, index);
        case 'nginx':
          return this.parseNginxLog(line, index);
        case 'generic':
          return this.parseGenericLog(line, index);
        case 'simple':
          return this.parseSimpleLog(line, index);
        default:
          return this.parseGenericLog(line, index);
      }
    } catch (error) {
      console.warn('Failed to parse line:', line, error);
      return null;
    }
  }

  private parseJsonLog(line: string, index: number): LogEntry | null {
    try {
      const json = JSON.parse(line);
      return {
        id: `entry-${index}`,
        timestamp: json.timestamp || json.time || json['@timestamp'] || new Date().toISOString(),
        level: this.normalizeLogLevel(json.level || json.severity || 'INFO'),
        message: json.message || json.msg || line,
        source: json.source || json.logger || json.service
      };
    } catch {
      return null;
    }
  }

  private parseApacheLog(line: string, index: number): LogEntry | null {
    const match = this.logFormats.apache.exec(line);
    if (!match) return null;

    const [, ip, timestamp, method, path, statusCode] = match;
    const status = parseInt(statusCode);
    
    return {
      id: `entry-${index}`,
      timestamp: this.convertApacheTimestamp(timestamp),
      level: status >= 500 ? 'ERROR' : status >= 400 ? 'WARN' : 'INFO',
      message: `${method} ${path} - ${statusCode}`,
      source: 'apache',
      ip,
      method,
      path,
      statusCode: status
    };
  }

  private parseNginxLog(line: string, index: number): LogEntry | null {
    const match = this.logFormats.nginx.exec(line);
    if (!match) return null;

    const [, ip, timestamp, method, path, statusCode] = match;
    const status = parseInt(statusCode);
    
    return {
      id: `entry-${index}`,
      timestamp: this.convertApacheTimestamp(timestamp),
      level: status >= 500 ? 'ERROR' : status >= 400 ? 'WARN' : 'INFO',
      message: `${method} ${path} - ${statusCode}`,
      source: 'nginx',
      ip,
      method,
      path,
      statusCode: status
    };
  }

  private parseGenericLog(line: string, index: number): LogEntry | null {
    const match = this.logFormats.generic.exec(line);
    if (!match) {
      // Fallback for unstructured logs
      return {
        id: `entry-${index}`,
        timestamp: new Date().toISOString(),
        level: this.detectLevelFromContent(line),
        message: line,
        source: 'unknown'
      };
    }

    const [, timestamp, level, message] = match;
    return {
      id: `entry-${index}`,
      timestamp: this.normalizeTimestamp(timestamp),
      level: this.normalizeLogLevel(level),
      message: message.trim(),
      source: 'application'
    };
  }

  private parseSimpleLog(line: string, index: number): LogEntry | null {
    const match = this.logFormats.simple.exec(line);
    if (!match) return null;

    const [, timestamp, message] = match;
    return {
      id: `entry-${index}`,
      timestamp: this.normalizeTimestamp(timestamp),
      level: this.detectLevelFromContent(message),
      message: message.trim(),
      source: 'application'
    };
  }

  private normalizeLogLevel(level: string): 'ERROR' | 'WARN' | 'INFO' | 'DEBUG' | 'TRACE' {
    const upper = level.toUpperCase();
    if (upper.includes('ERROR') || upper.includes('ERR') || upper.includes('FATAL')) return 'ERROR';
    if (upper.includes('WARN') || upper.includes('WARNING')) return 'WARN';
    if (upper.includes('DEBUG')) return 'DEBUG';
    if (upper.includes('TRACE')) return 'TRACE';
    return 'INFO';
  }

  private detectLevelFromContent(content: string): 'ERROR' | 'WARN' | 'INFO' | 'DEBUG' | 'TRACE' {
    const upper = content.toUpperCase();
    if (upper.includes('ERROR') || upper.includes('EXCEPTION') || upper.includes('FAIL')) return 'ERROR';
    if (upper.includes('WARN') || upper.includes('WARNING')) return 'WARN';
    if (upper.includes('DEBUG')) return 'DEBUG';
    return 'INFO';
  }

  private normalizeTimestamp(timestamp: string): string {
    try {
      return new Date(timestamp).toISOString();
    } catch {
      return new Date().toISOString();
    }
  }

  private convertApacheTimestamp(timestamp: string): string {
    try {
      // Convert Apache format: "10/Oct/2000:13:55:36 -0700"
      const date = new Date(timestamp.replace(/(\d+)\/(\w+)\/(\d+):/, '$2 $1, $3 '));
      return date.toISOString();
    } catch {
      return new Date().toISOString();
    }
  }

  analyzeLogEntries(entries: LogEntry[]): LogAnalysis {
    const totalEntries = entries.length;
    const errorCount = entries.filter(e => e.level === 'ERROR').length;
    const warningCount = entries.filter(e => e.level === 'WARN').length;
    const infoCount = entries.filter(e => e.level === 'INFO').length;
    const debugCount = entries.filter(e => e.level === 'DEBUG').length;
    const errorRate = totalEntries > 0 ? (errorCount / totalEntries) * 100 : 0;

    return {
      totalEntries,
      errorCount,
      warningCount,
      infoCount,
      debugCount,
      errorRate,
      timelineData: this.generateTimelineData(entries),
      hourlyDistribution: this.generateHourlyDistribution(entries),
      logLevelData: [
        { name: 'ERROR', value: errorCount, color: '#ef4444' },
        { name: 'WARN', value: warningCount, color: '#f59e0b' },
        { name: 'INFO', value: infoCount, color: '#3b82f6' },
        { name: 'DEBUG', value: debugCount, color: '#6b7280' }
      ],
      insights: this.generateInsights(entries)
    };
  }

  private generateTimelineData(entries: LogEntry[]) {
    const timeGroups: { [key: string]: { errors: number; warnings: number } } = {};
    
    entries.forEach(entry => {
      const hour = new Date(entry.timestamp).getHours();
      const timeKey = `${hour.toString().padStart(2, '0')}:00`;
      
      if (!timeGroups[timeKey]) {
        timeGroups[timeKey] = { errors: 0, warnings: 0 };
      }
      
      if (entry.level === 'ERROR') timeGroups[timeKey].errors++;
      if (entry.level === 'WARN') timeGroups[timeKey].warnings++;
    });

    return Object.entries(timeGroups).map(([time, data]) => ({
      time,
      ...data
    })).sort((a, b) => a.time.localeCompare(b.time));
  }

  private generateHourlyDistribution(entries: LogEntry[]) {
    const hourCounts: { [hour: string]: number } = {};
    
    for (let i = 0; i < 24; i++) {
      hourCounts[i.toString()] = 0;
    }
    
    entries.forEach(entry => {
      const hour = new Date(entry.timestamp).getHours().toString();
      hourCounts[hour]++;
    });

    return Object.entries(hourCounts).map(([hour, count]) => ({
      hour,
      count
    }));
  }

  private generateInsights(entries: LogEntry[]) {
    const insights = [];
    const errorEntries = entries.filter(e => e.level === 'ERROR');
    const errorRate = entries.length > 0 ? (errorEntries.length / entries.length) * 100 : 0;

    if (errorRate > 5) {
      insights.push({
        id: 1,
        type: 'error',
        icon: 'AlertTriangle',
        title: 'High Error Rate Detected',
        description: `Error rate is ${errorRate.toFixed(1)}%, which is above the recommended 5% threshold.`,
        severity: 'high' as const,
        timestamp: '2 minutes ago'
      });
    }

    // Check for recent error spikes
    const recentErrors = errorEntries.filter(e => 
      new Date(e.timestamp).getTime() > Date.now() - 3600000 // last hour
    );
    
    if (recentErrors.length > 10) {
      insights.push({
        id: 2,
        type: 'pattern',
        icon: 'TrendingUp',
        title: 'Error Spike Detected',
        description: `${recentErrors.length} errors detected in the last hour, indicating a potential issue.`,
        severity: 'medium' as const,
        timestamp: '5 minutes ago'
      });
    }

    // Check for common error patterns
    const errorMessages = errorEntries.map(e => e.message);
    const messageGroups: { [msg: string]: number } = {};
    
    errorMessages.forEach(msg => {
      const simplified = msg.toLowerCase().split(' ').slice(0, 5).join(' ');
      messageGroups[simplified] = (messageGroups[simplified] || 0) + 1;
    });

    const repeatedErrors = Object.entries(messageGroups).filter(([, count]) => count > 3);
    if (repeatedErrors.length > 0) {
      insights.push({
        id: 3,
        type: 'pattern',
        icon: 'Clock',
        title: 'Recurring Error Pattern',
        description: `Found ${repeatedErrors.length} error patterns that repeat multiple times. Consider investigating root causes.`,
        severity: 'medium' as const,
        timestamp: '10 minutes ago'
      });
    }

    return insights;
  }
}

export const logParser = new LogParser();


const API_BASE_URL = 'http://localhost:8000';

export interface ApiLogEntry {
  id: number;
  timestamp: string;
  log_level: string;
  source: string;
  message: string;
  additional_fields: Record<string, any>;
}

export interface ApiSearchResponse {
  logs: ApiLogEntry[];
  total: number;
  page: number;
  per_page: number;
}

export interface ApiAnalyticsResponse {
  series: Array<{
    name: string;
    data?: Array<{ x: string; y: number }>;
    value?: number;
  }>;
}

export interface ApiUploadResponse {
  upload_id: number;
  status: string;
}

export interface ApiUploadStatus {
  status: string;
}

class ApiService {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem('auth_token');
  }

  private getHeaders() {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    
    return headers;
  }

  private getFormHeaders() {
    const headers: Record<string, string> = {};
    
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    
    return headers;
  }

  async login(username: string, password: string): Promise<{ access_token: string; token_type: string }> {
    const formData = new FormData();
    formData.append('username', username);
    formData.append('password', password);

    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Login failed');
    }

    const data = await response.json();
    this.token = data.access_token;
    localStorage.setItem('auth_token', data.access_token);
    return data;
  }

  async register(username: string, email: string, password: string): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ username, email, password }),
    });

    if (!response.ok) {
      throw new Error('Registration failed');
    }

    return response.json();
  }

  async uploadLogFile(file: File): Promise<ApiUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE_URL}/logs/upload`, {
      method: 'POST',
      headers: this.getFormHeaders(),
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Upload failed');
    }

    return response.json();
  }

  async getUploadStatus(uploadId: number): Promise<ApiUploadStatus> {
    const response = await fetch(`${API_BASE_URL}/logs/upload/${uploadId}/status`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to get upload status');
    }

    return response.json();
  }

  async searchLogs(params: {
    q?: string;
    log_level?: string;
    start_time?: string;
    end_time?: string;
    source?: string;
    page?: number;
    per_page?: number;
  }): Promise<ApiSearchResponse> {
    const queryParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value.toString());
      }
    });

    const response = await fetch(`${API_BASE_URL}/logs/search?${queryParams}`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error('Search failed');
    }

    return response.json();
  }

  async getTimeSeries(startTime: string, endTime: string, interval: string = 'hour'): Promise<ApiAnalyticsResponse> {
    const params = new URLSearchParams({
      start_time: startTime,
      end_time: endTime,
      interval,
    });

    const response = await fetch(`${API_BASE_URL}/analytics/time-series?${params}`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to get time series data');
    }

    return response.json();
  }

  async getDistribution(field: string = 'log_level'): Promise<ApiAnalyticsResponse> {
    const response = await fetch(`${API_BASE_URL}/analytics/distribution?field=${field}`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to get distribution data');
    }

    return response.json();
  }

  async getTopErrors(n: number = 10): Promise<ApiAnalyticsResponse> {
    const response = await fetch(`${API_BASE_URL}/analytics/top-errors?n=${n}`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to get top errors');
    }

    return response.json();
  }

  logout() {
    this.token = null;
    localStorage.removeItem('auth_token');
  }

  isAuthenticated(): boolean {
    return !!this.token;
  }
}

export const apiService = new ApiService();

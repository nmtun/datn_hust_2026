import apiClient from './axios';

export interface PerformancePeriod {
  period_id: number;
  period_name: string;
  start_date: string;
  end_date: string;
  status: 'planned' | 'in_progress' | 'completed';
  description?: string;
}

export const performancePeriodApi = {
  getAll: async () => {
    const response = await apiClient.get('/api/performance-period/get-all');
    return response.data;
  },
  getById: async (id: number) => {
    const response = await apiClient.get(`/api/performance-period/get/${id}`);
    return response.data;
  },
  create: async (data: Partial<PerformancePeriod>) => {
    const response = await apiClient.post('/api/performance-period/create', data);
    return response.data;
  },
  update: async (id: number, data: Partial<PerformancePeriod>) => {
    const response = await apiClient.put(`/api/performance-period/update/${id}`, data);
    return response.data;
  },
  toggleStatus: async (id: number) => {
    const response = await apiClient.put(`/api/performance-period/toggle-status/${id}`);
    return response.data;
  },
};

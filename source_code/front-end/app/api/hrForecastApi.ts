import apiClient from './axios';

export interface HRForecast {
  forecast_id: number;
  period: string;
  department_id?: number;
  current_headcount?: number;
  predicted_needs?: number;
  creation_date?: string;
  notes?: string;
  Department?: { department_id: number; name: string; code: string };
}

export const hrForecastApi = {
  getAll: async (department_id?: number) => {
    const response = await apiClient.get('/api/hr-forecast/get-all', {
      params: department_id ? { department_id } : undefined,
    });
    return response.data;
  },
  getById: async (id: number) => {
    const response = await apiClient.get(`/api/hr-forecast/get/${id}`);
    return response.data;
  },
  create: async (data: Partial<HRForecast>) => {
    const response = await apiClient.post('/api/hr-forecast/create', data);
    return response.data;
  },
  update: async (id: number, data: Partial<HRForecast>) => {
    const response = await apiClient.put(`/api/hr-forecast/update/${id}`, data);
    return response.data;
  },
};

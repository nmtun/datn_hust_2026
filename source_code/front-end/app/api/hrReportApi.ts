import apiClient from './axios';

export const hrReportApi = {
  getEmployeeCount: async () => {
    const response = await apiClient.get('/api/report/employee-count');
    return response.data;
  },
  getEmployeesByDepartment: async () => {
    const response = await apiClient.get('/api/report/employees-by-department');
    return response.data;
  },
  getTurnover: async (params?: { start_date?: string; end_date?: string }) => {
    const response = await apiClient.get('/api/report/turnover', { params });
    return response.data;
  },
  getPerformanceSummary: async () => {
    const response = await apiClient.get('/api/report/performance-summary');
    return response.data;
  },
};

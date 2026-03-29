import apiClient from './axios';

export interface PerformancePeriod {
  period_id: number;
  period_name: string;
  start_date: string;
  end_date: string;
  status: 'planned' | 'in_progress' | 'completed';
}

export interface Performance {
  perf_id: number;
  user_id: number;
  period_id: number;
  visibility?: 'private' | 'shared_with_employee';
  kpi_goals?: string;
  achievement?: string;
  rating?: number;
  feedback?: string;
  review_date?: string;
  reviewer_id?: number;
  created_at?: string;
  updated_at?: string;
  Period?: PerformancePeriod;
  period?: PerformancePeriod;
  reviewer?: { user_id: number; full_name: string; company_email?: string };
  employee?: { user_id: number; full_name: string; company_email?: string };
}

export interface EvaluableEmployeesResponse {
  error: boolean;
  message: string;
  hierarchy_role?: string;
  employees: Array<{
    user_id: number;
    full_name: string;
    company_email?: string;
    role: string;
    Employee_Info?: {
      department_id?: number;
      team_id?: number;
      position?: string;
      department?: { department_id: number; name: string; code: string };
      team?: { team_id: number; name: string; code: string };
    };
  }>;
}

export const performanceApi = {
  getMyPerformance: async () => {
    const response = await apiClient.get('/api/performance/my');
    return response.data;
  },
  // HR functions
  getAll: async () => {
    const response = await apiClient.get('/api/performance/get-all');
    return response.data;
  },
  getEvaluables: async (): Promise<EvaluableEmployeesResponse> => {
    const response = await apiClient.get('/api/performance/evaluables');
    return response.data;
  },
  getById: async (id: number) => {
    const response = await apiClient.get(`/api/performance/get/${id}`);
    return response.data;
  },
  create: async (data: Partial<Performance>) => {
    const response = await apiClient.post('/api/performance/create', data);
    return response.data;
  },
  update: async (id: number, data: Partial<Performance>) => {
    const response = await apiClient.put(`/api/performance/update/${id}`, data);
    return response.data;
  },
};

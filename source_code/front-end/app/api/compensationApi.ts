import apiClient from './axios';

export interface Compensation {
  comp_id: number;
  user_id: number;
  salary?: number;
  bonus?: number;
  effective_date?: string;
  reason?: string;
  comment?: string;
  approved_by?: number;
  approved_at?: string;
  created_at?: string;
  updated_at?: string;
  approver?: { user_id: number; full_name: string; company_email?: string };
  employee?: { user_id: number; full_name: string; company_email?: string };
}

export interface CompensationRecommendation {
  user_id: number;
  full_name: string;
  company_email?: string;
  average_rating: number;
  rating_count: number;
  current_salary?: number | null;
  salary_increase_percent: number;
  bonus_months: number;
  recommended_salary?: number | null;
  recommended_bonus?: number | null;
  ai_comment?: string;
  comment?: string;
}

export interface SaveRecommendationPayload {
  year: number;
  recommendations: CompensationRecommendation[];
}

export const compensationApi = {
  getMyCompensation: async () => {
    const response = await apiClient.get('/api/compensation/my');
    return response.data;
  },
  // HR functions
  getAll: async () => {
    const response = await apiClient.get('/api/compensation/get-all');
    return response.data;
  },
  getByEmployee: async (userId: number) => {
    const response = await apiClient.get(`/api/compensation/employee/${userId}`);
    return response.data;
  },
  create: async (data: Partial<Compensation>) => {
    const response = await apiClient.post('/api/compensation/create', data);
    return response.data;
  },
  update: async (id: number, data: Partial<Compensation>) => {
    const response = await apiClient.put(`/api/compensation/update/${id}`, data);
    return response.data;
  },
  getRecommendations: async (year: number) => {
    const response = await apiClient.post('/api/compensation/recommendations', { year });
    return response.data;
  },
  saveRecommendations: async (payload: SaveRecommendationPayload) => {
    const response = await apiClient.post('/api/compensation/recommendations/save', payload);
    return response.data;
  },
};

import apiClient from './axios';

export interface Team {
  team_id: number;
  name: string;
  code: string;
  department_id?: number;
  leader_id?: number;
  description?: string;
  active: boolean;
  created_at?: string;
  updated_at?: string;
  department?: { department_id: number; name: string; code: string };
  leader?: { user_id: number; full_name: string; company_email?: string };
}

export const teamApi = {
  getAll: async (department_id?: number) => {
    const response = await apiClient.get('/api/team/get-all', {
      params: department_id ? { department_id } : undefined,
    });
    return response.data;
  },
  getById: async (id: number) => {
    const response = await apiClient.get(`/api/team/get/${id}`);
    return response.data;
  },
  create: async (data: Partial<Team>) => {
    const response = await apiClient.post('/api/team/create', data);
    return response.data;
  },
  update: async (id: number, data: Partial<Team>) => {
    const response = await apiClient.put(`/api/team/update/${id}`, data);
    return response.data;
  },
  delete: async (id: number) => {
    const response = await apiClient.delete(`/api/team/delete/${id}`);
    return response.data;
  },
  addMember: async (teamId: number, userId: number) => {
    const response = await apiClient.put(`/api/team/${teamId}/add-member`, { user_id: userId });
    return response.data;
  },
  removeMember: async (teamId: number, userId: number) => {
    const response = await apiClient.put(`/api/team/${teamId}/remove-member`, { user_id: userId });
    return response.data;
  },
};

import apiClient from './axios';

export type ProjectStatus = 'to_do' | 'doing' | 'review' | 'done' | 'on_hold' | 'cancelled';

export interface Project {
  project_id: number;
  name: string;
  goal?: string | null;
  description?: string | null;
  manager_id: number;
  department_id?: number | null;
  start_date?: string | null;
  end_date?: string | null;
  status: ProjectStatus;
  active: boolean;
  created_at?: string;
  updated_at?: string | null;
  manager?: {
    user_id: number;
    full_name: string;
    company_email?: string;
  };
  department?: {
    department_id: number;
    name: string;
    code: string;
  };
  tasks?: Array<{
    task_id: number;
    title: string;
    status: string;
    priority: string;
    assigned_to: number;
    created_by: number;
    parent_task_id?: number | null;
    due_date?: string | null;
  }>;
}

export interface ProjectQuery {
  project_id?: number;
  manager_id?: number;
  department_id?: number;
  status?: ProjectStatus;
}

export const projectApi = {
  getAll: async (params?: ProjectQuery) => {
    const response = await apiClient.get('/api/project/get-all', { params });
    return response.data;
  },
  getById: async (id: number) => {
    const response = await apiClient.get(`/api/project/get/${id}`);
    return response.data;
  },
  create: async (data: Partial<Project>) => {
    const response = await apiClient.post('/api/project/create', data);
    return response.data;
  },
  update: async (id: number, data: Partial<Project>) => {
    const response = await apiClient.put(`/api/project/update/${id}`, data);
    return response.data;
  },
  delete: async (id: number) => {
    const response = await apiClient.delete(`/api/project/delete/${id}`);
    return response.data;
  },
};

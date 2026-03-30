import apiClient from './axios';

export interface Department {
  department_id: number;
  name: string;
  code: string;
  description?: string;
  manager_id?: number;
  parent_department_id?: number;
  active: boolean;
  created_at?: string;
  updated_at?: string;
  manager?: { user_id: number; full_name: string; company_email?: string };
  parentDepartment?: { department_id: number; name: string; code: string };
  subDepartments?: Department[];
}

export const departmentApi = {
  getAll: async () => {
    const response = await apiClient.get('/api/department/get-all');
    return response.data;
  },
  getById: async (id: number) => {
    const response = await apiClient.get(`/api/department/get/${id}`);
    return response.data;
  },
  create: async (data: Partial<Department>) => {
    const response = await apiClient.post('/api/department/create', data);
    return response.data;
  },
  update: async (id: number, data: Partial<Department>) => {
    const response = await apiClient.put(`/api/department/update/${id}`, data);
    return response.data;
  },
  delete: async (id: number) => {
    const response = await apiClient.delete(`/api/department/delete/${id}`);
    return response.data;
  },
};

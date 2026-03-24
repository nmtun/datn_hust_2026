import apiClient from './axios';

export interface EmployeeProfile {
  user_id: number;
  full_name: string;
  personal_email: string;
  company_email?: string;
  phone_number?: string;
  address?: string;
  status: 'active' | 'on_leave' | 'terminated';
  role: string;
  Employee_Info?: {
    employee_id: number;
    employee_id_number?: string;
    position?: string;
    hire_date?: string;
    department_id?: number;
    team_id?: number;
    manager_id?: number;
    department?: { department_id: number; name: string; code: string };
    team?: { team_id: number; name: string; code: string };
    manager?: { user_id: number; full_name: string; company_email?: string };
  };
}

export const employeeApi = {
  getMyProfile: async () => {
    const response = await apiClient.get('/api/employee/my-profile');
    return response.data;
  },
  updateMyProfile: async (data: { phone_number?: string; address?: string }) => {
    const response = await apiClient.put('/api/employee/my-profile', data);
    return response.data;
  },
  // HR functions
  getAll: async (params?: { full_name?: string; department_id?: number; status?: string }) => {
    const response = await apiClient.get('/api/employee/get-all', { params });
    return response.data;
  },
  getById: async (id: number) => {
    const response = await apiClient.get(`/api/employee/get/${id}`);
    return response.data;
  },
  update: async (id: number, data: Partial<EmployeeProfile & { position?: string; department_id?: number; team_id?: number; manager_id?: number; hire_date?: string; role?: string }>) => {
    const response = await apiClient.put(`/api/employee/update/${id}`, data);
    return response.data;
  },
  updateStatus: async (id: number, status: 'active' | 'on_leave' | 'terminated') => {
    const response = await apiClient.put(`/api/employee/status/${id}`, { status });
    return response.data;
  },
};

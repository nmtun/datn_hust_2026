import apiClient from "./axios";

export interface AdminProfile {
    user_id: number;
    full_name: string;
    personal_email: string;
    company_email?: string;
    phone_number?: string;
    address?: string;
    status: 'active' | 'on_leave' | 'terminated';
    role: string;
    is_deleted?: boolean;
    created_at?: string;
    updated_at?: string;
}

export interface AdminUserCreatePayload {
    full_name: string;
    personal_email: string;
    company_email?: string;
    password: string;
    phone_number?: string;
    address?: string;
    role: 'employee' | 'hr' | 'manager' | 'admin';
    status?: 'active' | 'on_leave' | 'terminated';
}

export const userApi = {
    getAdminProfile: async () => {
        const response = await apiClient.get('/api/user/profile');
        return response.data;
    },
    updateAdminProfile: async (data: { phone_number?: string; address?: string }) => {
        const response = await apiClient.put('/api/user/profile/update', data);
        return response.data;
    },
    // Admin functions
    getAll: async (params?: { full_name?: string; email?: string; role?: string; status?: string; include_deleted?: boolean }) => {
        const response = await apiClient.get('/api/user/get-all', { params });
        return response.data;
    },
    create: async (data: AdminUserCreatePayload) => {
        const response = await apiClient.post('/api/user/create', data);
        return response.data;
    },
    getById: async (id: number) => {
        const response = await apiClient.get(`/api/user/get/${id}`);
        return response.data;
    },
    update: async (id: number, data: Partial<AdminProfile & { password?: string }>) => {
        const response = await apiClient.put(`/api/user/update/${id}`, data);
        return response.data;
    },
    delete: async (id: number) => {
        const response = await apiClient.delete(`/api/user/delete/${id}`);
        return response.data;
    },
    restore: async (id: number) => {
        const response = await apiClient.post(`/api/user/restore/${id}`);
        return response.data;
    }
};  
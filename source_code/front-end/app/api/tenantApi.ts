import apiClient from "./axios";

export type TenantStatus = "active" | "inactive" | "suspended";

export interface TenantRecord {
    tenant_id: number;
    tenant_name: string;
    tenant_code: string;
    subdomain: string;
    company_email: string;
    phone_number?: string | null;
    address?: string | null;
    status: TenantStatus;
    created_at?: string;
    updated_at?: string;
    is_deleted?: boolean;
}

export interface TenantPayload {
    tenant_name: string;
    tenant_code: string;
    subdomain: string;
    company_email: string;
    phone_number?: string;
    address?: string;
    status?: TenantStatus;
}

export const tenantApi = {
    getAll: async (params?: { status?: string; search?: string; include_deleted?: boolean }) => {
        const response = await apiClient.get('/api/tenant/get-all', { params });
        return response.data;
    },
    getCurrent: async () => {
        const response = await apiClient.get('/api/tenant/me');
        return response.data;
    },
    getById: async (id: number, includeDeleted?: boolean) => {
        const response = await apiClient.get(`/api/tenant/get/${id}`, {
            params: includeDeleted ? { include_deleted: true } : undefined,
        });
        return response.data;
    },
    create: async (data: TenantPayload) => {
        const response = await apiClient.post('/api/tenant/create', data);
        return response.data;
    },
    update: async (id: number, data: Partial<TenantPayload>) => {
        const response = await apiClient.put(`/api/tenant/update/${id}`, data);
        return response.data;
    },
    delete: async (id: number) => {
        const response = await apiClient.delete(`/api/tenant/delete/${id}`);
        return response.data;
    },
    restore: async (id: number) => {
        const response = await apiClient.post(`/api/tenant/restore/${id}`);
        return response.data;
    },
};
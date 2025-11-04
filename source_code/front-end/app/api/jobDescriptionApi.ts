import apiClient from './axios';

export interface JobDescription {
  job_id: number;
  title: string;
  description: string;
  location: string;
  type_of_work: 'on-site' | 'remote' | 'hybrid';
  requirements: string;
  responsibilities: string;
  qualifications: string;
  experience_level: 'intern' | 'fresher' | 'mid' | 'senior' | 'manager';
  employment_type: 'full-time' | 'part-time';
  salary_range_min: number;
  salary_range_max: number;
  status: 'draft' | 'active' | 'paused' | 'closed';
  posting_date: string;
  closing_date: string;
  positions_count: number;
  department_id: number;
  created_by: number;
  created_at: string;
  updated_at: string | null;
}

export const jobDescriptionApi = {
  getAll: async () => {
    const response = await apiClient.get("/api/job-description/get-all");
    return response.data;
  },

  getById: async (id: number) => {
    const response = await apiClient.get(`/api/job-description/get/${id}`);
    return response.data;
  },

  create: async (data: Omit<JobDescription, "job_id" | "created_at" | "updated_at">) => {
    const response = await apiClient.post("/api/job-description/create", data);
    return response.data;
  },

  update: async (id: number, data: Partial<JobDescription>) => {
    const response = await apiClient.put(`/api/job-description/update/${id}`, data);
    return response.data;
  },

  delete: async (id: number) => {
    const response = await apiClient.delete(`/api/job-description/delete/${id}`);
    return response.data;
  },

  getDeleted: async () => {
    const response = await apiClient.get("/api/job-description/get-deleted");
    return response.data;
  },

  restore: async (id: number) => {
    const response = await apiClient.post(`/api/job-description/restore/${id}`);
    return response.data;
  },

  search: async (query: {
    title?: string;
    location?: string;
    experience_level?: string;
  }) => {
    const response = await apiClient.get("/api/job-description/search", { params: query });
    return response.data;
  },
};
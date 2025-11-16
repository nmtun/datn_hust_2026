import apiClient from './axios';

export interface CandidateInfo {
  candidate_info_id: number;
  cv_file_path?: string;
  candidate_status: 'new' | 'screening' | 'interview' | 'offered' | 'rejected' | 'hired';
  source?: string;
  apply_date: string;
  evaluation?: number;
  cover_letter?: string;
  job_id?: number;
  Job_Description?: {
    job_id: number;
    title: string;
    experience_level: string;
    employment_type: string;
  };
}

export interface CandidateUser {
  user_id: number;
  personal_email: string;
  full_name: string;
  phone_number?: string;
  address?: string;
  status: 'active' | 'on_leave' | 'terminated';
  Candidate_Infos?: CandidateInfo[];
}

export interface Candidate {
  user_id: number;
  personal_email: string;
  full_name: string;
  phone_number?: string;
  address?: string;
  status: 'active' | 'on_leave' | 'terminated';
  Candidate_Infos?: CandidateInfo[];
}

export const candidateApi = {
  getAll: async () => {
    const response = await apiClient.get("/api/candidate/get-all");
    return response.data;
  },

  getById: async (id: number) => {
    const response = await apiClient.get(`/api/candidate/get/${id}`);
    return response.data;
  },

  create: async (data: FormData) => {
    const response = await apiClient.post("/api/candidate/create", data, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  update: async (id: number, data: any) => {
    const response = await apiClient.put(`/api/candidate/update/${id}`, data);
    return response.data;
  },

  delete: async (id: number) => {
    const response = await apiClient.delete(`/api/candidate/delete/${id}`);
    return response.data;
  },

  getDeleted: async () => {
    const response = await apiClient.get("/api/candidate/get-deleted");
    return response.data;
  },

  restore: async (id: number) => {
    const response = await apiClient.post(`/api/candidate/restore/${id}`);
    return response.data;
  },

  search: async (query: {
    full_name?: string;
    personal_email?: string;
    candidate_status?: string;
  }) => {
    const params = new URLSearchParams();
    if (query.full_name) params.append('full_name', query.full_name);
    if (query.personal_email) params.append('personal_email', query.personal_email);
    if (query.candidate_status) params.append('candidate_status', query.candidate_status);
    
    const response = await apiClient.get(`/api/candidate/search?${params.toString()}`);
    return response.data;
  },

  searchDeleted: async (query: {
    full_name?: string;
    personal_email?: string;
    candidate_status?: string;
  }) => {
    const params = new URLSearchParams();
    if (query.full_name) params.append('full_name', query.full_name);
    if (query.personal_email) params.append('personal_email', query.personal_email);
    if (query.candidate_status) params.append('candidate_status', query.candidate_status);
    
    const response = await apiClient.get(`/api/candidate/search-deleted?${params.toString()}`);
    return response.data;
  },

  updateApplication: async (candidateInfoId: number, data: Partial<CandidateInfo>) => {
    const response = await apiClient.put(`/api/candidate/application/${candidateInfoId}`, data);
    return response.data;
  },
};
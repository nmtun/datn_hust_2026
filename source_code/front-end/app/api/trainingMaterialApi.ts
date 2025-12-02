import apiClient from './axios';

export interface TrainingMaterial {
  material_id: number;
  title: string;
  type: 'video' | 'document' | 'both';
  content_path: string;
  description: string;
  status: 'active' | 'draft' | 'archived';
  created_by: number;
  created_at: string;
  updated_at: string | null;
  creator?: {
    user_id: number;
    full_name: string;
    personal_email: string;
  };
  tags?: {
    tag_id: number;
    name: string;
  }[];
  quizzes?: {
    quiz_id: number;
    title: string;
    description?: string;
    duration: number;
    passing_score: number;
  }[];
}

export const trainingMaterialApi = {
  getAll: async () => {
    const response = await apiClient.get("api/training-material/get-all");
    return response.data;
  },

  getById: async (id: number) => {
    const response = await apiClient.get(`api/training-material/get/${id}`);
    return response.data;
  },

  create: async (materialData: FormData) => {
    const response = await apiClient.post("api/training-material/create", materialData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  update: async (id: number, materialData: FormData) => {
    const response = await apiClient.put(`api/training-material/update/${id}`, materialData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  delete: async (id: number) => {
    const response = await apiClient.delete(`api/training-material/delete/${id}`);
    return response.data;
  },

  getArchived: async () => {
    const response = await apiClient.get('api/training-material/get-archived');
    return response.data;
  },

  restore: async (id: number) => {
    const response = await apiClient.post(`api/training-material/restore/${id}`);
    return response.data;
  },

  search: async (query: {
    title?: string;
    created_by?: string;
    status?: string;
  }) => {
    const response = await apiClient.get("api/training-material/search", { params: query });
    return response.data;
  },

  downloadFile: async (filename: string) => {
    const response = await apiClient.get(`api/training-material/download/${filename}`, {
      responseType: 'blob',
    });
    return response;
  },

  getQuizzesBySharedTags: async (materialId: number) => {
    const response = await apiClient.get(`api/training-material/${materialId}/shared-tag-quizzes`);
    return response.data;
  },

  attachQuiz: async (materialId: number, quizId: number) => {
    const response = await apiClient.post(`api/training-material/${materialId}/attach-quiz`, {
      quizId
    });
    return response.data;
  },

  detachQuiz: async (materialId: number, quizId: number) => {
    const response = await apiClient.delete(`api/training-material/${materialId}/detach-quiz/${quizId}`);
    return response.data;
  },
};
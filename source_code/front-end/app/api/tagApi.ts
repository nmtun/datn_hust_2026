import axios from './axios';

export interface Tag {
  tag_id: number;
  name: string;
  created_at: string;
  updated_at?: string;
  trainingMaterials?: {
    material_id: number;
    title: string;
  }[];
}

export interface TagResponse {
  error: boolean;
  message: string;
  tag?: Tag;
  tags?: Tag[];
}

export const tagApi = {
  // Get all tags
  getAll: async (): Promise<TagResponse> => {
    const response = await axios.get('api/tag/get-all');
    return response.data;
  },

  // Create new tag
  create: async (tagData: { name: string }): Promise<TagResponse> => {
    const response = await axios.post('api/tag/create', tagData);
    return response.data;
  },

  // Update tag
  update: async (tagId: number, tagData: { name: string }): Promise<TagResponse> => {
    const response = await axios.put(`api/tag/update/${tagId}`, tagData);
    return response.data;
  },

  // Delete tag
  delete: async (tagId: number): Promise<TagResponse> => {
    const response = await axios.delete(`api/tag/delete/${tagId}`);
    return response.data;
  },

  // Search tags
  search: async (query: string): Promise<TagResponse> => {
    const response = await axios.get('api/tag/search', { params: { q: query } });
    return response.data;
  },

  // Assign tags to material
  assignToMaterial: async (materialId: number, tagIds: number[]): Promise<TagResponse> => {
    const response = await axios.post(`api/tag/assign-to-material/${materialId}`, { tagIds });
    return response.data;
  },

  // Remove tags from material
  removeFromMaterial: async (materialId: number, tagIds: number[]): Promise<TagResponse> => {
    const response = await axios.post(`api/tag/remove-from-material/${materialId}`, { tagIds });
    return response.data;
  },

  // Get materials by tag
  getMaterialsByTag: async (tagId: number): Promise<any> => {
    const response = await axios.get(`api/tag/materials/${tagId}`);
    return response.data;
  }
};
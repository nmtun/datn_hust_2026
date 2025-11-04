import api from './axios';

export const JobDescriptionApi = {
  getAll: async () => {
    try {
      const response = await api.get('api/job-description/get-all');
      return response.data;
    } catch (error) {
      console.error('Error fetching job descriptions:', error);
      throw error;
    }
  },

  getById: async (id: number) => {
    try {
      const response = await api.get(`api/job-description/get/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching job description with id ${id}:`, error);
      throw error;
    }
  }
};
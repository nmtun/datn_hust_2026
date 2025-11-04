import api from './axios';

export const CandidateApi = {
  submitApplication: async (formData: FormData) => {
    try {
      const response = await api.post('api/candidate/create', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error submitting application:', error);
      throw error;
    }
  },
};
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
    } catch (error: any) {
      console.error('Error submitting application:', error);
      
      // Trả về thông báo lỗi từ backend nếu có
      if (error.response?.data) {
        return error.response.data;
      }
      
      // Trả về lỗi mặc định nếu không có response từ backend
      return {
        error: true,
        message: 'Có lỗi xảy ra khi gửi đơn ứng tuyển. Vui lòng thử lại sau.'
      };
    }
  },
};
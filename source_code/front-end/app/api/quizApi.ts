import apiClient from './axios';

export interface Quiz {
  quiz_id: number;
  title: string;
  description?: string;
  duration: number;
  passing_score: number;
  created_by: number;
  creation_date: string;
  status: 'active' | 'draft' | 'archived';
  creator?: {
    user_id: number;
    full_name: string;
    personal_email: string;
    company_email: string;
  };
  questions?: QuizQuestion[];
  questionAssignments?: {
    id: number;
    quiz_id: number;
    question_id: number;
    tag_id: number;
    question_order: number;
    points_override?: number;
    is_active: boolean;
    added_at: string;
    added_by: number;
    question: QuizQuestion;
    tag: {
      tag_id: number;
      name: string;
    };
  }[];
  trainingMaterials?: {
    material_id: number;
    title: string;
  }[];
  tags?: {
    tag_id: number;
    name: string;
  }[];
}

export interface QuizQuestion {
  question_id: number;
  // quiz_id removed - questions are now independent
  question_text: string;
  question_type: 'multiple_choice' | 'multiple_response' | 'true_false';
  options?: string;
  correct_answer: string;
  points: number;
  created_by?: number;
  created_at?: string;
  updated_at?: string;
  is_active?: boolean;
  // Quiz relationship through QuestionToQuiz
  quizAssignments?: {
    id: number;
    quiz_id: number;
    tag_id: number;
    question_order: number;
    points_override?: number;
    quiz: {
      quiz_id: number;
      title: string;
      status: string;
    };
    tag: {
      tag_id: number;
      name: string;
    };
  }[];
  tags?: {
    tag_id: number;
    name: string;
  }[];
}

export const quizApi = {
  getAll: async (params?: {
    search?: string;
    status?: string;
  }) => {
    const response = await apiClient.get("api/quizzes/get-all", { params });
    return response.data;
  },

  getById: async (id: number) => {
    const response = await apiClient.get(`api/quizzes/get/${id}`);
    return response.data;
  },

  create: async (quizData: {
    title: string;
    description?: string;
    duration: number;
    passing_score: number;
    status?: string;
    tag_ids?: number[];
  }) => {
    const response = await apiClient.post("api/quizzes/create", quizData);
    return response.data;
  },

  createWithRandomQuestions: async (data: {
    quizData: {
      title: string;
      description?: string;
      duration: number;
      passing_score: number;
      status?: string;
    };
    tagConfigs: {
      tagId: number;
      questionCount: number;
    }[];
  }) => {
    const response = await apiClient.post("api/quizzes/create-with-random-questions", data);
    return response.data;
  },

  update: async (id: number, quizData: Partial<Quiz>) => {
    const response = await apiClient.put(`api/quizzes/update/${id}`, quizData);
    return response.data;
  },

  delete: async (id: number) => {
    const response = await apiClient.delete(`api/quizzes/delete/${id}`);
    return response.data;
  },

  getArchived: async (params?: {
    page?: number;
    limit?: number;
  }) => {
    const response = await apiClient.get('api/quizzes/get-archived', { params });
    return response.data;
  },

  restore: async (id: number) => {
    const response = await apiClient.post(`api/quizzes/restore/${id}`);
    return response.data;
  },

  hardDelete: async (id: number) => {
    const response = await apiClient.delete(`api/quizzes/hard-delete/${id}`);
    return response.data;
  },

  attachToMaterial: async (materialId: number, quizId: number) => {
    const response = await apiClient.post("api/quizzes/attach-to-material", {
      materialId,
      quizId
    });
    return response.data;
  },

  detachFromMaterial: async (materialId: number, quizId: number) => {
    const response = await apiClient.delete(`api/quizzes/detach-from-material/${materialId}/${quizId}`);
    return response.data;
  }
};

// New QuestionToQuiz API for managing question-quiz relationships through tags
export const questionToQuizApi = {
  // Add question to quiz by tag
  addQuestionToQuiz: async (data: {
    questionId: number;
    quizId: number;
    tagId: number;
    questionOrder?: number;
    pointsOverride?: number;
  }) => {
    const response = await apiClient.post("api/question-to-quiz/add", data);
    return response.data;
  },

  // Auto add questions to quiz by tags
  autoAddQuestionsByTags: async (data: {
    quizId: number;
    tagIds: number[];
    maxQuestionsPerTag?: number;
  }) => {
    const response = await apiClient.post("api/question-to-quiz/auto-add", data);
    return response.data;
  },

  // Get questions in quiz (optionally filtered by tag)
  getQuestionsByQuiz: async (quizId: number, tagId?: number) => {
    const params = tagId ? { tagId } : {};
    const response = await apiClient.get(`api/question-to-quiz/${quizId}/questions`, { params });
    return response.data;
  },

  // Remove question from quiz
  removeQuestionFromQuiz: async (data: {
    questionId: number;
    quizId: number;
  }) => {
    const response = await apiClient.delete("api/question-to-quiz/remove", { data });
    return response.data;
  },

  // Reorder questions in quiz
  reorderQuestions: async (data: {
    quizId: number;
    questionOrders: { questionId: number; order: number }[];
  }) => {
    const response = await apiClient.put("api/question-to-quiz/reorder", data);
    return response.data;
  },

  // Get quiz statistics by tag
  getQuestionStats: async (quizId: number) => {
    const response = await apiClient.get(`api/question-to-quiz/${quizId}/stats`);
    return response.data;
  },

  // Get quizzes that use a specific question
  getQuizzesByQuestion: async (questionId: number, tagId?: number) => {
    const params = tagId ? { tagId } : {};
    const response = await apiClient.get(`api/question-to-quiz/question/${questionId}/quizzes`, { params });
    return response.data;
  }
};

export const questionApi = {
  getAll: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    questionType?: string;
  }) => {
    const response = await apiClient.get("api/quiz-questions/get-all", { params });
    return response.data;
  },

  getByQuizId: async (quizId: number, params?: {
    page?: number;
    limit?: number;
  }) => {
    const response = await apiClient.get(`api/quiz-questions/quiz/${quizId}`, { params });
    return response.data;
  },

  getById: async (id: number) => {
    const response = await apiClient.get(`api/quiz-questions/get/${id}`);
    return response.data;
  },

  create: async (questionData: {
    // quiz_id removed - questions are now independent
    question_text: string;
    question_type: 'multiple_choice' | 'multiple_response' | 'true_false';
    options?: string;
    correct_answer: string;
    points?: number;
  }) => {
    const response = await apiClient.post("api/quiz-questions/create", questionData);
    return response.data;
  },

  update: async (id: number, questionData: Partial<QuizQuestion>) => {
    const response = await apiClient.put(`api/quiz-questions/update/${id}`, questionData);
    return response.data;
  },

  delete: async (id: number) => {
    const response = await apiClient.delete(`api/quiz-questions/delete/${id}`);
    return response.data;
  },

  deleteByQuizId: async (quizId: number) => {
    const response = await apiClient.delete(`api/quiz-questions/quiz/${quizId}`);
    return response.data;
  },

  bulkCreate: async (questions: {
    quiz_id: number;
    question_text: string;
    question_type: 'multiple_choice' | 'multiple_response' | 'true_false';
    options?: string;
    correct_answer: string;
    points?: number;
  }[]) => {
    const response = await apiClient.post("api/quiz-questions/bulk-create", { questions });
    return response.data;
  },

  getByTags: async (params: {
    tagIds: number[];
    questionType?: string;
    limit?: number;
  }) => {
    const response = await apiClient.get("api/quiz-questions/by-tags", { 
      params: {
        tagIds: params.tagIds.join(','),
        questionType: params.questionType,
        limit: params.limit
      }
    });
    return response.data;
  }
};
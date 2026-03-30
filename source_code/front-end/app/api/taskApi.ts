import apiClient from './axios';

export type TaskStatus = 'to_do' | 'doing' | 'review' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TaskReviewDecision = 'approved' | 'changes_requested';

export interface TaskComment {
  comment_id: number;
  task_id: number;
  user_id: number;
  comment: string;
  created_at: string;
  updated_at?: string | null;
  author?: {
    user_id: number;
    full_name: string;
    company_email?: string;
  };
}

export interface TaskReview {
  review_id: number;
  task_id: number;
  reviewer_id: number;
  reviewed_user_id: number;
  decision: TaskReviewDecision;
  note?: string | null;
  created_at: string;
  updated_at?: string | null;
  reviewer?: {
    user_id: number;
    full_name: string;
    company_email?: string;
  };
  reviewedUser?: {
    user_id: number;
    full_name: string;
    company_email?: string;
  };
}

export interface Task {
  task_id: number;
  project_id: number;
  parent_task_id?: number | null;
  team_id?: number | null;
  title: string;
  description?: string | null;
  assigned_to: number;
  created_by: number;
  start_date?: string | null;
  due_date?: string | null;
  completed_date?: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  active: boolean;
  created_at?: string;
  updated_at?: string | null;
  project?: {
    project_id: number;
    name: string;
    status: string;
    manager_id: number;
  };
  team?: {
    team_id: number;
    name: string;
    code: string;
    department_id: number;
  };
  assignee?: {
    user_id: number;
    full_name: string;
    company_email?: string;
  };
  creator?: {
    user_id: number;
    full_name: string;
    company_email?: string;
  };
  parentTask?: {
    task_id: number;
    title: string;
    status: string;
  };
  comments?: TaskComment[];
  reviews?: TaskReview[];
  subTasks?: Task[];
}

export interface TaskQuery {
  project_id?: number;
  assigned_to?: number;
  created_by?: number;
  team_id?: number;
  status?: TaskStatus;
  parent_task_id?: number | 'null';
}

export interface CreateTaskPayload {
  title: string;
  description?: string;
  project_id: number;
  department_id?: number;
  assigned_to: number;
  parent_task_id?: number;
  due_date?: string;
  priority?: TaskPriority;
  status?: TaskStatus;
  start_date?: string;
  team_id?: number;
}

export interface UpdateTaskPayload {
  title?: string;
  description?: string;
  department_id?: number;
  assigned_to?: number;
  parent_task_id?: number | null;
  due_date?: string;
  priority?: TaskPriority;
  start_date?: string;
  team_id?: number | null;
}

export const taskApi = {
  getAll: async (params?: TaskQuery) => {
    const response = await apiClient.get('/api/task/get-all', { params });
    return response.data;
  },
  getById: async (id: number) => {
    const response = await apiClient.get(`/api/task/get/${id}`);
    return response.data;
  },
  create: async (data: CreateTaskPayload) => {
    const response = await apiClient.post('/api/task/create', data);
    return response.data;
  },
  update: async (id: number, data: UpdateTaskPayload) => {
    const response = await apiClient.put(`/api/task/update/${id}`, data);
    return response.data;
  },
  updateStatus: async (id: number, status: TaskStatus) => {
    const response = await apiClient.put(`/api/task/status/${id}`, { status });
    return response.data;
  },
  delete: async (id: number) => {
    const response = await apiClient.delete(`/api/task/delete/${id}`);
    return response.data;
  },
  getComments: async (id: number) => {
    const response = await apiClient.get(`/api/task/${id}/comments`);
    return response.data;
  },
  addComment: async (id: number, comment: string) => {
    const response = await apiClient.post(`/api/task/${id}/comments`, { comment });
    return response.data;
  },
  createReview: async (id: number, data: { decision: TaskReviewDecision; note?: string }) => {
    const response = await apiClient.post(`/api/task/${id}/reviews`, data);
    return response.data;
  },
};

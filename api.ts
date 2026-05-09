import axios from 'axios';

const api = axios.create({
  // In dev: Vite proxies /api → http://localhost:8000 (stripping /api prefix)
  // In production: FastAPI handles /api routes directly
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface Task {
  id: number;
  title: string;
  description: string | null;
  completed: boolean;
  priority: 'Low' | 'Medium' | 'High';
  due_date: string | null;
  category?: string;
  created_at: string;
}

export interface TaskUpdate {
  title?: string;
  description?: string;
  completed?: boolean;
  priority?: 'Low' | 'Medium' | 'High';
  due_date?: string | null;
  category?: string;
}

export const authApi = {
  login: (data: URLSearchParams) => 
    api.post('/auth/login', data, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    }),
  register: (data: { username: string; email: string; password: string }) =>
    api.post('/auth/register', data),
};

export const taskApi = {
  getTasks: (sortBy: string = 'created_at', order: string = 'desc') => 
    api.get<Task[]>(`/tasks/?sort_by=${sortBy}&order=${order}`),
  
  getTask: (id: number) => 
    api.get<Task>(`/tasks/${id}`),
  
  createTask: (data: { title: string; description?: string; priority?: string; due_date?: string | null; category?: string }) => 
    api.post<Task>('/tasks/', data),
  
  updateTask: (id: number, data: TaskUpdate) => 
    api.put<Task>(`/tasks/${id}`, data),
  
  deleteTask: (id: number) => 
    api.delete(`/tasks/${id}`),
};

export default api;

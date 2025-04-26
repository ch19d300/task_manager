// services/api.js
import axios from 'axios';

// Create axios instance with base URL
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add interceptor for authentication
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Tasks
export const getTasks = async (params = {}) => {
  const response = await api.get('/tasks', { params });
  return response.data;
};

export const getTaskById = async (id) => {
  const response = await api.get(`/tasks/${id}`);
  return response.data;
};

export const createTask = async (taskData) => {
  const response = await api.post('/tasks', taskData);
  return response.data;
};

export const updateTask = async (id, taskData) => {
  const response = await api.put(`/tasks/${id}`, taskData);
  return response.data;
};

export const updateTaskStatus = async (id, status) => {
  const response = await api.patch(`/tasks/${id}/status`, { status });
  return response.data;
};

export const deleteTask = async (id) => {
  const response = await api.delete(`/tasks/${id}`);
  return response.data;
};

// Members
export const getMembers = async () => {
  const response = await api.get('/members');
  return response.data;
};

export const getMemberById = async (id) => {
  const response = await api.get(`/members/${id}`);
  return response.data;
};

export const createMember = async (memberData) => {
  const response = await api.post('/members', memberData);
  return response.data;
};

export const updateMember = async (id, memberData) => {
  const response = await api.put(`/members/${id}`, memberData);
  return response.data;
};

export const deleteMember = async (id) => {
  const response = await api.delete(`/members/${id}`);
  return response.data;
};

// Teams
export const getTeams = async () => {
  const response = await api.get('/teams');
  return response.data;
};

export const getTeamById = async (id) => {
  const response = await api.get(`/teams/${id}`);
  return response.data;
};

export const createTeam = async (teamData) => {
  const response = await api.post('/teams', teamData);
  return response.data;
};

export const updateTeam = async (id, teamData) => {
  const response = await api.put(`/teams/${id}`, teamData);
  return response.data;
};

export const deleteTeam = async (id) => {
  const response = await api.delete(`/teams/${id}`);
  return response.data;
};

// Authentication
export const login = async (credentials) => {
  try{
  const response = await api.post('/auth/login', credentials);
  const { token, user } = response.data;

  // Store token in localStorage
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));

  return response.data;
}catch (error) {
  throw error;
}
};

export const register = async (userData) => {
  const response = await api.post('/auth/register', userData);
  return response.data;
};

export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = '/login';
};

export const isAuthenticated = () => {
  return localStorage.getItem('token') !== null;
};
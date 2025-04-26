// Updated services/api.js
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
      // Make sure we're using the correct format for Authorization header
      config.headers.Authorization = `Bearer ${token}`;
      console.log('Adding token to request:', config.url);
    } else {
      console.log('No token found in localStorage');
    }
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      console.log('Authentication error - redirecting to login');
      // Clear any stored tokens
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Redirect to login page
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// User & Auth
export const getUsers = async (params = {}) => {
  const response = await api.get('/users', { params });
  return response.data;
};

export const getUserById = async (id) => {
  const response = await api.get(`/users/${id}`);
  return response.data;
};

export const createUser = async (userData) => {
  const response = await api.post('/users', userData);
  return response.data;
};

export const updateUser = async (id, userData) => {
  const response = await api.put(`/users/${id}`, userData);
  return response.data;
};

export const deleteUser = async (id) => {
  const response = await api.delete(`/users/${id}`);
  return response.data;
};

export const registerUserByAdmin = async (userData) => {
  try {
    // Use the admin-only endpoint
    const response = await api.post('/auth/admin/register', userData);
    return response.data;
  } catch (error) {
    console.error('Admin registration error:', error);
    throw error;
  }
};

export const login = async (credentials) => {
  try {
    console.log('Attempting login with:', credentials.email);
    const response = await api.post('/auth/login', credentials);
    const { token, user } = response.data;

    console.log('Login successful, storing token and user data');

    // Store token and user info (including admin status) in localStorage
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));

    return response.data;
  } catch (error) {
    console.error('Login error:', error);
    if (error.response) {
      console.error('Server response:', error.response.data);
    }
    throw error;
  }
};

export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = '/login';
};

export const isAuthenticated = () => {
  return localStorage.getItem('token') !== null;
};

export const isAdmin = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  return user.is_admin === true;
};

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



export const updateTaskStatus = async (id, status) => {
  const response = await api.patch(`/tasks/${id}/status`, { status });
  return response.data;
};

export const updateTask = async (id, taskData) => {
  try {
    const response = await api.put(`/tasks/${id}`, taskData);
    return response.data;
  } catch (error) {
    console.error(`Error updating task ${id}:`, error);
    console.error('Request payload:', taskData);
    throw error;
  }
};

// Updated deleteTask method with better error handling
export const deleteTask = async (id) => {
  try {
    const response = await api.delete(`/tasks/${id}`);
    return response.data;
  } catch (error) {
    // Check if this is a 404 error, which might mean the task was already deleted
    if (error.response && error.response.status === 404) {
      console.warn(`Task ${id} not found - may have been already deleted`);
      // Return a success response anyway, as the task is gone
      return { success: true, message: "Task already deleted" };
    }
    console.error(`Error deleting task ${id}:`, error);
    throw error;
  }
};
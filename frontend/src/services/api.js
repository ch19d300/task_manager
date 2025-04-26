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
  try {
    const response = await api.get('/members');
    return response.data;
  } catch (error) {
    console.error('Error fetching members:', error);
    throw error;
  }
};

export const getMemberById = async (id) => {
  try {
    const response = await api.get(`/members/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching member ${id}:`, error);
    throw error;
  }
};

export const createMember = async (memberData) => {
  try {
    // Explicitly format the data exactly as FastAPI expects it
    const formattedData = {
      name: memberData.name,
      email: memberData.email,
      role: memberData.role || undefined // Use undefined instead of null or empty string
    };

    const response = await api.post('/members', formattedData);
    return response.data;
  } catch (error) {
    console.error('Error creating member:', error);
    console.error('Request payload:', memberData);
    throw error;
  }
};

export const updateMember = async (id, memberData) => {
  try {
    // Explicitly format the data exactly as FastAPI expects it
    const formattedData = {};

    // Only include properties that are actually provided
    if (memberData.name !== undefined) formattedData.name = memberData.name;
    if (memberData.email !== undefined) formattedData.email = memberData.email;
    if (memberData.role !== undefined) formattedData.role = memberData.role;

    const response = await api.put(`/members/${id}`, formattedData);
    return response.data;
  } catch (error) {
    console.error(`Error updating member ${id}:`, error);
    console.error('Request payload:', memberData);
    throw error;
  }
};

export const deleteMember = async (id) => {
  try {
    const response = await api.delete(`/members/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error deleting member ${id}:`, error);
    throw error;
  }
};

// Authentication
export const login = async (credentials) => {
  try {
    console.log('Attempting login with:', credentials.email);
    const response = await api.post('/auth/login', credentials);
    const { token, user } = response.data;

    console.log('Login successful, storing token and user data');

    // Store token in localStorage
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

export const register = async (userData) => {
  try {
    // Use the correct endpoint path without api/ prefix since it's already in the baseURL
    const response = await api.post('/auth/register', userData);
    return response.data;
  } catch (error) {
    console.error('Registration error:', error);
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
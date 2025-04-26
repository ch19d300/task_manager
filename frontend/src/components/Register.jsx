// Register.jsx
import React, { useState } from 'react';
import { Form, Input, Button, Card, Alert, Typography } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined } from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';

const { Title } = Typography;

const Register = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (values) => {
    try {
      setLoading(true);
      setError('');
      
      // For demo, just simulate a successful registration
      console.log('Registration values:', values);
      
      // Show success and redirect to login
      setTimeout(() => {
        setLoading(false);
        navigate('/login');
      }, 1500);
      
      // In a real app, you would call your API:
      // await register(values);
      
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed. Please try again.');
      console.error('Registration error:', err);
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '100vh',
      background: '#f0f2f5'
    }}>
      <Card 
        style={{ 
          width: 400, 
          boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
          borderRadius: '8px' 
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <Title level={2}>Task Management</Title>
          <Title level={4}>Create an Account</Title>
        </div>
        
        {error && (
          <Alert
            message="Registration Error"
            description={error}
            type="error"
            showIcon
            style={{ marginBottom: '16px' }}
          />
        )}
        
        <Form
          name="register"
          onFinish={handleSubmit}
          layout="vertical"
        >
          <Form.Item
            name="name"
            rules={[{ required: true, message: 'Please input your name!' }]}
          >
            <Input 
              prefix={<UserOutlined />} 
              placeholder="Full Name" 
              size="large"
            />
          </Form.Item>
          
          <Form.Item
            name="email"
            rules={[
              { required: true, message: 'Please input your email!' },
              { type: 'email', message: 'Please enter a valid email' }
            ]}
          >
            <Input 
              prefix={<MailOutlined />} 
              placeholder="Email" 
              size="large"
            />
          </Form.Item>
          
          <Form.Item
            name="password"
            rules={[
              { required: true, message: 'Please input your password!' },
              { min: 6, message: 'Password must be at least 6 characters' }
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Password"
              size="large"
            />
          </Form.Item>
          
          <Form.Item
            name="confirmPassword"
            dependencies={['password']}
            rules={[
              { required: true, message: 'Please confirm your password!' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('The two passwords do not match!'));
                },
              }),
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Confirm Password"
              size="large"
            />
          </Form.Item>
          
          <Form.Item>
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={loading}
              block
              size="large"
            >
              Register
            </Button>
          </Form.Item>
          
          <div style={{ textAlign: 'center' }}>
            <p>
              Already have an account? <Link to="/login">Login</Link>
            </p>
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default Register;
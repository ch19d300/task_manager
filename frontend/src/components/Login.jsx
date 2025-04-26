// Login.jsx
import React, { useState } from 'react';
import { Form, Input, Button, Card, Alert, Typography } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { login } from '../services/api';

const { Title } = Typography;

const Login = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

// Login.jsx - handleSubmit function modification
const handleSubmit = async (values) => {
  try {
    setLoading(true);
    setError('');

    console.log('Submitting login form:', values.email);

    // Call your API
    await login(values);

    console.log('Login successful, redirecting to home');

    // Force a page reload and redirect to home
    window.location.href = '/';
  } catch (err) {
    console.error('Login error:', err);

    let errorMessage = 'Login failed. Please try again.';

    if (err.response && err.response.data) {
      console.error('Server response:', err.response.data);
      errorMessage = err.response.data.detail || errorMessage;
    }

    setError(errorMessage);
  } finally {
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
          <Title level={4}>Admin Login</Title>
        </div>

        {error && (
          <Alert
            message="Login Error"
            description={error}
            type="error"
            showIcon
            style={{ marginBottom: '16px' }}
          />
        )}

        <Form
          name="login"
          initialValues={{ remember: true }}
          onFinish={handleSubmit}
          layout="vertical"
        >
          <Form.Item
            name="email"
            rules={[
              { required: true, message: 'Please input your email!' },
              { type: 'email', message: 'Please enter a valid email' }
            ]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="Email"
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: 'Please input your password!' }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Password"
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
              Log in
            </Button>
          </Form.Item>

          <div style={{ textAlign: 'center' }}>
            <p>
              Don't have an account? <a href="/register">Register now</a>
            </p>
            <p style={{ marginTop: '12px', fontSize: '12px', color: '#999' }}>
              Demo credentials: admin@example.com / admin123
            </p>
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default Login;
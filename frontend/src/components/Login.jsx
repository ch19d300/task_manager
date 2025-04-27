// Enhanced Login.jsx with CRED-inspired UI
import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Card, Alert, Typography, Space } from 'antd';
import { UserOutlined, LockOutlined, DashboardOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { login } from '../services/api';

const { Title, Text } = Typography;

const Login = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const [particles, setParticles] = useState([]);
  const [glowPosition, setGlowPosition] = useState({ x: 50, y: 50 });

  // Create particle effect for background
  useEffect(() => {
    const createParticles = () => {
      const newParticles = [];
      for (let i = 0; i < 80; i++) {
        newParticles.push({
          id: i,
          x: Math.random() * 100,
          y: Math.random() * 100,
          size: Math.random() * 4 + 1,
          speed: Math.random() * 0.3 + 0.1,
          opacity: Math.random() * 0.5 + 0.2
        });
      }
      setParticles(newParticles);
    };

    createParticles();

    const interval = setInterval(() => {
      setParticles(prevParticles =>
        prevParticles.map(particle => ({
          ...particle,
          y: (particle.y + particle.speed) % 100
        }))
      );
    }, 100);

    const glowInterval = setInterval(() => {
      setGlowPosition({
        x: 30 + Math.random() * 40,
        y: 30 + Math.random() * 40
      });
    }, 3000);

    return () => {
      clearInterval(interval);
      clearInterval(glowInterval);
    };
  }, []);

  const handleSubmit = async (values) => {
    try {
      setLoading(true);
      setError('');

      // Call your API
      await login(values);

      // Force a page reload and redirect to home
      window.location.href = '/';
    } catch (err) {
      let errorMessage = 'Login failed. Please try again.';

      if (err.response && err.response.data) {
        errorMessage = err.response.data.detail || errorMessage;
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Track mouse movement for interactive glow effect
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth) * 100,
        y: (e.clientY / window.innerHeight) * 100
      });
    };

    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return (
    <div
      className="login-container"
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0A0A0A 0%, #121212 100%)',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Particles */}
      {particles.map(particle => (
        <div
          key={particle.id}
          style={{
            position: 'absolute',
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            backgroundColor: 'rgba(147, 51, 234, 0.2)',
            borderRadius: '50%',
            opacity: particle.opacity,
            filter: 'blur(1px)',
            zIndex: 1
          }}
        />
      ))}

      {/* Interactive gradient glow */}
      <div
        style={{
          position: 'absolute',
          left: `${mousePosition.x}%`,
          top: `${mousePosition.y}%`,
          transform: 'translate(-50%, -50%)',
          width: '30vw',
          height: '30vw',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(147, 51, 234, 0.15) 0%, rgba(147, 51, 234, 0) 70%)',
          transition: 'left 1s cubic-bezier(0.2, 0, 0.3, 1), top 1s cubic-bezier(0.2, 0, 0.3, 1)',
          zIndex: 1
        }}
      />

      {/* Fixed ambient glow */}
      <div
        style={{
          position: 'absolute',
          left: `${glowPosition.x}%`,
          top: `${glowPosition.y}%`,
          transform: 'translate(-50%, -50%)',
          width: '40vw',
          height: '40vw',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(79, 70, 229, 0.1) 0%, rgba(79, 70, 229, 0) 70%)',
          transition: 'left 3s cubic-bezier(0.2, 0, 0.3, 1), top 3s cubic-bezier(0.2, 0, 0.3, 1)',
          zIndex: 1
        }}
      />

      <Card
        className="login-card"
        style={{
          width: 420,
          maxWidth: '90%',
          position: 'relative',
          zIndex: 2
        }}
        bordered={false}
      >
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <Space direction="vertical" size={12}>
            <div style={{
              width: '72px',
              height: '72px',
              background: 'linear-gradient(120deg, #9333EA 0%, #4F46E5 100%)',
              borderRadius: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              boxShadow: '0 8px 20px rgba(147, 51, 234, 0.3)'
            }}>
              <DashboardOutlined style={{ fontSize: '32px', color: 'white' }} />
            </div>
            <Title level={2} style={{
              margin: 0,
              color: '#fff',
              fontWeight: 700,
              letterSpacing: '-0.5px',
              fontSize: '28px'
            }}>
              TaskMaster
            </Title>
            <Text style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '16px' }}>
              Sign in to your workspace
            </Text>
          </Space>
        </div>

        {error && (
          <Alert
            message="Login Failed"
            description={error}
            type="error"
            showIcon
            style={{
              marginBottom: '24px',
              borderRadius: '12px',
              background: 'rgba(239, 68, 68, 0.1)',
              borderColor: 'rgba(239, 68, 68, 0.2)'
            }}
          />
        )}

        <Form
          name="login"
          form={form}
          onFinish={handleSubmit}
          layout="vertical"
          autoComplete="off"
        >
          <Form.Item
            name="email"
            rules={[
              { required: true, message: 'Please enter your email' },
              { type: 'email', message: 'Please enter a valid email' }
            ]}
          >
            <Input
              prefix={<UserOutlined style={{ color: 'rgba(255, 255, 255, 0.3)', fontSize: '16px' }} />}
              placeholder="Email"
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: 'Please enter your password' }]}
          >
            <Input.Password
              prefix={<LockOutlined style={{ color: 'rgba(255, 255, 255, 0.3)', fontSize: '16px' }} />}
              placeholder="Password"
              size="large"
            />
          </Form.Item>

          <Form.Item style={{ marginTop: '36px' }}>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
              size="large"
              className="login-button"
              style={{
                height: '54px',
                fontSize: '16px',
                fontWeight: 600
              }}
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </Button>
          </Form.Item>

          <div style={{ textAlign: 'center', marginTop: '24px' }}>
            <Text style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '14px' }}>
              Contact your administrator to create an account
            </Text>
            <div
              className="pulse-animation"
              style={{
                marginTop: '24px',
                padding: '16px 20px',
                background: 'rgba(147, 51, 234, 0.08)',
                borderRadius: '12px',
                border: '1px solid rgba(147, 51, 234, 0.12)'
              }}
            >
              <Text style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '14px', display: 'block', marginBottom: '4px' }}>
                For testing:
              </Text>
              <code style={{
                background: 'rgba(147, 51, 234, 0.15)',
                padding: '6px 12px',
                borderRadius: '8px',
                color: '#9333EA',
                fontFamily: 'monospace',
                fontSize: '14px',
                letterSpacing: '0.5px'
              }}>
                admin@example.com / admin123
              </code>
            </div>
          </div>
        </Form>
      </Card>

      {/* Additional decorative elements */}
      <div style={{
        position: 'absolute',
        bottom: '20px',
        width: '100%',
        textAlign: 'center',
        fontSize: '14px',
        color: 'rgba(255, 255, 255, 0.3)',
        zIndex: 2
      }}>
        © 2025 TaskMaster • Enterprise Task Management
      </div>
    </div>
  );
};

export default Login;
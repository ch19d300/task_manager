// Fixed App.jsx Header Component
import React, { useState } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate, Link } from 'react-router-dom';
import {
  Layout,
  Menu,
  Button,
  Avatar,
  Dropdown,
  ConfigProvider,
  theme
} from 'antd';
import {
  CalendarOutlined,
  UnorderedListOutlined,
  UserOutlined,
  PlusOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  DashboardOutlined,
  SettingOutlined
} from '@ant-design/icons';

// Import components
import TaskCalendarView from './components/TaskCalendarView';
import TaskListView from './components/TaskListView';
import TaskForm from './components/TaskForm';
import UserManagement from './components/UserManagement';
import Login from './components/Login';
import { logout, isAdmin } from './services/api';

// Import CSS
import './theme/dark-theme.css';
import './theme/animations.css';
import './theme/taskmaster-styles.css';
import './theme/theme-header.css';

const { Header, Sider, Content } = Layout;

const App = () => {
  const [collapsed, setCollapsed] = useState(false);
  const isAuthenticated = !!localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userIsAdmin = user.is_admin === true;

  const handleLogout = () => {
    logout();
  };

  // Create initials for avatar
  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const userMenu = (
    <Menu className="user-dropdown-menu">
      <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)', marginBottom: '8px' }}>
        <div style={{ fontSize: '16px', fontWeight: 500, marginBottom: '4px' }}>{user.name}</div>
        <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)' }}>{user.email}</div>
      </div>
      <Menu.Item key="settings" icon={<SettingOutlined />}>
        Settings
      </Menu.Item>
      <Menu.Divider />
      <Menu.Item key="logout" icon={<LogoutOutlined />} onClick={handleLogout}>
        Logout
      </Menu.Item>
    </Menu>
  );

  // If not authenticated, render login page
  if (!isAuthenticated) {
    return (
      <ConfigProvider
        theme={{
          algorithm: theme.darkAlgorithm,
          token: {
            colorPrimary: '#9333EA',
            borderRadius: 12,
          },
        }}
      >
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </Router>
      </ConfigProvider>
    );
  }

  return (
    <ConfigProvider
      theme={{
        algorithm: theme.darkAlgorithm,
        token: {
          colorPrimary: '#9333EA',
          borderRadius: 12,
        },
      }}
    >
      <Router>
        <Layout
          style={{
            minHeight: '100vh',
            background: '#0A0A0A'
          }}
        >
          <Sider
            trigger={null}
            collapsible
            collapsed={collapsed}
            width={280}
            className="app-sider"
            style={{
              overflow: 'auto',
              position: 'fixed',
              left: 0,
              top: 0,
              bottom: 0,
              zIndex: 10
            }}
          >
            <div className="logo" style={{ height: '72px', padding: '16px', textAlign: 'center' }}>
              {collapsed ? (
                <DashboardOutlined className="gradient-text" style={{ fontSize: '28px' }} />
              ) : (
                <h1 className="gradient-text" style={{ margin: 0, fontSize: '24px' }}>
                  TaskMaster
                </h1>
              )}
            </div>

            <Menu
              theme="dark"
              mode="inline"
              defaultSelectedKeys={['1']}
              className="app-menu"
              style={{ background: 'transparent', border: 'none', padding: '0 12px' }}
            >
              <Menu.Item key="1" icon={<CalendarOutlined />} className="menu-item">
                <Link to="/">Calendar View</Link>
              </Menu.Item>
              <Menu.Item key="2" icon={<UnorderedListOutlined />} className="menu-item">
                <Link to="/list">List View</Link>
              </Menu.Item>

              {userIsAdmin && (
                <>
                  <Menu.Item key="3" icon={<PlusOutlined />} className="menu-item">
                    <Link to="/create">Create Task</Link>
                  </Menu.Item>
                  <Menu.Divider />
                  <Menu.Item key="4" icon={<UserOutlined />} className="menu-item">
                    <Link to="/users">User Management</Link>
                  </Menu.Item>
                </>
              )}
            </Menu>
          </Sider>

          <Layout style={{
            marginLeft: collapsed ? 80 : 280,
            transition: 'margin-left 0.3s cubic-bezier(0.2, 0, 0, 1)'
          }}>
            <Header
              className="site-header"
              style={{
                padding: '0 24px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                position: 'sticky',
                top: 0,
                zIndex: 9,
                height: '64px'
              }}
            >
              <Button
                type="text"
                icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                onClick={() => setCollapsed(!collapsed)}
                className="trigger-button"
                style={{ fontSize: '18px' }}
              />

              <div style={{ marginLeft: 'auto' }}>
                <Dropdown overlay={userMenu} placement="bottomRight" trigger={['click']}>
                  <Button
                    type="text"
                    style={{
                      height: '40px',
                      display: 'flex',
                      alignItems: 'center',
                      padding: '0 8px',
                      borderRadius: '12px',
                      background: 'rgba(255, 255, 255, 0.03)'
                    }}
                  >
                    <Avatar
                      className="user-avatar"
                      style={{
                        marginRight: '8px'
                      }}
                    >
                      {getInitials(user.name)}
                    </Avatar>
                    <span style={{ fontSize: '14px' }}>
                      {userIsAdmin ? 'Admin' : 'User'}
                    </span>
                  </Button>
                </Dropdown>
              </div>
            </Header>

            <Content
              className="site-content"
              style={{
                minHeight: 'calc(100vh - 64px)'
              }}
            >
              <Routes>
                <Route path="/" element={<TaskCalendarView />} />
                <Route path="/list" element={<TaskListView />} />

                {/* Admin-only routes */}
                {userIsAdmin ? (
                  <>
                    <Route path="/create" element={<TaskForm />} />
                    <Route path="/users" element={<UserManagement />} />
                  </>
                ) : null}

                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Content>
          </Layout>
        </Layout>
      </Router>
    </ConfigProvider>
  );
};

export default App;
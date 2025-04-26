// App.jsx
import React, { useState } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate, Link } from 'react-router-dom';
import { Layout, Menu, Button, Avatar, Dropdown } from 'antd';
import {
  CalendarOutlined,
  UnorderedListOutlined,
  UserOutlined,
  TeamOutlined,
  PlusOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined
} from '@ant-design/icons';

// Import components
import TaskCalendarView from './components/TaskCalendarView';
import TaskListView from './components/TaskListView';
import TaskForm from './components/TaskForm';
import MemberManagement from './components/MemberManagement';
import TeamManagement from './components/TeamManagement';
import Login from './components/Login';
import Register from './components/Register';
import { logout } from './services/api';

const { Header, Sider, Content } = Layout;

const App = () => {
  const [collapsed, setCollapsed] = useState(false);
  const isAuthenticated = !!localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  const userMenu = (
    <Menu>
      <Menu.Item key="profile" icon={<UserOutlined />}>
        Profile
      </Menu.Item>
      <Menu.Item key="logout" icon={<LogoutOutlined />} onClick={handleLogout}>
        Logout
      </Menu.Item>
    </Menu>
  );

  // If not authenticated, render login/register page
  if (!isAuthenticated) {
    return (
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    );
  }

  return (
    <Router>
      <Layout style={{ minHeight: '100vh' }}>
        <Sider trigger={null} collapsible collapsed={collapsed} width={240}>
          <div className="logo" style={{ height: '64px', padding: '16px', textAlign: 'center' }}>
            <h1 style={{ color: 'white', margin: 0, fontSize: collapsed ? '16px' : '20px' }}>
              {collapsed ? 'TM' : 'Task Manager'}
            </h1>
          </div>
          <Menu
            theme="dark"
            mode="inline"
            defaultSelectedKeys={['1']}
          >
            <Menu.Item key="1" icon={<CalendarOutlined />}>
              <Link to="/">Calendar View</Link>
            </Menu.Item>
            <Menu.Item key="2" icon={<UnorderedListOutlined />}>
              <Link to="/list">List View</Link>
            </Menu.Item>
            <Menu.Item key="3" icon={<PlusOutlined />}>
              <Link to="/create">Create Task</Link>
            </Menu.Item>
            <Menu.Divider />
            <Menu.Item key="4" icon={<UserOutlined />}>
              <Link to="/members">Members</Link>
            </Menu.Item>
            <Menu.Item key="5" icon={<TeamOutlined />}>
              <Link to="/teams">Teams</Link>
            </Menu.Item>
          </Menu>
        </Sider>
        <Layout className="site-layout">
          <Header
            className="site-layout-background"
            style={{
              padding: 0,
              background: '#fff',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              style={{ fontSize: '16px', marginLeft: '16px' }}
            />
            <div style={{ marginRight: '16px' }}>
              <Dropdown overlay={userMenu} placement="bottomRight">
                <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                  <span style={{ marginRight: '8px' }}>{user.name}</span>
                  <Avatar icon={<UserOutlined />} />
                </div>
              </Dropdown>
            </div>
          </Header>
          <Content
            style={{
              margin: '24px 16px',
              padding: 24,
              background: '#fff',
              minHeight: 280,
              overflow: 'auto'
            }}
          >
            <Routes>
              <Route path="/" element={<TaskCalendarView />} />
              <Route path="/list" element={<TaskListView />} />
              <Route path="/create" element={<TaskForm />} />
              <Route path="/members" element={<MemberManagement />} />
              <Route path="/teams" element={<TeamManagement />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Content>
        </Layout>
      </Layout>
    </Router>
  );
};

export default App;
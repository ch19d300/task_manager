// UserManagement.jsx (Replaces MemberManagement.jsx)
import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Popconfirm,
  message,
  Switch,
  Tooltip
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  UserAddOutlined,
  LockOutlined
} from '@ant-design/icons';
import {
  registerUserByAdmin,
  getUsers,
  updateUser,
  deleteUser
} from '../services/api';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [form] = Form.useForm();
  const [editingUserId, setEditingUserId] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const usersData = await getUsers();
      setUsers(usersData);
    } catch (error) {
      message.error('Failed to load users');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const showCreateModal = () => {
    setModalTitle('Create New User');
    setEditingUserId(null);
    form.resetFields();
    form.setFieldsValue({
      is_admin: false
    });
    setModalVisible(true);
  };

  const showEditModal = (user) => {
    setModalTitle('Edit User');
    setEditingUserId(user.id);
    form.setFieldsValue({
      name: user.name,
      email: user.email,
      is_admin: user.is_admin
    });
    setModalVisible(true);
  };

  const handleModalCancel = () => {
    setModalVisible(false);
  };

  const handleModalSubmit = async () => {
    try {
      const values = await form.validateFields();

      if (editingUserId) {
        // When editing, we don't update password
        const userData = {
          name: values.name,
          email: values.email,
          is_admin: values.is_admin
        };

        await updateUser(editingUserId, userData);
        message.success('User updated successfully');
      } else {
        // For new users, include password
        const userData = {
          name: values.name,
          email: values.email,
          password: values.password,
          is_admin: values.is_admin
        };

        await registerUserByAdmin(userData);
        message.success('User created successfully');
      }

      setModalVisible(false);
      fetchData();
    } catch (error) {
      console.error('Error details:', error);

      if (error.response) {
        console.error('Server error response:', error.response.data);

        if (error.response.status === 422 && error.response.data.detail) {
          const errorDetails = error.response.data.detail;
          const errorMessages = errorDetails.map(err => {
            const field = err.loc[err.loc.length - 1];
            return `${field}: ${err.msg}`;
          }).join(', ');
          message.error(`Validation error: ${errorMessages}`);
        } else {
          message.error(`Error: ${error.response.data.detail || JSON.stringify(error.response.data)}`);
        }
      } else if (error.request) {
        message.error('Server did not respond. Please try again.');
      } else {
        message.error('Error saving user');
      }
    }
  };

  const handleDelete = async (userId) => {
    try {
      await deleteUser(userId);
      message.success('User deleted successfully');
      fetchData();
    } catch (error) {
      message.error('Error deleting user');
      console.error(error);
    }
  };

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Admin',
      dataIndex: 'is_admin',
      key: 'is_admin',
      render: (isAdmin) => (
        isAdmin ? 'Yes' : 'No'
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <div>
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => showEditModal(record)}
            style={{ marginRight: '8px' }}
          />
          <Popconfirm
            title="Are you sure you want to delete this user?"
            onConfirm={() => handleDelete(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
            />
          </Popconfirm>
        </div>
      ),
    },
  ];

  return (
    <div className="user-management">
      <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>User Management</h2>
        <Button
          type="primary"
          icon={<UserAddOutlined />}
          onClick={showCreateModal}
        >
          Add User
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={users}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title={modalTitle}
        open={modalVisible}
        onCancel={handleModalCancel}
        onOk={handleModalSubmit}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
        >
          <Form.Item
            name="name"
            label="Name"
            rules={[{ required: true, message: 'Please enter name' }]}
          >
            <Input placeholder="Enter name" />
          </Form.Item>

          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: 'Please enter email' },
              { type: 'email', message: 'Please enter a valid email' }
            ]}
          >
            <Input placeholder="Enter email" />
          </Form.Item>

          {!editingUserId && (
            <Form.Item
              name="password"
              label="Password"
              rules={[
                { required: true, message: 'Please enter password' },
                { min: 6, message: 'Password must be at least 6 characters' }
              ]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="Enter password"
              />
            </Form.Item>
          )}

          <Form.Item
            name="is_admin"
            label="Admin Access"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default UserManagement;
// MemberManagement.jsx
import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  Popconfirm,
  message
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  UserAddOutlined
} from '@ant-design/icons';
import {
  getMembers,
  createMember,
  updateMember,
  deleteMember,
  getTeams
} from '../services/api';

const { Option } = Select;

const MemberManagement = () => {
  const [members, setMembers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [form] = Form.useForm();
  const [editingMemberId, setEditingMemberId] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [membersData, teamsData] = await Promise.all([
        getMembers(),
        getTeams()
      ]);
      setMembers(membersData);
      setTeams(teamsData);
    } catch (error) {
      message.error('Failed to load data');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const showCreateModal = () => {
    setModalTitle('Create New Member');
    setEditingMemberId(null);
    form.resetFields();
    setModalVisible(true);
  };

  const showEditModal = (member) => {
    setModalTitle('Edit Member');
    setEditingMemberId(member.id);
    form.setFieldsValue({
      name: member.name,
      email: member.email,
      teamId: member.teamId,
      role: member.role
    });
    setModalVisible(true);
  };

  const handleModalCancel = () => {
    setModalVisible(false);
  };

  const handleModalSubmit = async () => {
    try {
      const values = await form.validateFields();

      if (editingMemberId) {
        await updateMember(editingMemberId, values);
        message.success('Member updated successfully');
      } else {
        await createMember(values);
        message.success('Member created successfully');
      }

      setModalVisible(false);
      fetchData();
    } catch (error) {
      message.error('Error saving member');
      console.error(error);
    }
  };

  const handleDelete = async (memberId) => {
    try {
      await deleteMember(memberId);
      message.success('Member deleted successfully');
      fetchData();
    } catch (error) {
      message.error('Error deleting member');
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
      title: 'Team',
      dataIndex: 'team',
      key: 'team',
      render: team => team?.name || 'N/A',
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
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
            title="Are you sure you want to delete this member?"
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
    <div className="member-management">
      <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          type="primary"
          icon={<UserAddOutlined />}
          onClick={showCreateModal}
        >
          Add Member
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={members}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title={modalTitle}
        visible={modalVisible}
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

          <Form.Item
            name="teamId"
            label="Team"
          >
            <Select placeholder="Select team" allowClear>
              {teams.map(team => (
                <Option key={team.id} value={team.id}>{team.name}</Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="role"
            label="Role"
          >
            <Input placeholder="Enter role" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default MemberManagement;
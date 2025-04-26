// Enhanced TaskListView.jsx with edit options
import React, { useState, useEffect } from 'react';
import {
  Table,
  Tag,
  Space,
  Button,
  Select,
  DatePicker,
  Input,
  message,
  Typography,
  Modal,
  Form,
  Popconfirm
} from 'antd';
import {
  EditOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  SearchOutlined
} from '@ant-design/icons';
import { getTasks, updateTaskStatus, deleteTask, getUsers, isAdmin, updateTask } from '../services/api';
import moment from 'moment';
import { useNavigate } from 'react-router-dom';

const { Option } = Select;
const { RangePicker } = DatePicker;
const { Title } = Typography;
const { TextArea } = Input;

const TaskListView = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [filters, setFilters] = useState({
    assignee_id: null,
    status: null,
    dateRange: null,
    search: ''
  });
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [editForm] = Form.useForm();
  const [deleteLoading, setDeleteLoading] = useState(false);

  const navigate = useNavigate();
  const userIsAdmin = isAdmin();
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    // Only admins need to fetch users for filtering
    if (userIsAdmin) {
      const fetchUsersData = async () => {
        try {
          const usersData = await getUsers();
          setUsers(usersData);
        } catch (error) {
          message.error('Failed to load users data');
          console.error(error);
        }
      };

      fetchUsersData();
    }
  }, [userIsAdmin]);

  useEffect(() => {
    fetchTasks();
  }, [filters]);

  const fetchTasks = async () => {
    try {
      setLoading(true);

      const queryParams = {};

      if (filters.assignee_id) {
        queryParams.assignee_id = filters.assignee_id;
      }

      if (filters.status) {
        queryParams.status = filters.status;
      }

      if (filters.dateRange) {
        queryParams.start_date = filters.dateRange[0].format('YYYY-MM-DD');
        queryParams.end_date = filters.dateRange[1].format('YYYY-MM-DD');
      }

      if (filters.search) {
        queryParams.search = filters.search;
      }

      const tasksData = await getTasks(queryParams);
      setTasks(tasksData);
    } catch (error) {
      message.error('Failed to load tasks');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (filterType, value) => {
    setFilters(prevFilters => ({
      ...prevFilters,
      [filterType]: value
    }));
  };

  const handleUpdateStatus = async (taskId, newStatus) => {
    try {
      await updateTaskStatus(taskId, newStatus);
      message.success('Task status updated');
      fetchTasks();
    } catch (error) {
      message.error('Failed to update task status');
      console.error(error);
    }
  };

  const handleDeleteTask = async (taskId) => {
    try {
      setDeleteLoading(true);
      await deleteTask(taskId);
      message.success('Task deleted successfully');

      // Remove the deleted task from the state directly
      setTasks(tasks.filter(task => task.id !== taskId));
    } catch (error) {
      message.error('Failed to delete task');
      console.error(error);
    } finally {
      setDeleteLoading(false);
    }
  };

  const showEditModal = (task) => {
    setEditingTask(task);
    editForm.setFieldsValue({
      title: task.title,
      description: task.description,
      priority: task.priority,
      status: task.status,
      assignee_id: task.assignee.id,
      dateRange: [moment(task.start_date), moment(task.end_date)]
    });
    setEditModalVisible(true);
  };

  const handleEditCancel = () => {
    setEditModalVisible(false);
    setEditingTask(null);
  };

  const handleEditSubmit = async () => {
    try {
      const values = await editForm.validateFields();

      const updatedTask = {
        title: values.title,
        description: values.description,
        priority: values.priority,
        status: values.status,
        assignee_id: values.assignee_id,
        start_date: values.dateRange[0].format('YYYY-MM-DD'),
        end_date: values.dateRange[1].format('YYYY-MM-DD')
      };

      await updateTask(editingTask.id, updatedTask);
      message.success('Task updated successfully');
      setEditModalVisible(false);
      fetchTasks();
    } catch (error) {
      message.error('Failed to update task');
      console.error(error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'default';
      case 'in_progress':
        return 'processing';
      case 'completed':
        return 'success';
      case 'overdue':
        return 'error';
      default:
        return 'default';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'red';
      case 'medium':
        return 'orange';
      case 'low':
        return 'green';
      default:
        return 'blue';
    }
  };

  const columns = [
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
      sorter: (a, b) => a.title.localeCompare(b.title),
    },
    {
      title: 'Assigned To',
      dataIndex: 'assignee',
      key: 'assignee',
      render: assignee => assignee.name,
      sorter: (a, b) => a.assignee.name.localeCompare(b.assignee.name),
    },
    {
      title: 'Start Date',
      dataIndex: 'start_date',
      key: 'start_date',
      render: date => moment(date).format('YYYY-MM-DD'),
      sorter: (a, b) => moment(a.start_date).unix() - moment(b.start_date).unix(),
    },
    {
      title: 'End Date',
      dataIndex: 'end_date',
      key: 'end_date',
      render: date => moment(date).format('YYYY-MM-DD'),
      sorter: (a, b) => moment(a.end_date).unix() - moment(b.end_date).unix(),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: status => (
        <Tag color={getStatusColor(status)}>
          {status.replace('_', ' ').toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      render: priority => (
        <Tag color={getPriorityColor(priority)}>
          {priority.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space size="small">
          {/* Mark as Complete button */}
          <Button
            type="text"
            icon={<CheckCircleOutlined />}
            onClick={() => handleUpdateStatus(record.id, 'completed')}
            disabled={record.status === 'completed'}
            title="Mark as Complete"
          />

          {/* Edit button */}
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => showEditModal(record)}
            title="Edit Task"
          />

          {/* Delete button (admin only) */}
          {userIsAdmin && (
            <Popconfirm
              title="Are you sure you want to delete this task?"
              onConfirm={() => handleDeleteTask(record.id)}
              okText="Yes"
              cancelText="No"
            >
              <Button
                type="text"
                danger
                icon={<DeleteOutlined />}
                loading={deleteLoading && editingTask?.id === record.id}
                title="Delete Task"
              />
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div className="task-list-view">
      <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={2}>Task List</Title>
        {userIsAdmin && (
          <Button type="primary" onClick={() => navigate('/create')}>
            Create New Task
          </Button>
        )}
      </div>

      <div className="filters" style={{ marginBottom: '20px', display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
        <Input
          placeholder="Search tasks"
          prefix={<SearchOutlined />}
          style={{ width: 200 }}
          onChange={(e) => handleFilterChange('search', e.target.value)}
          allowClear
        />

        {userIsAdmin && (
          <Select
            allowClear
            style={{ width: 200 }}
            placeholder="Filter by User"
            onChange={(value) => handleFilterChange('assignee_id', value)}
          >
            {users.map(user => (
              <Option key={user.id} value={user.id}>{user.name}</Option>
            ))}
          </Select>
        )}

        <Select
          allowClear
          style={{ width: 200 }}
          placeholder="Filter by Status"
          onChange={(value) => handleFilterChange('status', value)}
        >
          <Option value="pending">Pending</Option>
          <Option value="in_progress">In Progress</Option>
          <Option value="completed">Completed</Option>
          <Option value="overdue">Overdue</Option>
        </Select>

        <RangePicker
          style={{ width: 300 }}
          onChange={(dates) => handleFilterChange('dateRange', dates)}
          placeholder={['Start Date', 'End Date']}
        />
      </div>

      <Table
        columns={columns}
        dataSource={tasks}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
        locale={{ emptyText: userIsAdmin ? 'No tasks found. Try creating a new task!' : 'No tasks assigned to you yet.' }}
      />

      {/* Edit Task Modal */}
      <Modal
        title="Edit Task"
        open={editModalVisible}
        onCancel={handleEditCancel}
        onOk={handleEditSubmit}
        destroyOnClose
        width={600}
      >
        <Form
          form={editForm}
          layout="vertical"
        >
          <Form.Item
            name="title"
            label="Task Title"
            rules={[{ required: true, message: 'Please enter task title' }]}
          >
            <Input placeholder="Enter task title" />
          </Form.Item>

          <Form.Item
            name="description"
            label="Description"
          >
            <TextArea rows={4} placeholder="Task description" />
          </Form.Item>

          <Form.Item
            name="dateRange"
            label="Start and End Date"
            rules={[{ required: true, message: 'Please select date range' }]}
          >
            <RangePicker style={{ width: '100%' }} />
          </Form.Item>

          {userIsAdmin && (
            <Form.Item
              name="assignee_id"
              label="Assign To"
              rules={[{ required: true, message: 'Please select a user to assign this task' }]}
            >
              <Select
                placeholder="Select user"
                style={{ width: '100%' }}
              >
                {users.map(user => (
                  <Option key={user.id} value={user.id}>
                    {user.name} {user.is_admin ? '(Admin)' : ''}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          )}

          <Form.Item
            name="priority"
            label="Priority"
          >
            <Select placeholder="Select priority">
              <Option value="low">Low</Option>
              <Option value="medium">Medium</Option>
              <Option value="high">High</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="status"
            label="Status"
          >
            <Select placeholder="Select status">
              <Option value="pending">Pending</Option>
              <Option value="in_progress">In Progress</Option>
              <Option value="completed">Completed</Option>
              <Option value="overdue">Overdue</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default TaskListView;
// TaskListView with Fixed Edit Mode Population
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Table,
  Button,
  Select,
  DatePicker,
  Input,
  message,
  Typography,
  Card,
  Row,
  Col,
  Space,
  Avatar,
  Tag,
  Segmented,
  Empty,
  Tooltip,
  Popconfirm,
  Modal,
  Form
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  AppstoreOutlined,
  UnorderedListOutlined,
  EditOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  InfoCircleOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  SaveOutlined,
  CloseOutlined
} from '@ant-design/icons';
import { getTasks, updateTaskStatus, deleteTask, getUsers, isAdmin, updateTask } from '../services/api';
import moment from 'moment';

const { Option } = Select;
const { RangePicker } = DatePicker;
const { Title, Text } = Typography;
const { TextArea } = Input;

const TaskListView = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [filters, setFilters] = useState({
    assignee_id: null,
    status: null,
    search: '',
    sortBy: 'due_date'
  });
  const [viewMode, setViewMode] = useState('card'); // 'card' or 'table'
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [currentTask, setCurrentTask] = useState(null);
  const [form] = Form.useForm();

  const navigate = useNavigate();
  const userIsAdmin = isAdmin();

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

      if (filters.search) {
        queryParams.search = filters.search;
      }

      const tasksData = await getTasks(queryParams);

      // Sort tasks
      const sortedTasks = sortTasks(tasksData, filters.sortBy);
      setTasks(sortedTasks);
    } catch (error) {
      message.error('Failed to load tasks');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const sortTasks = (tasksToSort, sortKey) => {
    const sortedTasks = [...tasksToSort];

    switch (sortKey) {
      case 'due_date':
        return sortedTasks.sort((a, b) => moment(a.end_date).diff(moment(b.end_date)));
      case 'priority':
        const priorityWeight = { high: 3, medium: 2, low: 1 };
        return sortedTasks.sort((a, b) => priorityWeight[b.priority] - priorityWeight[a.priority]);
      case 'status':
        const statusWeight = { overdue: 4, pending: 3, in_progress: 2, completed: 1 };
        return sortedTasks.sort((a, b) => statusWeight[b.status] - statusWeight[a.status]);
      case 'title':
        return sortedTasks.sort((a, b) => a.title.localeCompare(b.title));
      default:
        return sortedTasks;
    }
  };

  const handleFilterChange = (filterType, value) => {
    setFilters(prevFilters => ({
      ...prevFilters,
      [filterType]: value
    }));
  };

  const resetFilters = () => {
    setFilters({
      assignee_id: null,
      status: null,
      search: '',
      sortBy: 'due_date'
    });
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

  // Improved delete task function with better error handling
  const handleDeleteTask = async (taskId) => {
    try {
      await deleteTask(taskId);
      message.success('Task deleted successfully');
      fetchTasks(); // Refresh the task list
    } catch (error) {
      message.error('Failed to delete task');
      console.error('Delete error:', error);
    }
  };

  // Properly populate the edit form with task data
  const handleEditTask = (task) => {
    setCurrentTask(task);

    // Important: Set the form values AFTER setting the currentTask
    // Use a slight delay to ensure the modal has been rendered
    setTimeout(() => {
      form.setFieldsValue({
        title: task.title,
        description: task.description || '',
        status: task.status,
        priority: task.priority,
        assignee_id: task.assignee_id,
        dateRange: [
          moment(task.start_date),
          moment(task.end_date)
        ]
      });
    }, 100);

    setEditModalVisible(true);
  };

  const handleEditCancel = () => {
    setEditModalVisible(false);
    setCurrentTask(null);
    form.resetFields();
  };

  const handleEditSubmit = async () => {
    try {
      const values = await form.validateFields();

      if (!currentTask) return;

      const taskData = {
        title: values.title,
        description: values.description,
        status: values.status,
        priority: values.priority,
        assignee_id: values.assignee_id,
        start_date: values.dateRange[0].format('YYYY-MM-DD'),
        end_date: values.dateRange[1].format('YYYY-MM-DD')
      };

      await updateTask(currentTask.id, taskData);
      message.success('Task updated successfully');
      setEditModalVisible(false);
      fetchTasks(); // Refresh task list
    } catch (error) {
      message.error('Failed to update task');
      console.error('Update error:', error);
    }
  };

  // Helper functions for styling
  const getPriorityClass = (priority) => {
    switch (priority) {
      case 'high':
        return 'priority-high';
      case 'medium':
        return 'priority-medium';
      case 'low':
        return 'priority-low';
      default:
        return '';
    }
  };

  const getStatusClass = (status) => {
    return `status-${status.replace('_', '-')}`;
  };

  // Render a single task card
  const renderTaskCard = (task) => {
    return (
      <Card
        className="task-card"
        bordered={false}
      >
        <div className="card-header">
          <Text strong style={{ fontSize: '18px', flex: 1 }}>
            {task.title}
          </Text>
          <Tag
            className={getPriorityClass(task.priority)}
          >
            {task.priority}
          </Tag>
        </div>

        {task.description && (
          <Text
            type="secondary"
            style={{
              display: 'block',
              marginBottom: '16px',
              fontSize: '14px'
            }}
            ellipsis={{ rows: 2 }}
          >
            {task.description}
          </Text>
        )}

        {/* Assignment info */}
        <div className="card-meta-item">
          <Text type="secondary" style={{ fontSize: '13px', display: 'block', marginBottom: '4px' }}>
            Assigned to:
          </Text>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Avatar
              style={{ marginRight: '8px' }}
            >
              {task.assignee?.name?.charAt(0)?.toUpperCase() || 'U'}
            </Avatar>
            <Text>{task.assignee?.name || 'Unassigned'}</Text>
          </div>
        </div>

        {/* Timeline */}
        <div className="card-meta-item">
          <Text type="secondary" style={{ fontSize: '13px', display: 'block', marginBottom: '4px' }}>
            Timeline:
          </Text>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <CalendarOutlined style={{ marginRight: '8px', color: '#3B82F6' }} />
            <Text>{moment(task.start_date).format('MMM D')} - {moment(task.end_date).format('MMM D, YYYY')}</Text>
          </div>
        </div>

        {/* Status */}
        <div style={{ marginBottom: '16px' }}>
          <div
            className={getStatusClass(task.status)}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <ClockCircleOutlined />
            <Text style={{ textTransform: 'capitalize' }}>
              {task.status.replace('_', ' ')}
            </Text>
          </div>
        </div>

        {/* Actions */}
        <div className="card-footer">
          {task.status !== 'completed' && (
            <Tooltip title="Mark Complete">
              <Button
                type="primary"
                className="status-completed"
                icon={<CheckCircleOutlined />}
                shape="circle"
                onClick={() => handleUpdateStatus(task.id, 'completed')}
              />
            </Tooltip>
          )}

          <Tooltip title="Edit">
            <Button
              type="primary"
              icon={<EditOutlined />}
              shape="circle"
              onClick={() => handleEditTask(task)}
            />
          </Tooltip>

          {userIsAdmin && (
            <Popconfirm
              title="Are you sure you want to delete this task?"
              onConfirm={() => handleDeleteTask(task.id)}
              okText="Yes"
              cancelText="No"
            >
              <Button
                type="primary"
                danger
                icon={<DeleteOutlined />}
                shape="circle"
              />
            </Popconfirm>
          )}
        </div>
      </Card>
    );
  };

  // Table columns for list view
  const columns = [
    {
      title: 'Task',
      dataIndex: 'title',
      key: 'title',
      render: (text, record) => (
        <div style={{ maxWidth: '300px' }}>
          <Text strong style={{ fontSize: '15px', display: 'block' }}>{text}</Text>
          {record.description && (
            <Text type="secondary" ellipsis={{ rows: 1 }} style={{ fontSize: '13px' }}>
              {record.description}
            </Text>
          )}
        </div>
      ),
      sorter: (a, b) => a.title.localeCompare(b.title),
    },
    {
      title: 'Assigned To',
      dataIndex: 'assignee',
      key: 'assignee',
      render: assignee => (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Avatar
            style={{ marginRight: '8px' }}
          >
            {assignee?.name?.charAt(0)?.toUpperCase() || 'U'}
          </Avatar>
          <span>{assignee?.name || 'Unassigned'}</span>
        </div>
      ),
      sorter: (a, b) => (a.assignee?.name || '').localeCompare(b.assignee?.name || ''),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: status => (
        <Tag
          className={`status-${status.replace('_', '-')}`}
          style={{ textTransform: 'capitalize' }}
        >
          {status.replace('_', ' ')}
        </Tag>
      ),
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      render: priority => (
        <Tag
          className={getPriorityClass(priority)}
        >
          {priority}
        </Tag>
      ),
    },
    {
      title: 'Timeline',
      key: 'timeline',
      render: (_, record) => (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <CalendarOutlined style={{ marginRight: '8px', color: '#3B82F6' }} />
          <span>
            {moment(record.start_date).format('MMM D')} - {moment(record.end_date).format('MMM D, YYYY')}
          </span>
        </div>
      ),
      sorter: (a, b) => moment(a.end_date).unix() - moment(b.end_date).unix(),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space size="small">
          {record.status !== 'completed' && (
            <Tooltip title="Mark Complete">
              <Button
                type="primary"
                icon={<CheckCircleOutlined />}
                size="small"
                className="status-completed"
                onClick={() => handleUpdateStatus(record.id, 'completed')}
              />
            </Tooltip>
          )}

          <Tooltip title="Edit Task">
            <Button
              type="primary"
              icon={<EditOutlined />}
              size="small"
              onClick={() => handleEditTask(record)}
            />
          </Tooltip>

          {userIsAdmin && (
            <Popconfirm
              title="Are you sure you want to delete this task?"
              onConfirm={() => handleDeleteTask(record.id)}
              okText="Yes"
              cancelText="No"
            >
              <Button
                type="primary"
                danger
                icon={<DeleteOutlined />}
                size="small"
              />
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div className="task-list-view">
      <div style={{ marginBottom: '24px' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px'
        }}>
          <div>
            <Title level={2} style={{ margin: 0, fontSize: '28px' }}>
              Task Manager
            </Title>
            <Text type="secondary">
              {tasks.length} tasks • {tasks.filter(t => t.status === 'completed').length} completed
            </Text>
          </div>

          <Space>
            <Segmented
              options={[
                {
                  value: 'card',
                  icon: <AppstoreOutlined />,
                  label: 'Cards'
                },
                {
                  value: 'table',
                  icon: <UnorderedListOutlined />,
                  label: 'List'
                }
              ]}
              value={viewMode}
              onChange={setViewMode}
            />

            {userIsAdmin && (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => navigate('/create')}
                className="new-task-btn"
              >
                New Task
              </Button>
            )}
          </Space>
        </div>

        {/* Filter row */}
        <div className="filter-row">
          <div className="filter-item">
            <Input
              placeholder="Search tasks"
              prefix={<SearchOutlined style={{ color: 'rgba(255,255,255,0.3)' }} />}
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              allowClear
            />
          </div>

          <div className="filter-item">
            <Select
              placeholder="Filter by status"
              value={filters.status}
              onChange={(value) => handleFilterChange('status', value)}
              style={{ width: '100%' }}
              allowClear
            >
              <Option value="pending">Pending</Option>
              <Option value="in_progress">In Progress</Option>
              <Option value="completed">Completed</Option>
              <Option value="overdue">Overdue</Option>
            </Select>
          </div>

          {userIsAdmin && (
            <div className="filter-item">
              <Select
                placeholder="Filter by user"
                value={filters.assignee_id}
                onChange={(value) => handleFilterChange('assignee_id', value)}
                style={{ width: '100%' }}
                allowClear
              >
                {users.map(user => (
                  <Option key={user.id} value={user.id}>{user.name}</Option>
                ))}
              </Select>
            </div>
          )}

          <div className="filter-item">
            <Select
              placeholder="Sort by"
              value={filters.sortBy}
              onChange={(value) => handleFilterChange('sortBy', value)}
              style={{ width: '100%' }}
            >
              <Option value="due_date">Due Date</Option>
              <Option value="priority">Priority</Option>
              <Option value="status">Status</Option>
              <Option value="title">Title</Option>
            </Select>
          </div>

          <Button onClick={resetFilters}>
            Reset
          </Button>
        </div>
      </div>

      {/* Tasks display - conditional rendering based on viewMode */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          Loading tasks...
        </div>
      ) : tasks.length === 0 ? (
        <Empty
          description="No tasks found"
          style={{ padding: '40px' }}
        />
      ) : viewMode === 'card' ? (
        // Card View
        <Row gutter={[16, 16]}>
          {tasks.map(task => (
            <Col xs={24} sm={12} md={8} lg={6} key={task.id}>
              {renderTaskCard(task)}
            </Col>
          ))}
        </Row>
      ) : (
        // Table View
        <Table
          columns={columns}
          dataSource={tasks}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            pageSizeOptions: ['10', '20', '50'],
            showTotal: (total) => `Total ${total} tasks`
          }}
          className="tasks-table"
        />
      )}

      {/* Edit Task Modal */}
      <Modal
        title="Edit Task"
        open={editModalVisible}
        onCancel={handleEditCancel}
        footer={[
          <Button key="cancel" onClick={handleEditCancel} icon={<CloseOutlined />}>
            Cancel
          </Button>,
          <Button
            key="submit"
            type="primary"
            onClick={handleEditSubmit}
            icon={<SaveOutlined />}
          >
            Save Changes
          </Button>
        ]}
        width={700}
      >
        <Form
          form={form}
          layout="vertical"
        >
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item
                name="title"
                label="Task Title"
                rules={[{ required: true, message: 'Please enter task title' }]}
              >
                <Input />
              </Form.Item>
            </Col>

            <Col span={24}>
              <Form.Item
                name="description"
                label="Description"
              >
                <TextArea rows={4} />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                name="status"
                label="Status"
                rules={[{ required: true, message: 'Please select status' }]}
              >
                <Select>
                  <Option value="pending">Pending</Option>
                  <Option value="in_progress">In Progress</Option>
                  <Option value="completed">Completed</Option>
                  <Option value="overdue">Overdue</Option>
                </Select>
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                name="priority"
                label="Priority"
                rules={[{ required: true, message: 'Please select priority' }]}
              >
                <Select>
                  <Option value="low">Low</Option>
                  <Option value="medium">Medium</Option>
                  <Option value="high">High</Option>
                </Select>
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                name="assignee_id"
                label="Assign To"
                rules={[{ required: true, message: 'Please select assignee' }]}
              >
                <Select>
                  {users.map(user => (
                    <Option key={user.id} value={user.id}>{user.name}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                name="dateRange"
                label="Timeline"
                rules={[{ required: true, message: 'Please select date range' }]}
              >
                <RangePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
};

export default TaskListView;
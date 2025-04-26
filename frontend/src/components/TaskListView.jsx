// TaskListView.jsx
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
  Typography
} from 'antd';
import {
  EditOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  SearchOutlined
} from '@ant-design/icons';
import { getTasks, updateTaskStatus, deleteTask, getMembers } from '../services/api';
import moment from 'moment';
import { useNavigate } from 'react-router-dom';

const { Option } = Select;
const { RangePicker } = DatePicker;
const { Title } = Typography;

const TaskListView = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [members, setMembers] = useState([]);
  const [filters, setFilters] = useState({
    memberId: null,
    status: null,
    dateRange: null,
    search: ''
  });
  const navigate = useNavigate();

  useEffect(() => {
    const fetchFiltersData = async () => {
      try {
        const membersData = await getMembers();
        setMembers(membersData);
      } catch (error) {
        message.error('Failed to load members data');
        console.error(error);
      }
    };

    fetchFiltersData();
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [filters]);

  const fetchTasks = async () => {
    try {
      setLoading(true);

      const queryParams = {};

      if (filters.memberId) {
        queryParams.member_id = filters.memberId;
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
      await deleteTask(taskId);
      message.success('Task deleted');
      fetchTasks();
    } catch (error) {
      message.error('Failed to delete task');
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
          <Button
            type="text"
            icon={<CheckCircleOutlined />}
            onClick={() => handleUpdateStatus(record.id, 'completed')}
            disabled={record.status === 'completed'}
            title="Mark as Complete"
          />
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDeleteTask(record.id)}
            title="Delete Task"
          />
        </Space>
      ),
    },
  ];

  return (
    <div className="task-list-view">
      <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={2}>Task List</Title>
        <Button type="primary" onClick={() => navigate('/create')}>
          Create New Task
        </Button>
      </div>

      <div className="filters" style={{ marginBottom: '20px', display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
        <Input
          placeholder="Search tasks"
          prefix={<SearchOutlined />}
          style={{ width: 200 }}
          onChange={(e) => handleFilterChange('search', e.target.value)}
          allowClear
        />

        <Select
          allowClear
          style={{ width: 200 }}
          placeholder="Filter by Member"
          onChange={(value) => handleFilterChange('memberId', value)}
        >
          {members.map(member => (
            <Option key={member.id} value={member.id}>{member.name}</Option>
          ))}
        </Select>

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
        locale={{ emptyText: 'No tasks found. Try creating a new task!' }}
      />
    </div>
  );
};

export default TaskListView;
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
  message
} from 'antd';
import {
  EditOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  SearchOutlined
} from '@ant-design/icons';
import { getTasks, updateTaskStatus, deleteTask, getMembers, getTeams } from '../services/api';
import moment from 'moment';

const { Option } = Select;
const { RangePicker } = DatePicker;

const TaskListView = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [members, setMembers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [filters, setFilters] = useState({
    memberId: null,
    teamId: null,
    status: null,
    dateRange: null,
    search: ''
  });

  useEffect(() => {
    const fetchFiltersData = async () => {
      try {
        const [membersData, teamsData] = await Promise.all([
          getMembers(),
          getTeams()
        ]);
        setMembers(membersData);
        setTeams(teamsData);
      } catch (error) {
        message.error('Failed to load filters data');
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
        queryParams.memberId = filters.memberId;
      }

      if (filters.teamId) {
        queryParams.teamId = filters.teamId;
      }

      if (filters.status) {
        queryParams.status = filters.status;
      }

      if (filters.dateRange) {
        queryParams.startDate = filters.dateRange[0].format('YYYY-MM-DD');
        queryParams.endDate = filters.dateRange[1].format('YYYY-MM-DD');
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
      title: 'Team',
      dataIndex: 'team',
      key: 'team',
      render: team => team?.name || 'N/A',
    },
    {
      title: 'Start Date',
      dataIndex: 'startDate',
      key: 'startDate',
      render: date => moment(date).format('YYYY-MM-DD'),
      sorter: (a, b) => moment(a.startDate).unix() - moment(b.startDate).unix(),
    },
    {
      title: 'End Date',
      dataIndex: 'endDate',
      key: 'endDate',
      render: date => moment(date).format('YYYY-MM-DD'),
      sorter: (a, b) => moment(a.endDate).unix() - moment(b.endDate).unix(),
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
          />
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => {/* Handle edit task */}}
          />
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDeleteTask(record.id)}
          />
        </Space>
      ),
    },
  ];

  return (
    <div className="list-view">
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
          placeholder="Filter by Team"
          onChange={(value) => handleFilterChange('teamId', value)}
        >
          {teams.map(team => (
            <Option key={team.id} value={team.id}>{team.name}</Option>
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
        />
      </div>

      <Table
        columns={columns}
        dataSource={tasks}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
      />
    </div>
  );
};

export default TaskListView;
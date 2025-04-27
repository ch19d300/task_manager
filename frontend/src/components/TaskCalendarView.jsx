// Fixed TaskCalendarView.jsx
import React, { useState, useEffect } from 'react';
import { Calendar, Badge, Select, Spin, message, Typography, Tooltip, Empty } from 'antd';
import { getTasks, getUsers, isAdmin } from '../services/api';
import moment from 'moment';

const { Option } = Select;
const { Title } = Typography;

const TaskCalendarView = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [filters, setFilters] = useState({
    assignee_id: null
  });
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

      const tasksData = await getTasks(queryParams);

      // Process tasks to ensure dates are moment objects
      const processedTasks = tasksData.map(task => ({
        ...task,
        start_date: moment(task.start_date),
        end_date: moment(task.end_date)
      }));

      setTasks(processedTasks);
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

  // Fixed method - use moment's comparison methods
  const getTasksForDate = (date) => {
    return tasks.filter(task => {
      // Ensure we're comparing moment objects
      const cellDate = moment(date.format('YYYY-MM-DD'));
      const startDate = moment(task.start_date.format('YYYY-MM-DD'));
      const endDate = moment(task.end_date.format('YYYY-MM-DD'));

      // Use moment's isSameOrAfter and isSameOrBefore methods
      return cellDate.isSameOrAfter(startDate) && cellDate.isSameOrBefore(endDate);
    });
  };

  const dateCellRender = (date) => {
    const tasksForDate = getTasksForDate(date);

    if (tasksForDate.length === 0) return null;

    return (
      <ul className="events" style={{ listStyleType: 'none', margin: 0, padding: 0 }}>
        {tasksForDate.map(task => (
          <li key={task.id} style={{ marginBottom: '2px' }}>
            <Tooltip title={`${task.description || 'No description'} (Assigned to: ${task.assignee.name})`}>
              <Badge
                status={getPriorityColor(task.priority)}
                text={<span style={{ fontSize: '12px' }}>{task.title}</span>}
              />
            </Tooltip>
          </li>
        ))}
      </ul>
    );
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'error';
      case 'medium':
        return 'warning';
      case 'low':
        return 'success';
      default:
        return 'processing';
    }
  };

  return (
    <div className="calendar-view">
      <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={2}>Task Calendar</Title>
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
      </div>

      <Spin spinning={loading}>
        {tasks.length > 0 ? (
          <Calendar
            dateCellRender={dateCellRender}
          />
        ) : (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
            <Empty description={
              userIsAdmin ?
                "No tasks found. Try creating new tasks first." :
                "No tasks assigned to you yet."
            } />
          </div>
        )}
      </Spin>
    </div>
  );
};

export default TaskCalendarView;
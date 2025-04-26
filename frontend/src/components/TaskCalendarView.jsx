// TaskCalendarView.jsx
import React, { useState, useEffect } from 'react';
import { Calendar, Badge, Select, Spin, message, Typography, Tooltip } from 'antd';
import { getTasks, getMembers } from '../services/api';
import moment from 'moment';

const { Option } = Select;
const { Title } = Typography;

const TaskCalendarView = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [members, setMembers] = useState([]);
  const [filters, setFilters] = useState({
    memberId: null
  });

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

  const getTasksForDate = (date) => {
    const dateStr = date.format('YYYY-MM-DD');
    return tasks.filter(task => {
      const startDate = moment(task.start_date);
      const endDate = moment(task.end_date);
      return date.isSameOrAfter(startDate, 'day') && date.isSameOrBefore(endDate, 'day');
    });
  };

  const dateCellRender = (date) => {
    const tasksForDate = getTasksForDate(date);

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
      </div>

      <Spin spinning={loading}>
        <Calendar
          dateCellRender={dateCellRender}
        />
      </Spin>
    </div>
  );
};

export default TaskCalendarView;
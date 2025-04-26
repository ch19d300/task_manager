// TaskCalendarView.jsx
import React, { useState, useEffect } from 'react';
import { Calendar, Badge, Select, Spin, message } from 'antd';
import { getTasks, getMembers, getTeams } from '../services/api';
import moment from 'moment';

const { Option } = Select;

const TaskCalendarView = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [members, setMembers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [filters, setFilters] = useState({
    memberId: null,
    teamId: null
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
      const startDate = moment(task.startDate);
      const endDate = moment(task.endDate);
      return date.isSameOrAfter(startDate, 'day') && date.isSameOrBefore(endDate, 'day');
    });
  };

  const dateCellRender = (date) => {
    const tasksForDate = getTasksForDate(date);

    return (
      <ul className="events">
        {tasksForDate.map(task => (
          <li key={task.id}>
            <Badge
              status={getPriorityColor(task.priority)}
              text={<span style={{ fontSize: '12px' }}>{task.title}</span>}
            />
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
      <div className="filters" style={{ marginBottom: '20px', display: 'flex', gap: '16px' }}>
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
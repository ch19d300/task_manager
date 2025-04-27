// TaskCalendarView with Fixed Edit Mode Population
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  Select,
  message,
  Typography,
  Card,
  Tag,
  Button,
  Space,
  Empty,
  Tooltip,
  DatePicker,
  Modal,
  Form,
  Input,
  Row,
  Col,
  Avatar,
  Popconfirm
} from 'antd';
import {
  AppstoreOutlined,
  CalendarOutlined,
  EditOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  ReloadOutlined,
  SaveOutlined,
  CloseOutlined,
  PlusOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';
import { getTasks, getUsers, isAdmin, updateTaskStatus, updateTask, deleteTask } from '../services/api';
import moment from 'moment';

const { Option } = Select;
const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { TextArea } = Input;

const TaskCalendarView = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [filters, setFilters] = useState({
    assignee_id: null,
    date_range: null
  });
  const [currentMonth, setCurrentMonth] = useState(moment());

  // For task editing
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

      // Add date range filter if selected
      if (filters.date_range && filters.date_range.length === 2) {
        queryParams.start_date = filters.date_range[0].format('YYYY-MM-DD');
        queryParams.end_date = filters.date_range[1].format('YYYY-MM-DD');
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

  const resetFilters = () => {
    setFilters({
      assignee_id: null,
      date_range: null
    });
  };

  // Fixed to properly handle moment objects
  const getTasksForDate = (date) => {
    return tasks.filter(task => {
      // Create clean date strings for comparison to avoid timezone issues
      const cellDateStr = date.format('YYYY-MM-DD');
      const startDateStr = moment(task.start_date).format('YYYY-MM-DD');
      const endDateStr = moment(task.end_date).format('YYYY-MM-DD');

      // Check if the cell date falls within the task's date range (inclusive)
      return cellDateStr >= startDateStr && cellDateStr <= endDateStr;
    });
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

  const getTruncatedTitle = (title, maxLength = 14) => {
    if (!title) return '';
    return title.length > maxLength ? `${title.substring(0, maxLength)}...` : title;
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

      // Ensure dates are properly formatted
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

  // Delete task function
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

  // Update task status
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

  // Custom rendering for calendar cells
  const dateCellRender = (date) => {
    const tasksForDate = getTasksForDate(date);

    if (tasksForDate.length === 0) return null;

    // Limit to showing max 2 tasks per cell
    const visibleTasks = tasksForDate.slice(0, 2);
    const remainingCount = tasksForDate.length - visibleTasks.length;

    return (
      <div style={{ padding: '0 4px' }}>
        {visibleTasks.map(task => (
          <div
            key={task.id}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: 'rgba(20, 20, 20, 0.6)',
              padding: '4px 8px',
              borderRadius: '6px',
              marginBottom: '4px',
              cursor: 'pointer',
              border: '1px solid rgba(255, 255, 255, 0.05)',
              overflow: 'hidden'
            }}
            onClick={() => handleEditTask(task)}
          >
            <Tooltip title={task.title}>
              <span style={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                fontSize: '12px',
                maxWidth: '70%'
              }}>
                {getTruncatedTitle(task.title)}
              </span>
            </Tooltip>
            <Tag
              className={getPriorityClass(task.priority)}
              style={{
                margin: 0,
                fontSize: '10px',
                padding: '0 6px',
                height: '20px',
                lineHeight: '20px'
              }}
            >
              {task.priority}
            </Tag>
          </div>
        ))}

        {remainingCount > 0 && (
          <div style={{
            textAlign: 'center',
            fontSize: '11px',
            background: 'rgba(147, 51, 234, 0.1)',
            padding: '2px',
            borderRadius: '4px',
            marginTop: '2px'
          }}>
            +{remainingCount} more
          </div>
        )}
      </div>
    );
  };

  // Style for date cells
  const dateCellStyle = (date) => {
    const isToday = date.isSame(moment(), 'day');
    const tasksForDate = getTasksForDate(date);
    const hasTask = tasksForDate.length > 0;
    const isCurrentMonth = date.month() === currentMonth.month();

    const baseStyle = {
      opacity: isCurrentMonth ? 1 : 0.3,
      height: '100%',
      padding: '4px 8px',
      position: 'relative',
      border: '1px solid #333',
      borderTop: 0,
      borderLeft: 0,
      transition: 'all 0.3s'
    };

    if (isToday) {
      return {
        ...baseStyle,
        background: 'rgba(147, 51, 234, 0.1)',
        borderColor: '#9333EA'
      };
    }

    if (hasTask) {
      return {
        ...baseStyle,
        background: 'rgba(255, 255, 255, 0.02)'
      };
    }

    return baseStyle;
  };

  // Custom rendering for the full date cell
  const dateFullCellRender = (date) => {
    const isToday = date.isSame(moment(), 'day');

    return (
      <div style={dateCellStyle(date)}>
        {/* Date number */}
        <div style={{
          position: 'absolute',
          top: '4px',
          right: '8px',
          fontSize: isToday ? '14px' : '12px',
          fontWeight: isToday ? 'bold' : 'normal',
          color: isToday ? '#9333EA' : undefined,
        }}>
          {date.date()}
        </div>

        {/* Tasks for this date */}
        <div style={{ marginTop: '24px', maxHeight: 'calc(100% - 24px)', overflow: 'hidden' }}>
          {dateCellRender(date)}
        </div>
      </div>
    );
  };

  // Custom header renderer for the calendar
  const headerRender = ({ value, type, onChange, onTypeChange }) => {
    const handlePrevMonth = () => {
      const newValue = value.clone().subtract(1, 'month');
      onChange(newValue);
      setCurrentMonth(newValue);
    };

    const handleNextMonth = () => {
      const newValue = value.clone().add(1, 'month');
      onChange(newValue);
      setCurrentMonth(newValue);
    };

    const handleToday = () => {
      const newValue = moment();
      onChange(newValue);
      setCurrentMonth(newValue);
    };

    return (
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        padding: '16px 0',
        alignItems: 'center'
      }}>
        <Title level={4} style={{ margin: 0 }}>
          {value.format('MMMM YYYY')}
        </Title>

        <Space>
          <Button type="text" onClick={handlePrevMonth}>
            Previous
          </Button>
          <Button
            type="primary"
            onClick={handleToday}
            className={moment().isSame(value, 'month') ? 'active-month-btn' : ''}
          >
            Today
          </Button>
          <Button type="text" onClick={handleNextMonth}>
            Next
          </Button>
        </Space>
      </div>
    );
  };

  return (
    <div className="calendar-view">
      <div style={{
        marginBottom: '24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <Title level={2} style={{ margin: 0, fontSize: '28px', letterSpacing: '-0.5px' }}>
            Task Calendar
          </Title>
          <Text type="secondary">
            View your tasks in calendar format
          </Text>
        </div>

        <Space size="middle">
          {userIsAdmin && (
            <Select
              allowClear
              style={{ width: 200 }}
              placeholder="Filter by User"
              onChange={(value) => handleFilterChange('assignee_id', value)}
              value={filters.assignee_id}
            >
              {users.map(user => (
                <Option key={user.id} value={user.id}>{user.name}</Option>
              ))}
            </Select>
          )}

          {/* Date range filter */}
          <RangePicker
            style={{ width: 280 }}
            placeholder={['Start Date', 'End Date']}
            value={filters.date_range}
            onChange={(dates) => handleFilterChange('date_range', dates)}
            allowClear
          />

          <Button
            icon={<ReloadOutlined />}
            onClick={resetFilters}
            type="default"
          >
            Reset
          </Button>

          <Button
            type="primary"
            icon={<AppstoreOutlined />}
            onClick={() => navigate('/list')}
            className="cred-glow"
          >
            Switch to List View
          </Button>
        </Space>
      </div>

      <Card
        className="calendar-card"
        loading={loading}
        bordered={false}
        style={{
          borderRadius: '16px',
          overflow: 'hidden',
          boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
          background: '#141414'
        }}
        bodyStyle={{ padding: '0' }}
      >
        {tasks.length > 0 ? (
          <Calendar
            mode="month"
            headerRender={headerRender}
            dateFullCellRender={dateFullCellRender}
            value={currentMonth}
            onPanelChange={(value) => setCurrentMonth(value)}
            className="dark-calendar"
          />
        ) : (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '80px' }}>
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                <div>
                  <Title level={4} style={{ color: 'rgba(255, 255, 255, 0.85)' }}>
                    {userIsAdmin ? 'No tasks found' : 'No tasks assigned to you yet'}
                  </Title>
                  <Text type="secondary">
                    {userIsAdmin
                      ? 'Try creating new tasks or adjusting your filters'
                      : 'Tasks assigned to you will appear here on the calendar'}
                  </Text>
                  {userIsAdmin && (
                    <div style={{ marginTop: '24px', textAlign: 'center' }}>
                      <Button
                        type="primary"
                        onClick={() => navigate('/create')}
                        className="cred-glow"
                      >
                        Create First Task
                      </Button>
                    </div>
                  )}
                </div>
              }
            />
          </div>
        )}
      </Card>

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

export default TaskCalendarView;
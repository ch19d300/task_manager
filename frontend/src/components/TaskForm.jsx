// Enhanced TaskForm with CRED-inspired UI
import React, { useState, useEffect } from 'react';
import {
  Button,
  Form,
  Input,
  DatePicker,
  Select,
  message,
  Typography,
  Card,
  Space,
  Divider,
  Row,
  Col,
  Avatar,
  Tag
} from 'antd';
import {
  CalendarOutlined,
  UserOutlined,
  CheckCircleOutlined,
  TagOutlined,
  FileTextOutlined,
  ArrowLeftOutlined
} from '@ant-design/icons';
import { createTask, getUsers } from '../services/api';
import moment from 'moment';
import { useNavigate } from 'react-router-dom';

const { TextArea } = Input;
const { Option } = Select;
const { RangePicker } = DatePicker;
const { Title, Text, Paragraph } = Typography;

const TaskForm = ({ onTaskCreated }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [previewData, setPreviewData] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const usersData = await getUsers();
        setUsers(usersData);
      } catch (error) {
        message.error('Failed to load users');
        console.error(error);
      }
    };

    fetchData();
  }, []);

  const handleSubmit = async (values) => {
    try {
      setLoading(true);

      const taskData = {
        title: values.title,
        description: values.description,
        start_date: values.dateRange[0].format('YYYY-MM-DD'),
        end_date: values.dateRange[1].format('YYYY-MM-DD'),
        priority: values.priority || 'medium',
        assignee_id: values.assignee_id,
        status: 'pending'
      };

      await createTask(taskData);
      message.success({
        content: 'Task created successfully',
        icon: <CheckCircleOutlined style={{ color: '#10B981' }} />,
        style: {
          borderRadius: '12px',
          boxShadow: '0 6px 16px rgba(0, 0, 0, 0.12)'
        }
      });

      form.resetFields();
      setPreviewData(null);

      if (onTaskCreated) {
        onTaskCreated();
      }

      // Redirect back to list view after 1 second
      setTimeout(() => {
        navigate('/list');
      }, 1000);

    } catch (error) {
      message.error('Failed to create task');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleValuesChange = (_, allValues) => {
    // Only generate preview if we have the essential fields
    if (allValues.title && allValues.assignee_id && allValues.dateRange && allValues.priority) {
      const assignee = users.find(user => user.id === allValues.assignee_id);

      if (assignee) {
        setPreviewData({
          ...allValues,
          assignee
        });
      }
    } else {
      setPreviewData(null);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return '#DC2626';
      case 'medium':
        return '#F59E0B';
      case 'low':
        return '#10B981';
      default:
        return '#3B82F6';
    }
  };

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

  return (
    <div className="create-task-container">
      <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center' }}>
        <Button
          icon={<ArrowLeftOutlined />}
          type="text"
          onClick={() => navigate('/list')}
          style={{ marginRight: '16px' }}
        />
        <Title level={2} style={{ margin: 0, fontSize: '28px', letterSpacing: '-0.5px' }}>
          Create New Task
        </Title>
      </div>

      <Row gutter={24}>
        <Col xs={24} lg={14}>
          <Card
            bordered={false}
            className="create-task-form-card"
            style={{ height: '100%' }}
          >
            <Form
              form={form}
              layout="vertical"
              onFinish={handleSubmit}
              onValuesChange={handleValuesChange}
              requiredMark={false}
              initialValues={{
                priority: 'medium'
              }}
            >
              <Form.Item
                name="title"
                label="Task Title"
                rules={[{ required: true, message: 'Please enter task title' }]}
              >
                <Input
                  placeholder="What needs to be done?"
                  size="large"
                  autoFocus
                />
              </Form.Item>

              <Form.Item
                name="description"
                label="Description"
              >
                <TextArea
                  rows={4}
                  placeholder="Add details about this task..."
                  style={{ minHeight: '120px' }}
                />
              </Form.Item>

              <Row gutter={16}>
                <Col span={24} md={12}>
                  <Form.Item
                    name="dateRange"
                    label="Timeline"
                    rules={[{ required: true, message: 'Please select date range' }]}
                  >
                    <RangePicker
                      style={{ width: '100%' }}
                      size="large"
                      disabledDate={(current) => current && current < moment().startOf('day')}
                    />
                  </Form.Item>
                </Col>

                <Col span={24} md={12}>
                  <Form.Item
                    name="assignee_id"
                    label="Assign To"
                    rules={[{ required: true, message: 'Please select a user to assign this task' }]}
                  >
                    <Select
                      placeholder="Select team member"
                      style={{ width: '100%' }}
                      size="large"
                      showSearch
                      optionFilterProp="children"
                      notFoundContent={
                        users.length === 0 ?
                          <div style={{ padding: '12px', textAlign: 'center' }}>
                            <Text type="secondary">No users available</Text>
                            <br />
                            <Text type="secondary">Please create users first</Text>
                          </div> : null
                      }
                    >
                      {users.map(user => (
                        <Option key={user.id} value={user.id}>
                          <Space align="center">
                            <Avatar size="small" className="user-avatar">
                              {user.name.charAt(0).toUpperCase()}
                            </Avatar>
                            <span>{user.name}</span>
                            {user.is_admin && <Tag size="small">Admin</Tag>}
                          </Space>
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item
                name="priority"
                label="Priority"
              >
                <Select
                  placeholder="Set priority level"
                  size="large"
                >
                  <Option value="low">
                    <Tag className="priority-low" style={{ marginRight: '8px' }}>Low</Tag>
                    <Text type="secondary">Not urgent</Text>
                  </Option>
                  <Option value="medium">
                    <Tag className="priority-medium" style={{ marginRight: '8px' }}>Medium</Tag>
                    <Text type="secondary">Normal priority</Text>
                  </Option>
                  <Option value="high">
                    <Tag className="priority-high" style={{ marginRight: '8px' }}>High</Tag>
                    <Text type="secondary">Urgent attention needed</Text>
                  </Option>
                </Select>
              </Form.Item>

              <Divider style={{ margin: '24px 0' }} />

              <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
                <Space>
                  <Button
                    onClick={() => {
                      form.resetFields();
                      setPreviewData(null);
                    }}
                  >
                    Reset
                  </Button>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={loading}
                    size="large"
                    className="cred-glow"
                  >
                    Create Task
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </Card>
        </Col>

        <Col xs={24} lg={10}>
          <Card
            bordered={false}
            title="Task Preview"
            className="task-preview-card"
            style={{
              height: '100%',
              minHeight: '300px',
              background: 'rgba(0, 0, 0, 0.2)'
            }}
          >
            {previewData ? (
              <div>
                <div style={{
                  marginBottom: '24px',
                  position: 'relative',
                  paddingBottom: '16px',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
                }}>
                  <Title level={4} style={{ margin: 0, marginBottom: '8px' }}>
                    {previewData.title}
                  </Title>

                  <Tag className={getPriorityClass(previewData.priority)} style={{ position: 'absolute', top: 0, right: 0 }}>
                    {previewData.priority.charAt(0).toUpperCase() + previewData.priority.slice(1)}
                  </Tag>

                  {previewData.description && (
                    <Paragraph style={{ color: 'rgba(255, 255, 255, 0.6)', margin: 0 }}>
                      {previewData.description}
                    </Paragraph>
                  )}
                </div>

                <Space direction="vertical" size={16} style={{ width: '100%' }}>
                  {/* Timeline */}
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <CalendarOutlined style={{ fontSize: '16px', marginRight: '12px', color: '#3B82F6' }} />
                    <div>
                      <Text type="secondary">Timeline</Text>
                      <div>
                        {previewData.dateRange && previewData.dateRange[0] && previewData.dateRange[1] ? (
                          <Text>
                            {previewData.dateRange[0].format('MMM D, YYYY')} - {previewData.dateRange[1].format('MMM D, YYYY')}
                          </Text>
                        ) : (
                          <Text type="secondary">No dates selected</Text>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Assignee */}
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <UserOutlined style={{ fontSize: '16px', marginRight: '12px', color: '#3B82F6' }} />
                    <div>
                      <Text type="secondary">Assigned to</Text>
                      <div>
                        <Space>
                          <Avatar size="small" className="user-avatar">
                            {previewData.assignee.name.charAt(0).toUpperCase()}
                          </Avatar>
                          <Text>{previewData.assignee.name}</Text>
                        </Space>
                      </div>
                    </div>
                  </div>

                  {/* Status */}
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <TagOutlined style={{ fontSize: '16px', marginRight: '12px', color: '#3B82F6' }} />
                    <div>
                      <Text type="secondary">Status</Text>
                      <div>
                        <Tag className="status-pending">Pending</Tag>
                      </div>
                    </div>
                  </div>
                </Space>

                <div style={{ marginTop: '32px', textAlign: 'center' }}>
                  <Text type="secondary">Task will be created with "Pending" status</Text>
                </div>
              </div>
            ) : (
              <div style={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                padding: '32px 0'
              }}>
                <FileTextOutlined style={{ fontSize: '48px', color: 'rgba(255, 255, 255, 0.2)', marginBottom: '16px' }} />
                <Text type="secondary" style={{ fontSize: '16px' }}>
                  Fill in the form to see a preview
                </Text>
              </div>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default TaskForm;
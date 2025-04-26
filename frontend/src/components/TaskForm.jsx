// TaskForm.jsx
import React, { useState, useEffect } from 'react';
import { Button, Form, Input, DatePicker, Select, message } from 'antd';
import { createTask, getMembers } from '../services/api';
import moment from 'moment';

const { TextArea } = Input;
const { Option } = Select;
const { RangePicker } = DatePicker;

const TaskForm = ({ onTaskCreated }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [members, setMembers] = useState([]);
  const [showMemberForm, setShowMemberForm] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const membersData = await getMembers();
        setMembers(membersData);
      } catch (error) {
        message.error('Failed to load members');
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
      message.success('Task created successfully');
      form.resetFields();

      if (onTaskCreated) {
        onTaskCreated();
      }
    } catch (error) {
      message.error('Failed to create task');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>Create New Task</h2>
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
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

        <Form.Item
          name="assignee_id"
          label="Assign To"
          rules={[{ required: true, message: 'Please select a member to assign this task' }]}
        >
          <Select
            placeholder="Select member"
            style={{ width: '100%' }}
            notFoundContent={
              members.length === 0 ?
                <div style={{ padding: '8px 0' }}>
                  No members available. Please create members first.
                </div> : null
            }
          >
            {members.map(member => (
              <Option key={member.id} value={member.id}>
                {member.name} {member.role ? `(${member.role})` : ''}
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          name="priority"
          label="Priority"
          initialValue="medium"
        >
          <Select placeholder="Select priority">
            <Option value="low">Low</Option>
            <Option value="medium">Medium</Option>
            <Option value="high">High</Option>
          </Select>
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading}>
            Create Task
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
};

export default TaskForm;
// TaskForm.jsx
import React, { useState, useEffect } from 'react';
import { Button, Form, Input, DatePicker, Select, message } from 'antd';
import { createTask, getMembers, getTeams } from '../services/api';
import moment from 'moment';

const { TextArea } = Input;
const { Option } = Select;
const { RangePicker } = DatePicker;

const TaskForm = ({ onTaskCreated }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [members, setMembers] = useState([]);
  const [teams, setTeams] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [membersData, teamsData] = await Promise.all([
          getMembers(),
          getTeams()
        ]);
        setMembers(membersData);
        setTeams(teamsData);
      } catch (error) {
        message.error('Failed to load members and teams');
        console.error(error);
      }
    };

    fetchData();
  }, []);

  const handleSubmit = async (values) => {
    try {
      setLoading(true);

      const taskData = {
        ...values,
        startDate: values.dateRange[0].format('YYYY-MM-DD'),
        endDate: values.dateRange[1].format('YYYY-MM-DD')
      };

      delete taskData.dateRange;

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

  const handleCreateNewMember = () => {
    // Logic to open a modal for creating a new member on the fly
    // This function would be implemented based on your requirements
  };

  return (
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
        <RangePicker />
      </Form.Item>

      <Form.Item
        name="assigneeId"
        label="Assign To"
        rules={[{ required: true, message: 'Please select team member' }]}
      >
        <Select
          placeholder="Select team member"
          style={{ width: '100%' }}
          dropdownRender={(menu) => (
            <>
              {menu}
              <div style={{ padding: '8px', borderTop: '1px solid #e8e8e8' }}>
                <Button type="link" onClick={handleCreateNewMember}>
                  + Create New Member
                </Button>
              </div>
            </>
          )}
        >
          {members.map(member => (
            <Option key={member.id} value={member.id}>
              {member.name}
            </Option>
          ))}
        </Select>
      </Form.Item>

      <Form.Item
        name="teamId"
        label="Team"
      >
        <Select placeholder="Select team">
          {teams.map(team => (
            <Option key={team.id} value={team.id}>
              {team.name}
            </Option>
          ))}
        </Select>
      </Form.Item>

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

      <Form.Item>
        <Button type="primary" htmlType="submit" loading={loading}>
          Create Task
        </Button>
      </Form.Item>
    </Form>
  );
};

export default TaskForm;
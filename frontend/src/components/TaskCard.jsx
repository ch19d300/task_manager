// Fixed TaskCard.jsx with working edit and delete functionality
import React from 'react';
import { Card, Tag, Space, Button, Tooltip, Typography, Avatar, Popconfirm } from 'antd';
import {
  CheckCircleOutlined,
  EditOutlined,
  DeleteOutlined,
  InfoCircleOutlined,
  CalendarOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';
import moment from 'moment';

const { Text, Paragraph } = Typography;

const TaskCard = ({
  task,
  onStatusUpdate,
  onEdit,
  onDelete,
  userIsAdmin = false
}) => {
  if (!task) return null;

  // Get priority styling
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

  // Get status styling
  const getStatusClass = (status) => {
    return `status-${status.replace('_', '-')}`;
  };

  // Format the dates
  const formattedDate = () => {
    const startDate = moment(task.start_date);
    const endDate = moment(task.end_date);
    return `${startDate.format('MMM D')} - ${endDate.format('MMM D, YYYY')}`;
  };

  // Handle avatar display
  const getInitials = (name) => {
    if (!name) return 'U';
    return name.charAt(0).toUpperCase();
  };

  return (
    <Card
      className="task-card"
      style={{
        borderRadius: '12px',
        background: '#1e1e1e',
        overflow: 'hidden',
        height: '100%',
        display: 'flex',
        flexDirection: 'column'
      }}
      bodyStyle={{
        padding: '16px',
        height: '100%',
        display: 'flex',
        flexDirection: 'column'
      }}
      bordered={false}
    >
      {/* Header section with title and priority */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '12px'
      }}>
        <Text strong style={{ fontSize: '18px', flex: 1 }}>
          {task.title}
        </Text>
        <Tag
          className={getPriorityClass(task.priority)}
          style={{
            marginLeft: '8px',
            textTransform: 'capitalize',
            fontWeight: 500
          }}
        >
          {task.priority}
        </Tag>
      </div>

      {/* Description section (if present) */}
      {task.description && (
        <Paragraph
          type="secondary"
          style={{
            fontSize: '14px',
            marginBottom: '16px'
          }}
          ellipsis={{ rows: 2 }}
        >
          {task.description}
        </Paragraph>
      )}

      {/* Meta information section */}
      <div style={{ marginBottom: 'auto' }}>
        {/* Assignee information */}
        <div style={{ marginBottom: '12px' }}>
          <Text type="secondary" style={{ fontSize: '13px', display: 'block', marginBottom: '4px' }}>
            Assigned to:
          </Text>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Avatar
              style={{
                marginRight: '8px',
                background: task.assignee?.name === 'Administrator' ? '#9333EA' : '#3B82F6'
              }}
            >
              {getInitials(task.assignee?.name)}
            </Avatar>
            <Text>{task.assignee?.name || 'Unassigned'}</Text>
          </div>
        </div>

        {/* Timeline information */}
        <div style={{ marginBottom: '12px' }}>
          <Text type="secondary" style={{ fontSize: '13px', display: 'block', marginBottom: '4px' }}>
            Timeline:
          </Text>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <CalendarOutlined style={{ marginRight: '8px', color: '#3B82F6' }} />
            <Text>{formattedDate()}</Text>
          </div>
        </div>

        {/* Status badge */}
        <div style={{ marginBottom: '16px' }}>
          <div
            className={getStatusClass(task.status)}
            style={{
              padding: '6px 12px',
              background: 'rgba(0,0,0,0.2)',
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
      </div>

      {/* Actions footer */}
      <div style={{
        display: 'flex',
        justifyContent: 'flex-end',
        borderTop: '1px solid rgba(255,255,255,0.1)',
        paddingTop: '12px',
        gap: '8px',
        marginTop: '16px'
      }}>
        <Tooltip title="View Details">
          <Button
            type="text"
            icon={<InfoCircleOutlined />}
            shape="circle"
            onClick={() => onEdit && onEdit(task)}
          />
        </Tooltip>

        {task.status !== 'completed' && (
          <Tooltip title="Mark Complete">
            <Button
              type="primary"
              className="status-completed"
              icon={<CheckCircleOutlined />}
              shape="circle"
              onClick={() => onStatusUpdate && onStatusUpdate(task.id, 'completed')}
            />
          </Tooltip>
        )}

        <Tooltip title="Edit">
          <Button
            type="primary"
            icon={<EditOutlined />}
            shape="circle"
            onClick={() => onEdit && onEdit(task)}
          />
        </Tooltip>

        {userIsAdmin && (
          <Popconfirm
            title="Are you sure you want to delete this task?"
            onConfirm={() => onDelete && onDelete(task.id)}
            okText="Yes"
            cancelText="No"
          >
            <Tooltip title="Delete">
              <Button
                type="primary"
                danger
                icon={<DeleteOutlined />}
                shape="circle"
              />
            </Tooltip>
          </Popconfirm>
        )}
      </div>
    </Card>
  );
};

export default TaskCard;
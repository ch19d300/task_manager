// UserAvatar.jsx - CRED-inspired user avatar component
import React from 'react';
import { Avatar, Tooltip } from 'antd';
import { UserOutlined } from '@ant-design/icons';

const UserAvatar = ({ user, size = 'default', showTooltip = true, style = {} }) => {
  if (!user) return null;

  // Get user initials
  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  // Generate a consistent color based on the user's name
  const generateColorFromName = (name) => {
    if (!name) return { bg: '#9333EA', text: '#FFFFFF' };

    // Color palette for avatar backgrounds (CRED-inspired purples and blues)
    const colors = [
      { bg: '#9333EA', text: '#FFFFFF' }, // Purple
      { bg: '#8B5CF6', text: '#FFFFFF' }, // Violet
      { bg: '#6366F1', text: '#FFFFFF' }, // Indigo
      { bg: '#4F46E5', text: '#FFFFFF' }, // Indigo darker
      { bg: '#4338CA', text: '#FFFFFF' }, // Indigo darkest
      { bg: '#7C3AED', text: '#FFFFFF' }, // Violet medium
    ];

    // Use a simple hash function to get a consistent index
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }

    // Select a color from the palette
    const index = Math.abs(hash) % colors.length;
    return colors[index];
  };

  const userInitials = getInitials(user.name);
  const color = generateColorFromName(user.name);

  const avatar = (
    <Avatar
      size={size}
      className="user-avatar"
      style={{
        backgroundColor: color.bg,
        color: color.text,
        fontWeight: 600,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        ...style
      }}
      icon={!user.name ? <UserOutlined /> : null}
    >
      {userInitials}
    </Avatar>
  );

  if (showTooltip && user.name) {
    return (
      <Tooltip title={`${user.name}${user.is_admin ? ' (Admin)' : ''}`} placement="top">
        {avatar}
      </Tooltip>
    );
  }

  return avatar;
};

export default UserAvatar;
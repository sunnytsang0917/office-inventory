import React from 'react';
import { Tag, Tooltip, Space } from 'antd';
import { CrownOutlined, UserOutlined } from '@ant-design/icons';
import { UserRole, getRoleDisplayName, getRoleColor } from '../../utils/permissions';

interface UserRoleDisplayProps {
  role: UserRole;
  showIcon?: boolean;
  showTooltip?: boolean;
  size?: 'small' | 'default';
}

/**
 * 用户角色显示组件
 * 用于统一显示用户角色标签
 */
const UserRoleDisplay: React.FC<UserRoleDisplayProps> = ({
  role,
  showIcon = true,
  showTooltip = true,
  size = 'default',
}) => {
  const displayName = getRoleDisplayName(role);
  const color = getRoleColor(role);
  
  const getIcon = () => {
    switch (role) {
      case 'admin':
        return <CrownOutlined />;
      case 'employee':
        return <UserOutlined />;
      default:
        return null;
    }
  };
  
  const getTooltipContent = () => {
    switch (role) {
      case 'admin':
        return '管理员：拥有系统所有功能的访问权限，包括物品管理、库房位置管理、出入库操作、报表查看等';
      case 'employee':
        return '员工：可以查看库存信息、申请出库，但无法进行物品管理、批量操作等管理功能';
      default:
        return '未知角色';
    }
  };
  
  const roleTag = (
    <Tag
      color={color}
      icon={showIcon ? getIcon() : undefined}
      style={{
        fontSize: size === 'small' ? '11px' : '12px',
        padding: size === 'small' ? '1px 4px' : '2px 6px',
        borderRadius: '4px',
        fontWeight: 500,
      }}
    >
      {displayName}
    </Tag>
  );
  
  if (showTooltip) {
    return (
      <Tooltip title={getTooltipContent()} placement="bottom">
        {roleTag}
      </Tooltip>
    );
  }
  
  return roleTag;
};

export default UserRoleDisplay;
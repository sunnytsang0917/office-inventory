import React from 'react';
import { Tooltip } from 'antd';
import { useAppContext } from '../../contexts/AppContext';
import { hasPermission, Permission } from '../../utils/permissions';

interface PermissionGuardProps {
  permission: keyof Permission;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showTooltip?: boolean;
  tooltipTitle?: string;
}

/**
 * 权限守卫组件
 * 根据用户权限决定是否渲染子组件
 */
const PermissionGuard: React.FC<PermissionGuardProps> = ({
  permission,
  children,
  fallback = null,
  showTooltip = true,
  tooltipTitle,
}) => {
  const { state } = useAppContext();
  
  if (!state.user) {
    return <>{fallback}</>;
  }
  
  const hasAccess = hasPermission(state.user.role, permission);
  
  if (hasAccess) {
    return <>{children}</>;
  }
  
  // 如果没有权限但需要显示提示
  if (showTooltip && React.isValidElement(children)) {
    const defaultTooltipTitle = tooltipTitle || '您没有执行此操作的权限';
    const childElement = children as React.ReactElement<any>;
    
    return (
      <Tooltip title={defaultTooltipTitle}>
        {React.cloneElement(childElement, {
          ...childElement.props,
          disabled: true,
          style: {
            ...(childElement.props.style || {}),
            opacity: 0.5,
            cursor: 'not-allowed',
          },
        })}
      </Tooltip>
    );
  }
  
  return <>{fallback}</>;
};

export default PermissionGuard;
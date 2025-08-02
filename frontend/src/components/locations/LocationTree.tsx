import React from 'react';
import {
  Tree,
  Card,
  Space,
  Button,
  Tooltip,
  Tag,
  Popconfirm,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import type { DataNode } from 'antd/es/tree';
import { Location, LOCATION_LEVEL_NAMES } from '../../types/location';
import { buildLocationTree } from '../../data/mockLocations';

interface LocationTreeProps {
  locations: Location[];
  onAdd: (parentId?: string) => void;
  onEdit: (location: Location) => void;
  onDelete: (location: Location) => void;
  onViewItems: (location: Location) => void;
  loading?: boolean;
  userRole?: 'admin' | 'employee';
}

const LocationTree: React.FC<LocationTreeProps> = ({
  locations,
  onAdd,
  onEdit,
  onDelete,
  onViewItems,
  loading = false,
  userRole = 'employee',
}) => {
  // 构建树形数据
  const buildTreeData = (nodes: any[]): DataNode[] => {
    return nodes.map(node => ({
      key: node.id,
      title: (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Space>
            <span style={{ fontWeight: 500 }}>{node.name}</span>
            <Tag color="blue">
              {node.code}
            </Tag>
            <Tag color="green">
              {LOCATION_LEVEL_NAMES[node.level as keyof typeof LOCATION_LEVEL_NAMES]}
            </Tag>
            {!node.isActive && (
              <Tag color="red">已禁用</Tag>
            )}
          </Space>
          <Space size="small">
            <Tooltip title="查看物品">
              <Button
                type="text"
                size="small"
                icon={<EyeOutlined />}
                onClick={(e) => {
                  e.stopPropagation();
                  onViewItems(node);
                }}
              />
            </Tooltip>
            {userRole === 'admin' && (
              <>
                <Tooltip title="添加子位置">
                  <Button
                    type="text"
                    size="small"
                    icon={<PlusOutlined />}
                    onClick={(e) => {
                      e.stopPropagation();
                      onAdd(node.id);
                    }}
                  />
                </Tooltip>
                <Tooltip title="编辑">
                  <Button
                    type="text"
                    size="small"
                    icon={<EditOutlined />}
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(node);
                    }}
                  />
                </Tooltip>
                <Tooltip title="删除">
                  <Popconfirm
                    title="确认删除"
                    description={`确定要删除位置"${node.name}"吗？`}
                    onConfirm={(e) => {
                      e?.stopPropagation();
                      onDelete(node);
                    }}
                    okText="确定"
                    cancelText="取消"
                    onCancel={(e) => e?.stopPropagation()}
                  >
                    <Button
                      type="text"
                      size="small"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </Popconfirm>
                </Tooltip>
              </>
            )}
          </Space>
        </div>
      ),
      children: node.children && node.children.length > 0 
        ? buildTreeData(node.children) 
        : undefined,
    }));
  };

  const treeData = buildTreeData(buildLocationTree(locations));

  return (
    <Card
      title="位置层级结构"
      extra={
        userRole === 'admin' && (
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => onAdd()}
          >
            添加根位置
          </Button>
        )
      }
      loading={loading}
    >
      {treeData.length > 0 ? (
        <Tree
          treeData={treeData}
          defaultExpandAll
          showLine={{ showLeafIcon: false }}
          blockNode
        />
      ) : (
        <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>
          暂无位置数据
        </div>
      )}
    </Card>
  );
};

export default LocationTree;
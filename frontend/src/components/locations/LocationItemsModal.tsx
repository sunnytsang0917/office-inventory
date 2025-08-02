import React, { useState, useEffect, useMemo } from 'react';
import {
  Modal,
  Table,
  Tag,
  Space,
  Input,
  Button,
  message,
  Tooltip,
} from 'antd';
import {
  ReloadOutlined,
  ExportOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { Location } from '../../types/location';
import { Item } from '../../types/item';
import { mockItems } from '../../data/mockItems';
import { getLocationPath } from '../../data/mockLocations';

const { Search } = Input;

interface LocationItemsModalProps {
  visible: boolean;
  onCancel: () => void;
  location: Location | null;
  locations: Location[];
}

const LocationItemsModal: React.FC<LocationItemsModalProps> = ({
  visible,
  onCancel,
  location,
  locations,
}) => {
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [items, setItems] = useState<Item[]>([]);

  // 获取该位置的物品
  const locationItems = useMemo(() => {
    if (!location) return [];
    
    return items.filter(item => {
      // 检查物品是否在当前位置或其子位置
      const itemLocationName = item.location;
      const currentLocationName = location.name;
      
      return itemLocationName === currentLocationName ||
             itemLocationName.startsWith(currentLocationName);
    });
  }, [items, location]);

  // 过滤后的物品
  const filteredItems = useMemo(() => {
    if (!searchText) return locationItems;
    
    return locationItems.filter(item =>
      item.name.toLowerCase().includes(searchText.toLowerCase()) ||
      item.category.toLowerCase().includes(searchText.toLowerCase()) ||
      item.specification.toLowerCase().includes(searchText.toLowerCase())
    );
  }, [locationItems, searchText]);

  // 加载物品数据
  const loadItems = async () => {
    setLoading(true);
    try {
      // 模拟API调用
      setTimeout(() => {
        setItems(mockItems);
        setLoading(false);
      }, 500);
    } catch (error) {
      message.error('加载物品数据失败');
      setLoading(false);
    }
  };

  useEffect(() => {
    if (visible && location) {
      loadItems();
    }
  }, [visible, location]);

  // 导出位置物品清单
  const handleExport = () => {
    if (!location) return;
    
    const csvContent = [
      ['物品名称', '类别', '规格', '单位', '当前库存', '最低库存', '库存状态', '位置'],
      ...filteredItems.map(item => [
        item.name,
        item.category,
        item.specification,
        item.unit,
        item.currentStock.toString(),
        item.minStock.toString(),
        item.currentStock < item.minStock ? '库存不足' : '库存正常',
        item.location,
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${location.name}_物品清单_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    message.success('导出成功');
  };

  const columns: ColumnsType<Item> = [
    {
      title: '物品名称',
      dataIndex: 'name',
      key: 'name',
      width: 150,
      ellipsis: true,
    },
    {
      title: '类别',
      dataIndex: 'category',
      key: 'category',
      width: 100,
    },
    {
      title: '规格',
      dataIndex: 'specification',
      key: 'specification',
      width: 200,
      ellipsis: {
        showTitle: false,
      },
      render: (text: string) => (
        <Tooltip title={text}>
          {text}
        </Tooltip>
      ),
    },
    {
      title: '单位',
      dataIndex: 'unit',
      key: 'unit',
      width: 60,
      align: 'center',
    },
    {
      title: '当前库存',
      dataIndex: 'currentStock',
      key: 'currentStock',
      width: 100,
      align: 'right',
      sorter: (a, b) => a.currentStock - b.currentStock,
      render: (stock: number, record: Item) => (
        <span style={{ 
          color: stock < record.minStock ? '#ff4d4f' : '#52c41a',
          fontWeight: stock < record.minStock ? 'bold' : 'normal'
        }}>
          {stock}
        </span>
      ),
    },
    {
      title: '最低库存',
      dataIndex: 'minStock',
      key: 'minStock',
      width: 100,
      align: 'right',
    },
    {
      title: '库存状态',
      key: 'stockStatus',
      width: 100,
      align: 'center',
      render: (_, record: Item) => (
        <Tag color={record.currentStock < record.minStock ? 'red' : 'green'}>
          {record.currentStock < record.minStock ? '库存不足' : '库存正常'}
        </Tag>
      ),
    },
    {
      title: '具体位置',
      dataIndex: 'location',
      key: 'location',
      width: 120,
    },
  ];

  return (
    <Modal
      title={
        <Space>
          <span>位置物品清单</span>
          {location && (
            <Tag color="blue">{getLocationPath(location.id, locations)}</Tag>
          )}
        </Space>
      }
      open={visible}
      onCancel={onCancel}
      width={1000}
      footer={[
        <Button key="export" icon={<ExportOutlined />} onClick={handleExport}>
          导出清单
        </Button>,
        <Button key="close" onClick={onCancel}>
          关闭
        </Button>,
      ]}
    >
      <Space direction="vertical" style={{ width: '100%' }} size="middle">
        {/* 搜索和操作区域 */}
        <Space style={{ width: '100%', justifyContent: 'space-between' }}>
          <Search
            placeholder="搜索物品名称、类别或规格"
            allowClear
            style={{ width: 300 }}
            onSearch={setSearchText}
            onChange={(e) => {
              if (!e.target.value) {
                setSearchText('');
              }
            }}
          />
          <Space>
            <Button
              icon={<ReloadOutlined />}
              onClick={loadItems}
              loading={loading}
            >
              刷新
            </Button>
          </Space>
        </Space>

        {/* 统计信息 */}
        <Space>
          <Tag color="blue">总物品: {filteredItems.length}</Tag>
          <Tag color="green">
            库存正常: {filteredItems.filter(item => item.currentStock >= item.minStock).length}
          </Tag>
          <Tag color="red">
            库存不足: {filteredItems.filter(item => item.currentStock < item.minStock).length}
          </Tag>
        </Space>

        {/* 物品列表 */}
        <Table
          columns={columns}
          dataSource={filteredItems}
          rowKey="id"
          loading={loading}
          pagination={{
            total: filteredItems.length,
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => 
              `第 ${range[0]}-${range[1]} 条/共 ${total} 条`,
          }}
          scroll={{ x: 800 }}
          size="small"
        />
      </Space>
    </Modal>
  );
};

export default LocationItemsModal;
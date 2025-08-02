import React, { useEffect } from 'react';
import {
  Modal,
  Form,
  Input,
  Select,
  Switch,
  TreeSelect,
} from 'antd';
import { Location, CreateLocationDto, UpdateLocationDto, LOCATION_LEVELS, LOCATION_LEVEL_NAMES } from '../../types/location';
import { buildLocationTree } from '../../data/mockLocations';

interface LocationFormProps {
  visible: boolean;
  onCancel: () => void;
  onSubmit: (values: CreateLocationDto | UpdateLocationDto) => Promise<void>;
  location?: Location;
  locations: Location[];
  loading?: boolean;
}

const LocationForm: React.FC<LocationFormProps> = ({
  visible,
  onCancel,
  onSubmit,
  location,
  locations,
  loading = false,
}) => {
  const [form] = Form.useForm();
  const isEditing = !!location;

  useEffect(() => {
    if (visible) {
      if (isEditing && location) {
        form.setFieldsValue({
          code: location.code,
          name: location.name,
          description: location.description,
          parentId: location.parentId,
          level: location.level,
          isActive: location.isActive,
        });
      } else {
        form.resetFields();
        form.setFieldsValue({
          level: LOCATION_LEVELS.AREA,
          isActive: true,
        });
      }
    }
  }, [visible, isEditing, location, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      await onSubmit(values);
      form.resetFields();
    } catch (error) {
      console.error('表单验证失败:', error);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onCancel();
  };

  // 构建父级位置选项（排除自己和子级）
  const buildParentOptions = () => {
    const tree = buildLocationTree(locations);
    
    const convertToTreeData = (nodes: any[]): any[] => {
      return nodes
        .filter(node => {
          // 如果是编辑模式，排除自己和自己的子级
          if (isEditing && location) {
            return node.id !== location.id;
          }
          return true;
        })
        .map(node => ({
          title: `${node.name} (${node.code})`,
          value: node.id,
          key: node.id,
          children: node.children && node.children.length > 0 
            ? convertToTreeData(node.children) 
            : undefined,
        }));
    };

    return convertToTreeData(tree);
  };

  // 根据父级位置自动设置层级
  const handleParentChange = (parentId: string) => {
    if (parentId) {
      const parent = locations.find(loc => loc.id === parentId);
      if (parent) {
        const newLevel = parent.level + 1;
        if (newLevel <= LOCATION_LEVELS.POSITION) {
          form.setFieldsValue({ level: newLevel });
        }
      }
    } else {
      form.setFieldsValue({ level: LOCATION_LEVELS.WAREHOUSE });
    }
  };

  return (
    <Modal
      title={isEditing ? '编辑位置' : '添加位置'}
      open={visible}
      onOk={handleSubmit}
      onCancel={handleCancel}
      confirmLoading={loading}
      width={600}
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          level: LOCATION_LEVELS.AREA,
          isActive: true,
        }}
      >
        <Form.Item
          name="code"
          label="位置编码"
          rules={[
            { required: true, message: '请输入位置编码' },
            { pattern: /^[A-Z0-9-]+$/, message: '位置编码只能包含大写字母、数字和连字符' },
          ]}
        >
          <Input placeholder="如: A-01, WH001" />
        </Form.Item>

        <Form.Item
          name="name"
          label="位置名称"
          rules={[{ required: true, message: '请输入位置名称' }]}
        >
          <Input placeholder="如: A区-01货架" />
        </Form.Item>

        <Form.Item
          name="description"
          label="位置描述"
        >
          <Input.TextArea 
            placeholder="位置的详细描述（可选）" 
            rows={3}
          />
        </Form.Item>

        <Form.Item
          name="parentId"
          label="上级位置"
        >
          <TreeSelect
            placeholder="选择上级位置（可选）"
            allowClear
            treeData={buildParentOptions()}
            onChange={handleParentChange}
            showSearch
            treeNodeFilterProp="title"
          />
        </Form.Item>

        <Form.Item
          name="level"
          label="位置层级"
          rules={[{ required: true, message: '请选择位置层级' }]}
        >
          <Select placeholder="选择位置层级">
            {Object.entries(LOCATION_LEVEL_NAMES).map(([level, name]) => (
              <Select.Option key={level} value={parseInt(level)}>
                {name}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        {isEditing && (
          <Form.Item
            name="isActive"
            label="启用状态"
            valuePropName="checked"
          >
            <Switch checkedChildren="启用" unCheckedChildren="禁用" />
          </Form.Item>
        )}
      </Form>
    </Modal>
  );
};

export default LocationForm;
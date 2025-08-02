import React, { useEffect } from 'react';
import { Modal, Form, Input, Select, InputNumber, message } from 'antd';
import { Item, CreateItemDto, UpdateItemDto } from '../../types/item';
import { categoryOptions, unitOptions, locationOptions } from '../../data/mockItems';

interface ItemFormProps {
  visible: boolean;
  onCancel: () => void;
  onSubmit: (values: CreateItemDto | UpdateItemDto) => void;
  item?: Item;
  loading?: boolean;
}

const ItemForm: React.FC<ItemFormProps> = ({
  visible,
  onCancel,
  onSubmit,
  item,
  loading = false,
}) => {
  const [form] = Form.useForm();
  const isEdit = !!item;

  useEffect(() => {
    if (visible) {
      if (item) {
        form.setFieldsValue({
          name: item.name,
          category: item.category,
          specification: item.specification,
          unit: item.unit,
          location: item.location,
          minStock: item.minStock,
        });
      } else {
        form.resetFields();
      }
    }
  }, [visible, item, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      onSubmit(values);
    } catch (error) {
      message.error('请检查表单输入');
    }
  };

  return (
    <Modal
      title={isEdit ? '编辑物品' : '添加物品'}
      open={visible}
      onCancel={onCancel}
      onOk={handleSubmit}
      confirmLoading={loading}
      width={600}
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        requiredMark={false}
      >
        <Form.Item
          name="name"
          label="物品名称"
          rules={[
            { required: true, message: '请输入物品名称' },
            { max: 100, message: '物品名称不能超过100个字符' },
          ]}
        >
          <Input placeholder="请输入物品名称" />
        </Form.Item>

        <Form.Item
          name="category"
          label="物品类别"
          rules={[{ required: true, message: '请选择物品类别' }]}
        >
          <Select
            placeholder="请选择物品类别"
            options={categoryOptions.map(cat => ({ label: cat, value: cat }))}
            showSearch
            allowClear
          />
        </Form.Item>

        <Form.Item
          name="specification"
          label="规格说明"
          rules={[
            { required: true, message: '请输入规格说明' },
            { max: 200, message: '规格说明不能超过200个字符' },
          ]}
        >
          <Input.TextArea
            placeholder="请输入物品规格说明"
            rows={3}
            maxLength={200}
            showCount
          />
        </Form.Item>

        <Form.Item
          name="unit"
          label="计量单位"
          rules={[{ required: true, message: '请选择计量单位' }]}
        >
          <Select
            placeholder="请选择计量单位"
            options={unitOptions.map(unit => ({ label: unit, value: unit }))}
            showSearch
            allowClear
          />
        </Form.Item>

        <Form.Item
          name="location"
          label="库房位置"
          rules={[{ required: true, message: '请选择库房位置' }]}
        >
          <Select
            placeholder="请选择库房位置"
            options={locationOptions.map(location => ({ label: location, value: location }))}
            showSearch
            allowClear
          />
        </Form.Item>

        <Form.Item
          name="minStock"
          label="最低库存"
          rules={[
            { required: true, message: '请输入最低库存' },
            { type: 'number', min: 0, message: '最低库存不能小于0' },
          ]}
        >
          <InputNumber
            placeholder="请输入最低库存"
            min={0}
            style={{ width: '100%' }}
            precision={0}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default ItemForm;
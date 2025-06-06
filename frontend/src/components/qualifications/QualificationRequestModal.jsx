import React, { useState } from 'react';
import { 
  Modal, 
  Form, 
  Input, 
  Select, 
  Button, 
  Space,
  DatePicker
} from 'antd';
import { SendOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

const { Option } = Select;
const { TextArea } = Input;

// Common qualification types for requests
const QUALIFICATION_TYPES = [
  'Duty Manager Certificate',
  'First Aid Certificate',
  'Food Safety Certificate',
  'Health and Safety Certificate',
  'Security Certificate',
  'Driver License',
  'Passport',
  'Work Visa',
  'Other'
];

const QualificationRequestModal = ({
  open,
  onClose,
  onSubmit,
  userInfo = null,
  loading = false
}) => {
  const [form] = Form.useForm();

  const handleSubmit = async (values) => {
    try {
      const requestData = {
        userId: userInfo.uid,
        qualificationType: values.qualificationType,
        message: values.message,
        dueDate: values.dueDate ? values.dueDate.toISOString() : null
      };
      
      await onSubmit(requestData);
      form.resetFields();
      onClose();
    } catch (error) {
      console.error('Error submitting request:', error);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onClose();
  };

  return (
    <Modal
      title={`Request Qualification from ${userInfo?.displayName || 'User'}`}
      open={open}
      onCancel={handleCancel}
      footer={null}
      width={600}
      destroyOnClose
    >
      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
        <div className="text-sm">
          <strong>Requesting from:</strong> {userInfo?.displayName || 'Unknown User'}
        </div>
        <div className="text-sm text-gray-600">
          <strong>Email:</strong> {userInfo?.email || 'Unknown'}
        </div>
      </div>

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        requiredMark="optional"
        initialValues={{
          message: `Hi ${userInfo?.displayName?.split(' ')[0] || 'there'},\n\nCould you please upload the requested certificate? This is required for compliance purposes.\n\nThanks!`
        }}
      >
        <Form.Item
          name="qualificationType"
          label="Qualification Type"
          rules={[{ required: true, message: 'Please select the qualification type' }]}
        >
          <Select 
            placeholder="Select qualification type"
            showSearch
            optionFilterProp="children"
          >
            {QUALIFICATION_TYPES.map(type => (
              <Option key={type} value={type}>{type}</Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          name="message"
          label="Message"
          rules={[{ required: true, message: 'Please enter a message' }]}
        >
          <TextArea 
            placeholder="Enter your message to the user..."
            rows={4}
            maxLength={500}
            showCount
          />
        </Form.Item>

        <Form.Item
          name="dueDate"
          label="Due Date (Optional)"
        >
          <DatePicker 
            placeholder="Select due date"
            style={{ width: '100%' }}
            disabledDate={(current) => current && current < dayjs().endOf('day')}
          />
        </Form.Item>

        <Form.Item className="mb-0">
          <Space className="w-full justify-end">
            <Button onClick={handleCancel}>
              Cancel
            </Button>
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={loading}
              icon={<SendOutlined />}
            >
              Send Request
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default QualificationRequestModal;
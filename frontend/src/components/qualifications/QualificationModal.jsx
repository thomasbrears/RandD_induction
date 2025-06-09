import React, { useState, useEffect } from 'react';
import { 
  Modal, 
  Form, 
  Input, 
  Select, 
  DatePicker, 
  Upload, 
  Button, 
  message,
  Space,
  Divider,
  Spin 
} from 'antd';
import { 
  UploadOutlined, 
  SaveOutlined, 
  PlusOutlined 
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { getAllCertificateTypes } from '../../api/CertificateTypeApi';

const { Option } = Select;
const { TextArea } = Input;

const QualificationModal = ({
  open,
  onClose,
  onSubmit,
  qualification = null,
  loading = false,
  title
}) => {
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState([]);
  const [customType, setCustomType] = useState('');
  const [certificateTypes, setCertificateTypes] = useState([]);
  const [loadingTypes, setLoadingTypes] = useState(false);

  const isEditing = !!qualification?.id; // Only editing if qualification has an ID
  const isAddingForUser = !isEditing && qualification?.userDisplayName; // Adding for another user

  // Convert Firestore date to dayjs object
  const convertToDate = (date) => {
    if (!date) return null;
    
    // Handle Firestore Timestamp
    if (date && typeof date.toDate === 'function') {
      return dayjs(date.toDate());
    }
    
    // Handle ISO string or Date object
    if (typeof date === 'string' || date instanceof Date) {
      return dayjs(date);
    }
    
    return null;
  };

  // Fetch certificate types from database
  useEffect(() => {
    const fetchCertificateTypes = async () => {
      setLoadingTypes(true);
      try {
        const types = await getAllCertificateTypes();
        // Sort types alphabetically and add "Other" option at the end
        const sortedTypes = types
          .map(type => type.name)
          .sort()
          .concat(['Other']);
        setCertificateTypes(sortedTypes);
      } catch (error) {
        console.error('Error fetching certificate types:', error);
        message.error('Failed to load certificate types');
        // Fallback to some basic types if database fetch fails
        setCertificateTypes([
          'Duty Manager Certificate',
          'First Aid Certificate', 
          'Food Safety Certificate',
          'Other'
        ]);
      } finally {
        setLoadingTypes(false);
      }
    };

    if (open) {
      fetchCertificateTypes();
    }
  }, [open]);

  // Separate effect for populating form when qualification changes
  useEffect(() => {
    if (open && isEditing && qualification && certificateTypes.length > 0) {
      // Pre-fill form for editing
      const formData = {
        qualificationName: qualification.qualificationName || '',
        qualificationType: qualification.qualificationType || '',
        issuer: qualification.issuer || '',
        issueDate: convertToDate(qualification.issueDate),
        expiryDate: convertToDate(qualification.expiryDate),
        notes: qualification.notes || ''
      };
      form.setFieldsValue(formData);
      
      // Set custom type if not in predefined list
      if (qualification.qualificationType && !certificateTypes.includes(qualification.qualificationType)) {
        setCustomType(qualification.qualificationType);
        // Use setTimeout to ensure the form has been set first
        setTimeout(() => {
          form.setFieldsValue({ qualificationType: 'Other' });
        }, 100);
      }
      
      // Set existing file info (for display only, not uploaded)
      if (qualification.fileName) {
        setFileList([{
          uid: '1',
          name: qualification.fileName,
          status: 'done',
          url: qualification.fileUrl || '#'
        }]);
      }
    }
  }, [qualification, certificateTypes, open, form, isEditing]);

  // Separate effect for resetting form when it's a new qualification
  useEffect(() => {
    if (open && !isEditing) {
      form.resetFields();
      setFileList([]);
      setCustomType('');
    }
  }, [open, isEditing, form]);

  const handleSubmit = async (values) => {
    try {
      // Validate file for new qualifications
      if (!isEditing && fileList.length === 0) {
        message.error('Please upload a qualification file');
        return;
      }

      // Validate file for editing if new file is provided
      if (isEditing && fileList.length > 0 && !fileList[0].originFileObj) {
        // User kept the existing file
      } else if (isEditing && fileList.length === 0) {
        message.error('Please keep the existing file or upload a new one');
        return;
      }

      // Validate custom type if "Other" is selected
      if (values.qualificationType === 'Other' && !customType.trim()) {
        message.error('Please enter a custom qualification type');
        return;
      }

      const formData = {
        qualificationName: values.qualificationName.trim(),
        qualificationType: values.qualificationType === 'Other' ? customType.trim() : values.qualificationType,
        issuer: values.issuer?.trim() || '',
        issueDate: values.issueDate ? values.issueDate.toISOString() : null,
        expiryDate: values.expiryDate ? values.expiryDate.toISOString() : null,
        notes: values.notes?.trim() || ''
      };

      // Get the file if it's new
      const file = fileList.length > 0 && fileList[0].originFileObj ? fileList[0].originFileObj : null;

      await onSubmit(formData, file);
      
      // Reset form and close modal
      form.resetFields();
      setFileList([]);
      setCustomType('');
      onClose();
      
    } catch (error) {
      console.error('Error submitting qualification:', error);
      message.error('Failed to save qualification. Please try again.');
    }
  };

  const handleFileChange = ({ fileList: newFileList }) => {
    // Only allow one file
    setFileList(newFileList.slice(-1));
  };

  const beforeUpload = (file) => {
    const isValidType = file.type === 'application/pdf' || 
                       file.type.startsWith('image/') ||
                       file.type === 'application/msword' ||
                       file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    
    if (!isValidType) {
      message.error('You can only upload PDF, or Image files!');
      return false;
    }
    
    const isLt10M = file.size / 1024 / 1024 < 10;
    if (!isLt10M) {
      message.error('File must be smaller than 10MB!');
      return false;
    }
    
    return false; // Prevent automatic upload
  };

  const handleCancel = () => {
    form.resetFields();
    setFileList([]);
    setCustomType('');
    onClose();
  };

  // Determine the modal title
  const modalTitle = title || (isEditing ? 'Edit Qualification' : 'Add New Qualification');

  return (
    <Modal
      title={modalTitle}
      open={open}
      onCancel={handleCancel}
      footer={null}
      width={600}
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        requiredMark="optional"
      >
        {/* Show user info if editing someone else's qualification OR adding for another user */}
        {(isEditing || isAddingForUser) && qualification?.userDisplayName && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <div className="text-sm">
              <strong>{isEditing ? 'Editing qualification for:' : 'Adding qualification for:'}</strong> {qualification.userDisplayName} ({qualification.userEmail})
            </div>
          </div>
        )}

        {/* Qualification Name */}
        <Form.Item
          name="qualificationName"
          label="Qualification Name"
          rules={[{ required: true, message: 'Please enter the qualification name' }]}
        >
          <Input 
            placeholder={isAddingForUser 
              ? `e.g., ${qualification?.userDisplayName?.split(' ')[0]}'s Duty Manager Certificate`
              : "e.g., John Doe's Duty Manager Certificate"
            }
            maxLength={100}
          />
        </Form.Item>

        {/* Qualification Type */}
        <Form.Item
          name="qualificationType"
          label="Qualification Type"
          rules={[{ required: true, message: 'Please select the qualification type' }]}
        >
          <Select 
            placeholder="Select qualification type"
            showSearch
            optionFilterProp="children"
            loading={loadingTypes}
            notFoundContent={loadingTypes ? <Spin size="small" /> : 'No types found'}
            onChange={(value) => {
              if (value !== 'Other') {
                setCustomType('');
              }
            }}
          >
            {certificateTypes.map(type => (
              <Option key={type} value={type}>{type}</Option>
            ))}
          </Select>
        </Form.Item>

        {/* Custom Type Input */}
        {form.getFieldValue('qualificationType') === 'Other' && (
          <Form.Item
            label="Custom Type"
            rules={[{ required: true, message: 'Please enter the custom qualification type' }]}
          >
            <Input
              placeholder="Enter custom qualification type"
              value={customType}
              onChange={(e) => setCustomType(e.target.value)}
              maxLength={50}
            />
          </Form.Item>
        )}

        {/* Issuer */}
        <Form.Item
          name="issuer"
          label="Issuing Organisation"
        >
          <Input 
            placeholder="e.g., AUT, Ministry of Health, Auckland Council etc."
            maxLength={100}
          />
        </Form.Item>

        {/* Dates */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Form.Item
            name="issueDate"
            label="Issue Date"
          >
            <DatePicker 
              placeholder="Select issue date"
              style={{ width: '100%' }}
              disabledDate={(current) => current && current > dayjs().endOf('day')}
            />
          </Form.Item>

          <Form.Item
            name="expiryDate"
            label="Expiry Date"
          >
            <DatePicker 
              placeholder="Select expiry date (optional)"
              style={{ width: '100%' }}
              disabledDate={(current) => {
                const issueDate = form.getFieldValue('issueDate');
                return current && issueDate && current < issueDate;
              }}
            />
          </Form.Item>
        </div>

        {/* File Upload */}
        <Form.Item
          label={isEditing ? "Update File" : "Upload File"}
          required={!isEditing}
        >
          <Upload
            fileList={fileList}
            beforeUpload={beforeUpload}
            onChange={handleFileChange}
            maxCount={1}
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif"
          >
            <Button icon={<UploadOutlined />}>
              {isEditing ? 'Replace File' : 'Select File'}
            </Button>
          </Upload>
          <div className="text-xs text-gray-500 mt-1">
            Accepted formats: PDF or Image (jpg, jpeg, png) upto 10MB in size.
          </div>
        </Form.Item>

        {/* Notes */}
        <Form.Item
          name="notes"
          label="Notes"
        >
          <TextArea 
            placeholder="Any additional notes about this qualification/certificate"
            allowClear
            rows={3}
            maxLength={500}
            showCount
          />
        </Form.Item>

        <Divider />

        {/* Form Actions */}
        <Form.Item className="mb-0">
          <Space className="w-full justify-end">
            <Button onClick={handleCancel}>
              Cancel
            </Button>
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={loading}
              icon={isEditing ? <SaveOutlined /> : <PlusOutlined />}
            >
              {isEditing ? 'Save Changes' : 'Add Qualification'}
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default QualificationModal;
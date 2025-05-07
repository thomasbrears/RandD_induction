import { useState, useEffect } from "react";
import { 
  Form, 
  Input, 
  Select, 
  Button, 
  Card, 
  Popconfirm,
  Typography, 
  Space, 
  Row, 
  Col, 
  Divider, 
  Alert 
} from "antd";
import { 
  SaveOutlined, 
  UserOutlined, 
  UserAddOutlined, 
  DeleteOutlined, 
  CloseCircleOutlined, 
  CheckCircleOutlined, 
  KeyOutlined,
  ExclamationCircleOutlined,
  LoadingOutlined,
  WarningOutlined
} from '@ant-design/icons';
import Permissions from "../models/Permissions";
import { DefaultNewUser } from "../models/User";
import useAuth from "../hooks/useAuth";
import { deleteUser, deactivateUser, reactivateUser, getAllUsers } from "../api/UserApi";
import { getAllPositions } from '../api/PositionApi';
import { getAllLocations } from '../api/LocationApi';
import { getAllDepartments } from '../api/DepartmentApi';
import { useLocation, useNavigate } from "react-router-dom";
import { notifyError, notifySuccess, notifyPromise } from "../utils/notificationService";
import debounce from 'lodash/debounce';

const { Title } = Typography;
const { Option } = Select;

export const UserForm = ({ userData = DefaultNewUser, onSubmit }) => {
  const [form] = Form.useForm();
  const [user, setUser] = useState({ ...DefaultNewUser, position: '', department: '' });
  const [isDeactivated, setIsDeactivated] = useState(false);
  const [positions, setPositions] = useState([]);
  const [locations, setLocations] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingUsers, setExistingUsers] = useState([]);
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [emailStatus, setEmailStatus] = useState(null);
  const [similarUsers, setSimilarUsers] = useState([]);
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Check if the current page is the edit page and if the userData has an ID (existing user)
  const isEditPage = location.pathname.includes('/edit');
  const isExistingUser = userData?.uid !== undefined;

  // Field validation states
  const [validationStates, setValidationStates] = useState({
    name: null,
    email: null,
    permission: null,
    department: null,
    locations: null
  });

  useEffect(() => {
    // Initialise with properly structured data
    setUser({
      ...userData,
    });
    
    // Reset form with proper values
    form.setFieldsValue({
      ...userData,
      // Combine first and last name into a single field
      name: userData.firstName && userData.lastName 
        ? `${userData.firstName} ${userData.lastName}`
        : userData.displayName || '',
    });
    
    // Check if the user is deactivated on page load
    setIsDeactivated(!!userData.disabled);
  }, [userData, form]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const positionsData = await getAllPositions();
        setPositions(positionsData);
      } catch (error) {
        console.error("Error fetching positions:", error);
      }

      try {
        const locationsData = await getAllLocations();
        setLocations(locationsData);
      } catch (error) {
        console.error("Error fetching locations:", error);
      }

      try {
        const departmentData = await getAllDepartments();
        setDepartments(departmentData);
      } catch (error) {
        console.error("Error fetching departments:", error);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    const fetchUsers = async () => {
      // Only fetch users if we have an authenticated user and we're not in edit mode or if we're in edit mode but not editing the current user
      if (currentUser && !currentUser.loading) {
        try {
          const users = await getAllUsers(currentUser);
          setExistingUsers(users);
        } catch (error) {
          console.debug("Could not fetch users for duplicate checking, will use client-side validation only");
          // continue with client side validation
        }
      }
    };

    fetchUsers();
  }, [currentUser]);

  const handleNameChange = (e) => {
    const inputName = e.target.value;
    
    // Auto-capitalise function
    const autoCapitalizeName = (name) => {
      if (!name) return '';
      
      // Split by spaces and capitalise each part
      return name.split(' ')
        .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
        .join(' ');
    };
    
    // Apply auto-capitalisation
    const capitalizedName = autoCapitalizeName(inputName);
    
    // Update the form field with the capitalised name
    form.setFieldsValue({ name: capitalizedName });
    
    // Validate name field
    if (capitalizedName.trim().length > 0) {
      const nameParts = capitalizedName.trim().split(' ');
      if (nameParts.length >= 1 && nameParts[0].length >= 2) {
        setValidationStates(prev => ({ ...prev, name: 'success' }));
      } else {
        setValidationStates(prev => ({ ...prev, name: 'error' }));
      }
    } else {
      setValidationStates(prev => ({ ...prev, name: 'error' }));
    }
  };

  // Check for similar emails
  const checkForSimilarEmails = debounce(async (email) => {
    if (!email || email.length < 3) {
      setSimilarUsers([]);
      return;
    }
    
    setIsCheckingEmail(true);
    setEmailStatus('validating');
    
    try {
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        setEmailStatus('error');
        setValidationStates(prev => ({ ...prev, email: 'error' }));
        setSimilarUsers([]);
        setIsCheckingEmail(false);
        return;
      }
      
      // If we're in edit mode and this is the same email as the current user, it's fine
      if (isExistingUser && userData.email === email) {
        setEmailStatus(null);
        setValidationStates(prev => ({ ...prev, email: null }));
        setSimilarUsers([]);
        setIsCheckingEmail(false);
        return;
      }
      
      // Only check for duplicates if we have users to check against
      if (existingUsers && existingUsers.length > 0) {
        // Find similar emails
        const potentialDuplicates = existingUsers.filter(user => {
          // Skip current user when editing
          if (isExistingUser && user.uid === userData.uid) return false;
          
          // Check for exact match or similar email
          if (user.email && email) {
            const normalizeEmail = (inputEmail) => {
              // Convert to lowercase
              let normalized = inputEmail.toLowerCase();
              
              // Remove all periods before the @ symbol
              normalized = normalized.replace(/\.(?=[^@]*@)/g, '');
              
              // Remove '+' and everything after it before the @ symbol (for email aliases)
              normalized = normalized.replace(/\+.*?(?=@)/, '');
              
              return normalized;
            };
            
            return normalizeEmail(user.email) === normalizeEmail(email);
          }
          return false;
        });
        
        setSimilarUsers(potentialDuplicates);
        
        if (potentialDuplicates.length > 0) {
          setEmailStatus('warning');
          setValidationStates(prev => ({ ...prev, email: 'warning' }));
        } else {
          setEmailStatus(null);
          setValidationStates(prev => ({ ...prev, email: null }));
        }
      } else {
        // If we dont have users to check against, just validate the format
        setEmailStatus(null);
        setValidationStates(prev => ({ ...prev, email: null }));
      }
    } catch (error) {
      console.debug("Error in email checking:", error);
      // Dont block the user if something goes wrong
      setEmailStatus(null);
      setValidationStates(prev => ({ ...prev, email: null }));
    } finally {
      setIsCheckingEmail(false);
    }
  }, 500);

  const handleEmailChange = (e) => {
    const email = e.target.value;
    form.setFieldsValue({ email });
    
    if (email) {
      setEmailStatus('validating');
      setValidationStates(prev => ({ ...prev, email: 'validating' }));
      checkForSimilarEmails(email);
    } else {
      setEmailStatus(null);
      setValidationStates(prev => ({ ...prev, email: null }));
      setSimilarUsers([]);
    }
  };

  // Handle other field validations
  const handleFieldValidation = (field, value) => {
    if (field === 'permission') {
      setValidationStates(prev => ({ ...prev, permission: value ? 'success' : 'error' }));
    } else if (field === 'department') {
      setValidationStates(prev => ({ ...prev, department: value ? 'success' : 'error' }));
    } else if (field === 'locations') {
      setValidationStates(prev => ({ ...prev, locations: value && value.length > 0 ? 'success' : 'error' }));
    }
  };

  // Handle form submission
  const handleSubmit = async (values) => {
    setIsSubmitting(true);
    
    try {
      // Split the name field into firstName and lastName
      const nameParts = values.name.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';
      
      // Prepare data for submission
      const userToSubmit = {
        uid: userData.uid,
        email: values.email,
        firstName,
        lastName,
        position: values.position || "",
        department: values.department || "",
        permission: values.permission,
        locations: Array.isArray(values.locations) ? values.locations : [],
        assignedInductions: user.assignedInductions || []
      };

      await onSubmit(userToSubmit);
      
      // Reset form for new user creation
      if (!userData.uid) {
        form.resetFields();
        setUser(DefaultNewUser);
        setValidationStates({
          name: null,
          email: null,
          permission: null,
          department: null,
          locations: null
        });
      } else {
        setUser(userToSubmit);
      }
      
      notifySuccess(userData.uid ? "User updated successfully" : "User created successfully");
    } catch (error) {
      console.error("Submission error:", error);
      notifyError("Error saving user data", error.message || "An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get available permissions based on the current user's role
  const availablePermissions =
    currentUser?.role === Permissions.ADMIN
      ? Object.values(Permissions)
      : [Permissions.USER];

  // Handle user deactivate/reactivate action
  const handleDeactivateOrReactivate = () => {
    const action = user.disabled ? 'reactivate' : 'deactivate';
    
    const actionPromise =
      action === 'deactivate'
        ? deactivateUser(currentUser, user.uid)
        : reactivateUser(currentUser, user.uid);
  
    notifyPromise(
      actionPromise,
      {
        pending: action === 'deactivate'
          ? "Deactivating user..."
          : "Reactivating user...",
        success: action === 'deactivate'
          ? "User deactivated successfully!"
          : "User reactivated successfully!",
        error: action === 'deactivate'
          ? "Failed to deactivate user."
          : "Failed to reactivate user."
      }
    );
  
    actionPromise
      .then(() => {
        setUser({
          ...user,
          disabled: action === 'deactivate',
        });
        setIsDeactivated(action === 'deactivate');
      })
      .catch((err) => {
        console.error(err);
      });
  };  

  // Handle user delete action
  const handleDelete = () => {
    if (currentUser && user) {
      const deletePromise = deleteUser(currentUser, user.uid);
  
      notifyPromise(
        deletePromise, 
        {
          pending: "Deleting user...",
          success: "User deleted successfully!",
          error: (err) => {
            const errorMessage = err?.response?.data?.message || "An error occurred";
            return errorMessage;
          }
        }
      );
  
      deletePromise
        .then(() => {
          navigate("/management/users/view"); // Redirect after successful deletion
        })
        .catch((err) => {
          console.error(err);
        });
    }
  };

  // Handle password reset
  const handlePasswordReset = async () => {
    if (!user.email) {
      notifyError("Cannot reset password", "User email is missing");
      return;
    }
    
    try {
      const { getAuth, sendPasswordResetEmail } = await import('firebase/auth');
      const auth = getAuth();
      
      const resetPromise = sendPasswordResetEmail(auth, user.email);
      
      notifyPromise(
        resetPromise,
        {
          pending: "Sending password reset email...",
          success: "Password reset email sent successfully to the user! Please advise them to check their emails",
          error: (err) => {
            console.error(err);
            return "Failed to send password reset email: " + (err.message || "Unknown error");
          }
        }
      );
    } catch (error) {
      console.error("Error resetting password:", error);
      notifyError("Reset password failed", error.message || "An unexpected error occurred");
    }
  };

  // Get status indicator component
  const getStatusIndicator = (field) => {
    const status = validationStates[field];
    
    if (status === 'error') {
      return (
        <span className="ml-2">
          <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />
        </span>
      );
    } else if (status === 'validating') {
      return (
        <span className="ml-2">
          <LoadingOutlined style={{ color: '#1890ff' }} />
        </span>
      );
    } else if (status === 'warning') {
      return (
        <span className="ml-2">
          <WarningOutlined style={{ color: '#faad14' }} />
        </span>
      );
    }
    
    return null;
  };

  return (
    <Card 
      className="mx-auto max-w-4xl shadow-lg mt-6" 
      styles={{ body: { padding: '24px' } }}
    >
      {/* Deactivated banner */}
      {isDeactivated && (
          <Alert
            message="User Deactivated"
            description="This user is currently deactivated and cannot login or complete inductions."
            type="error"
            showIcon
            className="mb-4"
          />
      )}
      
      {/* Similar email warning */}
      {similarUsers.length > 0 && (
        <Alert
          message="Potential Duplicate User"
          description={
            <div>
              <p>The email address is similar to existing user(s):</p>
              <ul>
                {similarUsers.map(user => (
                  <li key={user.uid}>
                    <strong>{user.firstName} {user.lastName}</strong> ({user.email})
                  </li>
                ))}
              </ul>
            </div>
          }
          type="warning"
          showIcon
          className="mb-4"
        />
      )}
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
        <Title level={4} className="m-0">User Details</Title>
        
        {/* Action buttons for existing users */}
        {isEditPage && isExistingUser && (
          <Space wrap className="w-full sm:w-auto justify-end">
            <Popconfirm
              title={user.disabled ? "Reactivate User" : "Deactivate User"}
              description={user.disabled 
                ? "This will restore the user's access to the platform." 
                : "This will prevent the user from logging in and completing inductions."}
              onConfirm={handleDeactivateOrReactivate}
              okText={user.disabled ? "Reactivate" : "Deactivate"}
              cancelText="Cancel"
              okButtonProps={{ 
                danger: !user.disabled,
                type: user.disabled ? "primary" : "default" 
              }}
            >
              <Button 
                type={user.disabled ? "primary" : "default"}
                danger={!user.disabled}
                icon={user.disabled ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
                style={user.disabled ? { backgroundColor: '#52c41a', borderColor: '#52c41a' } : {}}
              >
                {user.disabled ? "Reactivate User" : "Deactivate User"}
              </Button>
            </Popconfirm>

            <Popconfirm
              title="Delete User"
              description="This action will permanently remove the user and all their associated data. THIS CANNOT BE UNDONE."
              onConfirm={handleDelete}
              okText="Delete"
              cancelText="Cancel"
              okButtonProps={{ danger: true }}
            >
              <Button 
                danger 
                icon={<DeleteOutlined />}
              >
                Delete User
              </Button>
            </Popconfirm>

            <Button
              type="default" 
              icon={<KeyOutlined />}
              onClick={handlePasswordReset}
            >
              Reset Password
            </Button>
          </Space>
        )}
      </div>
      
      <Divider />
      
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{
          ...userData,
          name: userData.firstName && userData.lastName 
            ? `${userData.firstName} ${userData.lastName}`
            : userData.displayName || '',
        }}
        className="mt-4"
        requiredMark="optional"
      >
        {/* Full Name Field */}
        <Form.Item
          name="name"
          label={
            <span className="flex items-center">
              Full Name {getStatusIndicator('name')}
            </span>
          }
          rules={[{ required: true, message: "Please enter the user's name" }]}
          validateStatus={validationStates.name}
          help={validationStates.name === 'error' ? "Please enter the user's full name" : null}
        >
          <Input 
            prefix={<UserOutlined className="text-gray-400" />} 
            placeholder="Full Name" 
            className="rounded-md"
            onChange={handleNameChange}
          />
        </Form.Item>
        
        <Row gutter={16}>
          {/* Email Field */}
          <Col xs={24} md={12}>
            <Form.Item
              name="email"
              label={
                <span className="flex items-center">
                  Email {getStatusIndicator('email')}
                </span>
              }
              rules={[
                { required: true, message: "Email is required" },
                { type: 'email', message: "Please enter a valid email" }
              ]}
              validateStatus={emailStatus}
              help={emailStatus === 'error' ? "Please enter a valid email address" : null}
            >
              <Input 
                placeholder="Email"
                className="rounded-md"
                onChange={handleEmailChange}
                suffix={isCheckingEmail ? <LoadingOutlined /> : null}
              />
            </Form.Item>
          </Col>
          
          {/* Permission Field */}
          <Col xs={24} md={12}>
            <Form.Item
              name="permission"
              label={
                <span className="flex items-center">
                  Permission {getStatusIndicator('permission')}
                </span>
              }
              rules={[{ required: true, message: "Permission is required" }]}
              validateStatus={validationStates.permission}
            >
              <Select 
                placeholder="Select permission"
                className="rounded-md"
                dropdownStyle={{ borderRadius: '8px' }}
                onChange={(value) => handleFieldValidation('permission', value)}
              >
                {Object.values(availablePermissions).map((perm) => (
                  <Option key={perm} value={perm}>
                    {perm.charAt(0).toUpperCase() + perm.slice(1)}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>
        
        <Row gutter={16}>
          {/* Position Field */}
          <Col xs={24} md={12}>
            <Form.Item
              name="position"
              label="Position"
            >
              <Select 
                placeholder="Select position"
                className="rounded-md"
                dropdownStyle={{ borderRadius: '8px' }}
                showSearch
                optionFilterProp="children"
              >
                <Option value="" disabled>Select Position</Option>
                {positions.length === 0 ? (
                  <Option value="" disabled>Loading positions...</Option>
                ) : (
                  positions.map((pos) => (
                    <Option key={pos.id} value={pos.name}>
                      {pos.name.charAt(0).toUpperCase() + pos.name.slice(1)}
                    </Option>
                  ))
                )}
              </Select>
            </Form.Item>
          </Col>
          
          {/* Department Field */}
          <Col xs={24} md={12}>
            <Form.Item
              name="department"
              label={
                <span className="flex items-center">
                  Department {getStatusIndicator('department')}
                </span>
              }
              rules={[{ required: true, message: "Department is required" }]}
              validateStatus={validationStates.department}
            >
              <Select 
                placeholder="Select department"
                className="rounded-md"
                dropdownStyle={{ borderRadius: '8px' }}
                showSearch
                optionFilterProp="children"
                onChange={(value) => handleFieldValidation('department', value)}
              >
                <Option value="" disabled>Select Department</Option>
                {departments.length === 0 ? (
                  <Option value="" disabled>Loading departments...</Option>
                ) : (
                  departments.map((dept) => (
                    <Option key={dept.id} value={dept.name}>
                      {dept.name.charAt(0).toUpperCase() + dept.name.slice(1)}
                    </Option>
                  ))
                )}
              </Select>
            </Form.Item>
          </Col>
        </Row>
        
        {/* Locations Field */}
        <Form.Item
          name="locations"
          label={
            <span className="flex items-center">
              Locations {getStatusIndicator('locations')}
            </span>
          }
          rules={[{ required: true, message: "At least one location is required" }]}
          validateStatus={validationStates.locations}
        >
          <Select 
            mode="multiple" 
            placeholder="Select locations"
            optionFilterProp="children"
            className="rounded-md"
            dropdownStyle={{ borderRadius: '8px' }}
            showSearch
            onChange={(value) => handleFieldValidation('locations', value)}
            dropdownRender={menu => (
              <div>
                <div className="p-2 border-b">
                  <Button 
                    type="link" 
                    size="small" 
                    onClick={() => {
                      const allLocations = locations.map(loc => loc.name);
                      form.setFieldsValue({ locations: allLocations });
                      handleFieldValidation('locations', allLocations);
                    }}
                  >
                    Select All
                  </Button>
                  <Button 
                    type="link" 
                    size="small" 
                    onClick={() => {
                      form.setFieldsValue({ locations: [] });
                      handleFieldValidation('locations', []);
                    }}
                  >
                    Clear All
                  </Button>
                </div>
                {menu}
              </div>
            )}
          >
            {locations.map((loc) => (
              <Option key={loc.id} value={loc.name}>
                {loc.name.charAt(0).toUpperCase() + loc.name.slice(1)}
              </Option>
            ))}
          </Select>
        </Form.Item>
        
        {/* Submit Button */}
        <Form.Item className="text-center mt-8">
          <Button
            type="primary"
            htmlType="submit"
            loading={isSubmitting}
            icon={userData.uid ? <SaveOutlined /> : <UserAddOutlined />}
            size="large"
            className="min-w-[200px] h-12 rounded-md shadow-md"
            disabled={similarUsers.length > 0}
          >
            {userData.uid ? "Save Changes" : "Create User"}
          </Button>
          
          {similarUsers.length > 0 && (
            <div className="mt-2 text-red-500 text-sm">
              Please resolve potential duplicate user issues before saving
            </div>
          )}
        </Form.Item>
      </Form>
    </Card>
  );
};

export default UserForm;
import React, { useState, useEffect } from "react";
import { Button, Skeleton, Form, Input, Tooltip } from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';
import { notifySuccess, notifyError, messageWarning } from "../../utils/notificationService";
import { getEmailSettings, updateEmailSettings } from "../../api/EmailSettingsApi";

const ManageEmailSettings = () => {
  const [form] = Form.useForm();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailSettings, setEmailSettings] = useState(null);

  // Fetch email settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const settings = await getEmailSettings();
        setEmailSettings(settings);
        
        // Initialise form with fetched settings
        form.setFieldsValue({
          defaultFrom: settings.defaultFrom,
          defaultReplyTo: settings.defaultReplyTo,
          defaultCc: settings.defaultCc?.join(', ') || ''
        });
      } catch (error) {
        console.error("Error fetching email settings:", error);
        notifyError("Failed to fetch email settings");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, [form]);

  const handleSubmit = async (values) => {
    // Validate and process CC emails
    let ccEmails = [];
    if (values.defaultCc) {
      ccEmails = values.defaultCc.split(',').map(email => email.trim());
      
      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      for (const email of ccEmails) {
        if (!emailRegex.test(email)) {
          messageWarning(`Invalid email in CC list: ${email}`);
          return;
        }
      }
    }

    setIsSubmitting(true);

    try {
      // Only send the fields that should be updated
      await updateEmailSettings({
        defaultReplyTo: values.defaultReplyTo,
        defaultCc: ccEmails
      });

      notifySuccess("Email settings updated successfully");
      
      // Update local state
      setEmailSettings({
        ...emailSettings,
        defaultReplyTo: values.defaultReplyTo,
        defaultCc: ccEmails
      });
    } catch (error) {
      notifyError("Failed to update email settings", error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <Skeleton active />;
  }

  return (
    <div className="flex justify-center items-center mt-2 px-4 sm:px-6 md:px-0">
      <div className="w-full max-w-2xl p-6 bg-white shadow-lg rounded-lg">
        <h2 className="text-xl font-semibold mb-4 text-center">Manage Email Settings</h2>

        <div className="mt-4 mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-700">
            These email settings are used for all system-generated emails. The FROM address is used to send the email, the REPLY-TO address receives responses from users, and the CC addresses receive copies of all sent emails.
          </p>
        </div>

        <div className="mb-6 p-4 bg-gray-100 rounded-lg">
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
          >
            <Form.Item
              name="defaultFrom"
              label={
                <span>
                  Default From Email&nbsp;
                  <Tooltip title="This email address cannot be changed as it requires verification with our email provider">
                    <InfoCircleOutlined style={{ color: '#1890ff' }} />
                  </Tooltip>
                </span>
              }
            >
              <Input 
                placeholder="Default FROM email address" 
                disabled 
                className="bg-gray-50 text-gray-500"
              />
            </Form.Item>

            <Form.Item
              name="defaultReplyTo"
              label="Default Reply-To Email"
              rules={[
                { required: true, message: 'Please enter the default REPLY-TO email address' },
                { type: 'email', message: 'Please enter a valid email address' }
              ]}
            >
              <Input placeholder="Default REPLY-TO email address" />
            </Form.Item>

            <Form.Item
              name="defaultCc"
              label="Default CC Emails"
              rules={[
                { required: true, message: 'Please enter at least one CC email address' }
              ]}
              extra="Separate multiple emails with commas"
            >
              <Input placeholder="Default CC email addresses" />
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                loading={isSubmitting}
                className="w-full sm:w-auto"
              >
                {isSubmitting ? "Updating..." : "Update Email Settings"}
              </Button>
            </Form.Item>
          </Form>
        </div>
      </div>
    </div>
  );
};

export default ManageEmailSettings;
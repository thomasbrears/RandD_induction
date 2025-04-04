import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Card, Button, Dropdown, Space, Typography, notification, Progress } from 'antd';
import axios from 'axios';
import { FilePdfOutlined, FileExcelOutlined, DownOutlined, LoadingOutlined } from '@ant-design/icons';
import { notifyError } from '../../utils/notificationService';
import useAuth from '../../hooks/useAuth';
import { 
    exportInductionResultsToExcel, 
    exportInductionResultsToPDF, 
    handleStaffExcelExport, 
    handleStaffPDFExport 
  } from '../../api/UserInductionApi';

const { Title, Text } = Typography;

// Export notification
const useExportNotification = () => {
  const [api, contextHolder] = notification.useNotification();
  
  const startExport = async (options) => {
    const { 
      type = 'full', 
      documentType = 'pdf', 
      name = 'Report',
      exportFunction 
    } = options;
    
    // Create a unique notification key
    const key = `export-${Date.now()}`;
    
    try {
      // Phase 1: Preparing
      api.info({
        key,
        message: 'Preparing Export',
        description: (
          <Space direction="vertical" style={{ width: '100%' }}>
            <Progress percent={20} status="active" />
            <Text>Preparing {type} {documentType.toUpperCase()} for {name}...</Text>
          </Space>
        ),
        icon: <LoadingOutlined style={{ color: '#1890ff' }} />,
        duration: 0,
        placement: 'topRight'
      });
      
      // Delay for first phase
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Phase 2: Generating
      api.info({
        key,
        message: 'Generating Document',
        description: (
          <Space direction="vertical" style={{ width: '100%' }}>
            <Progress percent={60} status="active" />
            <Text>Creating {documentType.toUpperCase()} file...</Text>
          </Space>
        ),
        icon: <LoadingOutlined style={{ color: '#722ed1' }} />,
        duration: 0,
        placement: 'topRight'
      });
      
      // Execute the actual export function
      const result = await exportFunction();
      
      // Phase 3: Downloading
      api.info({
        key,
        message: 'Downloading File',
        description: (
          <Space direction="vertical" style={{ width: '100%' }}>
            <Progress percent={90} status="active" />
            <Text>Downloading to your device...</Text>
          </Space>
        ),
        icon: <LoadingOutlined style={{ color: '#13c2c2' }} />,
        duration: 0,
        placement: 'topRight'
      });
      
      // Brief delay for download phase
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Success
      api.success({
        key,
        message: 'Export Complete',
        description: (
          <Space direction="vertical">
            <Text>Your {type} {documentType.toUpperCase()} for {name} has been exported successfully.</Text>
          </Space>
        ),
        duration: 4,
        placement: 'topRight'
      });
      
      return result;
    } catch (error) {
      // Error state
      api.error({
        key,
        message: 'Export Failed',
        description: (
          <Space direction="vertical">
            <Text type="danger">{error.message || 'An error occurred during export'}</Text>
            <Text type="secondary">Please try again or contact your manager if the issue persists.</Text>
          </Space>
        ),
        duration: 6,
        placement: 'topRight'
      });
      
      throw error; // Re-throw to handle in calling code
    }
  };
  
  return {
    contextHolder,
    startExport
  };
};

// Shared export section 
const ExportSection = ({ 
  // UI configuration props
  title = "Export Options",
  fullReportProps = {},
  summaryReportProps = {},
  
  // Event handler props
  onFullPdfExport,
  onFullExcelExport,
  onSummaryPdfExport,
  onSummaryExcelExport,

  // Flag for staff induction page report
  isStaffContext = false,
  
  // Data props for StaffInductionResults
  isCompleted = true,
  userInduction,
  induction,
  userData,
  sections,
  answers,
  
  // Data props for InductionResults
  activeAssignments,
  completedAssignments,
  stats
}) => {
  // Get auth context for user info
  const { user } = useAuth();
  
  // State to manage dropdown visibility and loading states
  const [fullReportDropdownOpen, setFullReportDropdownOpen] = useState(false);
  const [summaryReportDropdownOpen, setSummaryReportDropdownOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  
  // Use the export notification loader
  const { contextHolder: exportNotificationHolder, startExport } = useExportNotification();

  // Add CSS styles to head
  useEffect(() => {
    const styleElement = document.createElement('style');
    styleElement.textContent = `
      @keyframes pulse {
        0% {
          opacity: 0.6;
          transform: scale(0.98);
        }
        50% {
          opacity: 1;
          transform: scale(1.05);
        }
        100% {
          opacity: 0.6;
          transform: scale(0.98);
        }
      }
      
      .success-animation {
        animation: pop 0.5s ease-out;
      }
      
      @keyframes pop {
        0% {
          transform: scale(0.5);
          opacity: 0;
        }
        70% {
          transform: scale(1.2);
        }
        100% {
          transform: scale(1);
          opacity: 1;
        }
      }
    `;
    document.head.appendChild(styleElement);

    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);

  // Default text for export sections
  const defaultFullReportProps = {
    title: "Full Report",
    description: "Download or print the complete document with all data, details, and feedback.",
    buttonText: "Export Full Report"
  };

  const defaultSummaryReportProps = {
    title: "Summary Report",
    description: "Export a concise overview with key metrics, status, and essential information.",
    buttonText: "Export Summary"
  };

  // Merge defaults with provided props
  const fullProps = { ...defaultFullReportProps, ...fullReportProps };
  const summaryProps = { ...defaultSummaryReportProps, ...summaryReportProps };

  // Function to handle PDF export
  const handlePDFExport = async (type) => {
    try {
      setExporting(true);
      
      if (isStaffContext) {
        // Were in the staff induction results context (single staff member)
        const userInductionId = userInduction.id;
        const inductionName = userInduction.inductionName || userInduction.induction?.name || 'Induction';
        const staffName = user.displayName || 'Staff';
        
        const exportName = `${staffName} - ${inductionName}`;
                
        // Use notification with staff export function
        await startExport({
          type,
          documentType: 'pdf',
          name: exportName,
          exportFunction: async () => {
            await handleStaffPDFExport(user, userInductionId, staffName, inductionName, type);
          }
        });
      }
      else {
        // Were in the induction results context
        const inductionId = induction.id;
        const inductionName = induction.name;
                
        // Use notification with induction export function
        await startExport({
          type,
          documentType: 'pdf',
          name: inductionName,
          exportFunction: async () => {
            // Export all induction results
            const { url } = await exportInductionResultsToPDF(user, inductionId, type);
            
            // Make the request with axios
            const response = await axios({
              url,
              method: 'GET',
              responseType: 'blob',
              validateStatus: false // Don't throw error on non-2xx responses
            });
            
            // Handle error responses
            if (response.status !== 200) {
              if (response.data instanceof Blob) {
                const errorText = await response.data.text();
                console.error("Export API error response:", errorText);
                
                try {
                  // Try to parse as JSON to get a structured error
                  const errorJson = JSON.parse(errorText);
                  throw new Error(errorJson.error || errorJson.message || "Server error during export");
                } catch (e) {
                  // If it's not valid JSON, use the text as is
                  throw new Error(`Export failed with status ${response.status}: ${errorText.slice(0, 150)}...`);
                }
              } else {
                throw new Error(`Export failed with status ${response.status}`);
              }
            }
            
            // Create a blob URL and trigger download
            const blob = new Blob([response.data], {
              type: 'application/pdf'
            });
            const blobUrl = window.URL.createObjectURL(blob);
            
            // Create a temporary anchor to trigger download
            const a = document.createElement('a');
            a.href = blobUrl;
            a.download = `${inductionName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${type}_report.pdf`;
            document.body.appendChild(a);
            a.click();
            
            // Clean up
            window.URL.revokeObjectURL(blobUrl);
            document.body.removeChild(a);
          }
        });
      }
      
    } catch (error) {
      console.error("PDF Export failed:", error);
      // Notification is already handled by the hook
    } finally {
      setExporting(false);
    }
  };

  // Function to handle Excel export
  const handleExcelExport = async (type) => {
    try {
      setExporting(true);
      
      if (isStaffContext) {
        // Were in the staff induction results context (single staff member)
        const userInductionId = userInduction.id;
        const inductionName = userInduction.inductionName || userInduction.induction?.name || 'Induction';
        const staffName = user.displayName || 'Staff';
        
        const exportName = `${staffName} - ${inductionName}`;
                
        // Use notification with staff export function
        await startExport({
          type,
          documentType: 'excel',
          name: exportName,
          exportFunction: async () => {
            await handleStaffExcelExport(user, userInductionId, staffName, inductionName, type);
          }
        });
      } 
      else {
        // Were in the induction results context
        const inductionId = induction.id;
        const inductionName = induction.name;
                
        // Use notification with induction export function
        await startExport({
          type,
          documentType: 'excel',
          name: inductionName,
          exportFunction: async () => {
            // Export all induction results
            const { url } = await exportInductionResultsToExcel(user, inductionId, type);
            
            // Make the request with axios
            const response = await axios({
              url,
              method: 'GET',
              responseType: 'blob',
              validateStatus: false // Don't throw error on non-2xx responses
            });
            
            // Handle error responses
            if (response.status !== 200) {
              if (response.data instanceof Blob) {
                const errorText = await response.data.text();
                console.error("Export API error response:", errorText);
                
                try {
                  // Try to parse as JSON to get a structured error
                  const errorJson = JSON.parse(errorText);
                  throw new Error(errorJson.error || errorJson.message || "Server error during export");
                } catch (e) {
                  // If its not valid JSON, use the text as is
                  throw new Error(`Export failed with status ${response.status}: ${errorText.slice(0, 150)}...`);
                }
              } else {
                throw new Error(`Export failed with status ${response.status}`);
              }
            }
            
            // Create a blob URL and trigger download
            const blob = new Blob([response.data], {
              type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            });
            const blobUrl = window.URL.createObjectURL(blob);
            
            // Create a temporary anchor to trigger download
            const a = document.createElement('a');
            a.href = blobUrl;
            a.download = `${inductionName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${type}_report.xlsx`;
            document.body.appendChild(a);
            a.click();
            
            // Clean up
            window.URL.revokeObjectURL(blobUrl);
            document.body.removeChild(a);
          }
        });
      }
      
    } catch (error) {
      console.error("Excel Export failed:", error);
      // Notification is already handled by the hook
    } finally {
      setExporting(false);
    }
  };

  // Default handlers for non-implemented features
  const defaultHandler = (actionName) => {
    notifyError(actionName, "Feature coming soon");
  };

  // Dropdown menu for Full Report export options
  const fullReportMenuItems = [
    {
      key: 'excel',
      label: (
        <div onClick={onFullExcelExport || (() => handleExcelExport('full'))}>
          <FileExcelOutlined /> Export Excel
        </div>
      )
    },
    {
      key: 'pdf',
      label: (
        <div onClick={onFullPdfExport || (() => handlePDFExport('full'))}>
          <FilePdfOutlined /> Export PDF
        </div>
      )
    }
  ];

  // Dropdown menu for Summary export options
  const summaryReportMenuItems = [
    {
      key: 'excel',
      label: (
        <div onClick={onSummaryExcelExport || (() => handleExcelExport('summary'))}>
          <FileExcelOutlined /> Export Excel
        </div>
      )
    },
    {
      key: 'pdf',
      label: (
        <div onClick={onSummaryPdfExport || (() => handlePDFExport('summary'))}>
          <FilePdfOutlined /> Export PDF
        </div>
      )
    }
  ];

  // For StaffInductionResults, check if we should show the export section - If induction is complete, show it
  if (userInduction && isCompleted === false) return null;

  return (
    <>
      {/* Include the notification holder */}
      {exportNotificationHolder}
      
      <Card 
        title={<h2 className="text-lg font-semibold">{title}</h2>}
        className="shadow-md mb-6"
      >
        <div className="flex flex-col md:flex-row gap-4">
          {/* Full Report Export Section */}
          <div className="flex-1">
            <h3 className="text-md font-medium mb-2">{fullProps.title}</h3>
            <p className="text-xs text-gray-500 mb-2">
              {fullProps.description}
            </p>
            <Dropdown 
              menu={{ items: fullReportMenuItems }}
              open={fullReportDropdownOpen}
              onOpenChange={setFullReportDropdownOpen}
              disabled={exporting}
            >
              <Button block loading={exporting}>
                {fullProps.buttonText} <DownOutlined />
              </Button>
            </Dropdown>
          </div>

          {/* Summary Export Section */}
          <div className="flex-1">
            <h3 className="text-md font-medium mb-2">{summaryProps.title}</h3>
            <p className="text-xs text-gray-500 mb-2">
              {summaryProps.description}
            </p>
            <Dropdown 
              menu={{ items: summaryReportMenuItems }}
              open={summaryReportDropdownOpen}
              onOpenChange={setSummaryReportDropdownOpen}
              disabled={exporting}
            >
              <Button block loading={exporting}>
                {summaryProps.buttonText} <DownOutlined />
              </Button>
            </Dropdown>
          </div>
        </div>
      </Card>
    </>
  );
};

// PropTypes for type checking
ExportSection.propTypes = {
  // UI configuration props
  title: PropTypes.string,
  fullReportProps: PropTypes.object,
  summaryReportProps: PropTypes.object,
  
  // Event handler props
  onFullPdfExport: PropTypes.func,
  onFullExcelExport: PropTypes.func,
  onSummaryPdfExport: PropTypes.func,
  onSummaryExcelExport: PropTypes.func,

  isStaffContext: PropTypes.bool,

  // Data props for StaffInductionResults
  isCompleted: PropTypes.bool,
  userInduction: PropTypes.object,
  induction: PropTypes.object
};

export default ExportSection;
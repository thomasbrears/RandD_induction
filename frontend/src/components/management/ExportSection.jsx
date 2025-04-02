import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Card, Button, Dropdown, Space } from 'antd';
import { 
  FilePdfOutlined, 
  FileExcelOutlined, 
  PrinterOutlined, 
  DownOutlined 
} from '@ant-design/icons';
import { notifyError } from '../../utils/notificationService';

// Shared export section 
const ExportSection = ({ 
  // UI configuration props
  title = "Export Options",
  fullReportProps = {},
  summaryReportProps = {},
  
  // Event handler props
  onFullPdfExport,
  onFullExcelExport,
  onFullPrint,
  onSummaryPdfExport,
  onSummaryExcelExport,
  onSummaryPrint,
  
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
  // State to manage dropdown visibility
  const [fullReportDropdownOpen, setFullReportDropdownOpen] = useState(false);
  const [summaryReportDropdownOpen, setSummaryReportDropdownOpen] = useState(false);

  // Default handlers that show notifications
  const defaultHandler = (actionName) => {
    notifyError(actionName, "Feature coming soon");
  };

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

  // Dropdown menu for Full Report export options
  const fullReportMenuItems = [
    {
      key: 'pdf',
      label: (
        <div onClick={onFullPdfExport || (() => defaultHandler("Full PDF Export"))}>
          <FilePdfOutlined /> Export PDF
        </div>
      )
    },
    {
      key: 'excel',
      label: (
        <div onClick={onFullExcelExport || (() => defaultHandler("Full Excel Export"))}>
          <FileExcelOutlined /> Export Excel
        </div>
      )
    },
    {
      key: 'print',
      label: (
        <div onClick={onFullPrint || (() => defaultHandler("Full Print"))}>
          <PrinterOutlined /> Print
        </div>
      )
    }
  ];

  // Dropdown menu for Summary export options
  const summaryReportMenuItems = [
    {
      key: 'pdf',
      label: (
        <div onClick={onSummaryPdfExport || (() => defaultHandler("Summary PDF Export"))}>
          <FilePdfOutlined /> Export PDF
        </div>
      )
    },
    {
      key: 'excel',
      label: (
        <div onClick={onSummaryExcelExport || (() => defaultHandler("Summary Excel Export"))}>
          <FileExcelOutlined /> Export Excel
        </div>
      )
    },
    {
      key: 'print',
      label: (
        <div onClick={onSummaryPrint || (() => defaultHandler("Summary Print"))}>
          <PrinterOutlined /> Print
        </div>
      )
    }
  ];

  // For StaffInductionResults, check if we should show the export section - If induction is complete, show it
  if (userInduction && isCompleted === false) return null;

  return (
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
          >
            <Button block>
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
          >
            <Button block>
              {summaryProps.buttonText} <DownOutlined />
            </Button>
          </Dropdown>
        </div>
      </div>
    </Card>
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
  onFullPrint: PropTypes.func,
  onSummaryPdfExport: PropTypes.func,
  onSummaryExcelExport: PropTypes.func,
  onSummaryPrint: PropTypes.func,
  
  // Data props for StaffInductionResults
  isCompleted: PropTypes.bool,
  userInduction: PropTypes.object,
  induction: PropTypes.object,
  userData: PropTypes.object,
  sections: PropTypes.array,
  answers: PropTypes.object,
  
  // Data props for InductionResults
  activeAssignments: PropTypes.array,
  completedAssignments: PropTypes.array,
  stats: PropTypes.object
};

export default ExportSection;
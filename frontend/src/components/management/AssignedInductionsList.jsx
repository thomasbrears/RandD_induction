import { useState, useEffect } from "react";
import Status from "../../models/Status";
import ManageInductionModal from './ManageInductionModal';
import { messageError } from "../../utils/notificationService";
import { Skeleton } from "antd";
import { FileOutlined, InboxOutlined } from '@ant-design/icons';

const AssignedInductionsList = ({ 
  userInductions = [], 
  userId,
  currentUser, 
  onUpdateInduction,
  onDeleteInduction,
  isLoading = false
}) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedInduction, setSelectedInduction] = useState(null);
  const [displayState, setDisplayState] = useState('loading'); 
  
  // Separate inductions by status
  const unsortedActiveInductions = userInductions.filter(induction => induction.status !== Status.COMPLETE) || [];
  const completedInductions = userInductions.filter(induction => induction.status === Status.COMPLETE) || [];
  
  // Sort active inductions
  const activeInductions = [...unsortedActiveInductions].sort((a, b) => {
    // Overdue items first
    if (a.status === Status.OVERDUE && b.status !== Status.OVERDUE) return -1;
    if (a.status !== Status.OVERDUE && b.status === Status.OVERDUE) return 1;
    
    // Then sort by due date
    const dateA = a.dueDate ? new Date(a.dueDate) : new Date(9999, 11, 31); // Far future date if no due date
    const dateB = b.dueDate ? new Date(b.dueDate) : new Date(9999, 11, 31);
    
    return dateA - dateB;
  });

  // Control display state with a minimum loading time
  useEffect(() => {
    let timer;
    
    if (isLoading) {
      // Always show loading state when isLoading is true
      setDisplayState('loading');
      return;
    }
    
    // If we have data prepare to show it
    if (userInductions.length > 0) {
      // Even if data is available, keep the loading state for at least 300ms to avoid flickering for very quick loads
      timer = setTimeout(() => {
        setDisplayState('content');
      }, 300);
    } else {
      // If no data is available, keep showing loading state for 10 seconds before showing the empty state message
      timer = setTimeout(() => {
        setDisplayState('empty');
      }, 10000);
    }
    
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isLoading, userInductions]);

  // format a date for display
  const formatDate = (date) => {
    if (!date) return "N/A";
    
    try {
      if (date && typeof date === 'object' && (date._seconds !== undefined || date.seconds !== undefined)) {
        const seconds = date._seconds !== undefined ? date._seconds : date.seconds;
        return new Date(seconds * 1000).toLocaleDateString();
      }
      
      // Check if it's a regular Date object
      if (date instanceof Date) {
        return date.toLocaleDateString();
      }
      
      // If it has a toDate method
      if (date && typeof date.toDate === 'function') {
        return date.toDate().toLocaleDateString();
      }
      
      // Handle ISO string dates
      return new Date(date).toLocaleDateString();
    } catch (e) {
      console.error("Error formatting date:", e, date);
      return "Invalid Date";
    }
  };

  // Get induction name
  const getInductionName = (induction) => {
    return induction.name || induction.inductionName || (induction.induction?.name) || "Induction";
  };

  // Get completion date 
  const getCompletionDate = (induction) => {
    return induction.completionDate || induction.completedAt;
  };

  const handleManageInduction = (induction) => {

    // Make a deep copy to avoid reference issues
    const inductionCopy = { ...induction };
        
    // Function to normalise date format
    const normalizeDate = (dateField) => {
      if (!dateField) return null;
      
      try {
        // Handle Firestore Timestamp objects with _seconds
        if (typeof dateField === 'object' && dateField._seconds !== undefined) {
          return new Date(dateField._seconds * 1000).toISOString();
        }
        
        // Handle Firestore Timestamp objects with seconds
        if (typeof dateField === 'object' && dateField.seconds !== undefined) {
          return new Date(dateField.seconds * 1000).toISOString();
        }
        
        // Handle objects with toDate method
        if (typeof dateField === 'object' && typeof dateField.toDate === 'function') {
          return dateField.toDate().toISOString();
        }
        
        // If its already a Date object
        if (dateField instanceof Date) {
          return dateField.toISOString();
        }
        
        // If its already an ISO string, return as is
        if (typeof dateField === 'string') {
          // Validate if it's an ISO date string
          const date = new Date(dateField);
          if (!isNaN(date.getTime())) {
            return dateField;
          }
        }
        
        return null;
      } catch (e) {
        console.error("Error normalizing date:", e, dateField);
        return null;
      }
    };
    
    // Normalise all potential date fields
    inductionCopy.availableFrom = normalizeDate(induction.availableFrom);
    inductionCopy.dueDate = normalizeDate(induction.dueDate);
    inductionCopy.completedAt = normalizeDate(induction.completedAt);
    inductionCopy.completionDate = normalizeDate(induction.completionDate);
        
    setSelectedInduction(inductionCopy);
    setIsModalVisible(true);
  };

  // Handle Save function 
  const handleSave = async (updatedInduction) => {
    try {      
      // Call onUpdateInduction handler
      await onUpdateInduction(updatedInduction);
      
      setIsModalVisible(false); // Close the modal

    } catch (error) {
      console.error("Error updating induction:", error);
      messageError(`Failed to update induction: ${error.message || "Unknown error"}`);
      throw error; // Re-throw to be caught by the modal's promise handler
    }
  };

  // Handle Delete function
  const handleDelete = async () => {
    try {
      // Call onDeleteInduction handler
      await onDeleteInduction(selectedInduction);
      
      setIsModalVisible(false); // Close the modal
    } catch (error) {
      console.error("Error deleting induction:", error);
      messageError(`Failed to remove induction: ${error.message || "Unknown error"}`);
      throw error; // Re-throw to be caught by the modal's promise handler
    }
  };

  const handleCancel = () => {
    setIsModalVisible(false);
  };

  // Function to handle viewing results
  const handleViewResults = (induction) => {
    // TEMP: For now redirect to the results page
    window.location.href = `/management/inductions/results?inductionId=${induction.inductionId || induction.id}`;

  };

  const StatusBadge = ({ status }) => {
    const statusMapping = {
      [Status.ASSIGNED]: { label: 'Assigned', color: 'border-blue-500 text-blue-500' },
      [Status.IN_PROGRESS]: { label: 'In Progress', color: 'border-yellow-500 text-yellow-500' },
      [Status.COMPLETE]: { label: 'Completed', color: 'border-green-500 text-green-500' },
      [Status.OVERDUE]: { label: 'OVERDUE', color: 'border-red-500 text-white bg-red-500' },
    };

    const { label, color } = statusMapping[status] || { label: 'Status Unknown', color: 'border-gray-500 text-gray-500' };

    return (
      <span className={`px-2 py-1 border rounded ${color}`}>
        {label}
      </span>
    );
  };

  // Skeleton loading component for induction cards
  const InductionSkeleton = ({ count = 3 }) => {
    return (
      <div className="space-y-4">
        <div className="flex items-center mb-3">
          <Skeleton.Button active size="small" shape="circle" style={{ width: '12px', height: '12px', marginRight: '8px' }} />
          <Skeleton.Input active style={{ width: '180px', height: '24px' }} />
        </div>
        <Skeleton.Input active style={{ width: '180px', height: '24px' }} />

      </div>
    );
  };

  const renderContent = () => {
    if (displayState === 'loading') {
      return (
        <div className="space-y-6">
          <InductionSkeleton count={2} />
          
          <div className="mt-6">
            <div className="flex items-center mb-3">
              <Skeleton.Button active size="small" shape="circle" style={{ width: '12px', height: '12px', marginRight: '8px' }} />
              <Skeleton.Input active style={{ width: '180px', height: '24px' }} />
            </div>
            <InductionSkeleton count={1} />
          </div>
        </div>
      );
    }
    
    if (displayState === 'empty') {
      return (
        <div className="py-8 text-center">
          <InboxOutlined className="text-gray-400 text-5xl mb-4" />
          <p className="text-gray-600">No assigned inductions for this user.</p>
          <p className="text-gray-500 text-sm mt-1">Use the form above to assign new inductions.</p>
        </div>
      );
    }
    
    // Display state is conten
    return (
      <div className="space-y-6">
        {/* Active Inductions */}
        {activeInductions.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
              <span className="inline-block w-3 h-3 rounded-full bg-blue-500 mr-2"></span>
              Active Inductions
            </h2>
            
            <div className="space-y-3">
              {activeInductions.map((induction, index) => (
                <div key={index} className="bg-white border rounded-lg shadow-sm hover:shadow-md transition-shadow">
                  <div className="p-4">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start">
                      <div className="flex-grow">
                        <div className="flex flex-wrap items-center gap-2 mb-2 sm:mb-0">
                          <h3 className="font-medium text-gray-900">{getInductionName(induction)}</h3>
                          <StatusBadge status={induction.status} />
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center mt-1 text-sm text-gray-600">
                          <span className="mb-1 sm:mb-0 sm:mr-4">
                            <span className="font-medium">Available From:</span> {formatDate(induction.availableFrom)}
                          </span>
                          <span>
                            <span className="font-medium">Due on:</span> {formatDate(induction.dueDate)}
                          </span>
                        </div>
                      </div>
                      
                      <div className="mt-3 sm:mt-0 sm:ml-6 flex-shrink-0">
                        <button 
                          className="w-full sm:w-auto inline-flex items-center justify-center px-5 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                          onClick={() => handleManageInduction(induction)}
                        >Manage
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Completed Inductions */}
        {completedInductions.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
              <span className="inline-block w-3 h-3 rounded-full bg-green-500 mr-2"></span>
              Completed Inductions
            </h2>
            
            <div className="space-y-3">
              {completedInductions.map((induction, index) => (
                <div key={index} className="bg-white border rounded-lg shadow-sm hover:shadow-md transition-shadow">
                  <div className="p-4">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start">
                      <div className="flex-grow">
                        <div className="flex flex-wrap items-center gap-2 mb-1 sm:mb-0">
                          <h3 className="font-medium text-gray-900">{getInductionName(induction)}</h3>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center mt-1 text-sm text-gray-600 gap-1 sm:gap-4">
                          <span className="mb-1 sm:mb-0">
                            <span className="font-medium">Completed on:</span> {formatDate(getCompletionDate(induction))}
                          </span>
                          <span className="mb-1 sm:mb-0">
                            <span className="font-medium">Available From:</span> {formatDate(induction.availableFrom)}
                          </span>
                          <span>
                            <span className="font-medium">Due on:</span> {formatDate(induction.dueDate)}
                          </span>
                        </div>
                      </div>
                      
                      <div className="mt-4 sm:mt-0 sm:ml-6 flex-shrink-0">
                        <div className="flex flex-col sm:flex-row gap-3">
                          <button 
                            className="w-full sm:w-auto inline-flex items-center justify-center px-5 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                            onClick={() => handleManageInduction(induction)}
                          >Manage
                          </button>
                          
                          <button 
                            className="w-full sm:w-auto inline-flex items-center justify-center px-5 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-gray-700 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
                            onClick={() => handleViewResults(induction)}
                          >Results
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white shadow-lg rounded-lg overflow-hidden w-full max-w-4xl mx-auto">
      {/* Header with gradient background */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 px-6 py-4">
        <h1 className="text-xl font-bold text-white flex items-center">
          <FileOutlined className="mr-2 text-xl" />
          Assigned Inductions
        </h1>
        <p className="text-blue-100 text-sm mt-1">Manage existing inductions assigned to this user</p>
      </div>

      <div className="p-6">
        {renderContent()}
      </div>

      {/* Render the induction management modal */}
      {selectedInduction && (
        <ManageInductionModal
          visible={isModalVisible}
          onCancel={handleCancel}
          onSave={handleSave}
          onDelete={handleDelete}
          inductionData={selectedInduction}
        />
      )}
    </div>
  );
};

export default AssignedInductionsList;
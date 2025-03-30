import { useState } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { DatePicker, Select } from 'antd';
import dayjs from "dayjs";
import { notifyPromise } from "../../utils/notificationService";
import InductionSelectionModal from './InductionSelectionModal';
import Status from "../../models/Status";
import { 
  PlusOutlined, 
  SaveOutlined, 
  DeleteOutlined, 
  MenuOutlined,
  LoadingOutlined,
  SearchOutlined
} from '@ant-design/icons';

const InductionAssignmentForm = ({ 
  userData, 
  availableInductions, 
  existingInductions = [], 
  onAssignInductions
}) => {
  const [newAssignments, setNewAssignments] = useState([]);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSelectionModalVisible, setIsSelectionModalVisible] = useState(false);
  const [currentInductionIndex, setCurrentInductionIndex] = useState(null);
  const { RangePicker } = DatePicker;
  
  const methods = useForm({
    mode: "onChange",
  });

  const validateInductions = (inductions) => {
    const newErrors = {};
    
    if (inductions) {
      const uniqueIds = new Set();
      inductions.forEach((induction, index) => {
        if (!induction.inductionId) {
          newErrors[`induction-${index}`] = "Please select an induction";
        }
        
        if (induction.inductionId && uniqueIds.has(induction.inductionId)) {
          newErrors[`induction-${index}`] = "Duplicate inductions are not allowed";
        } else if (induction.inductionId) {
          uniqueIds.add(induction.inductionId);
        }

        if (induction.dueDate && induction.availableFrom && new Date(induction.dueDate) < new Date(induction.availableFrom)) {
          newErrors[`date-${index}`] = "Due date must be after the available from date";
        }

        const existingInduction = existingInductions.find(existing => 
          existing.inductionId === induction.inductionId && existing.status !== Status.COMPLETE
        );
        
        if (existingInduction) {
          newErrors[`induction-${index}`] = `This induction is already assigned and not completed`;
        }
      });
    }

    return newErrors;
  };

  const handleSubmit = async (data) => {
    // Prevent multiple submissions
    if (isSubmitting) return;
    
    const validationErrors = validateInductions(newAssignments);
    
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    // Create a promise for the assignment process
    const assignmentPromise = new Promise(async (resolve, reject) => {
      try {
        setIsSubmitting(true);
        await onAssignInductions(newAssignments);
        
        // Clear assignments on success
        setNewAssignments([]);
        
        resolve("Inductions assigned successfully");
      } catch (error) {
        console.error("Error assigning inductions:", error);
        reject(error);
      } finally {
        setIsSubmitting(false);
      }
    });

    notifyPromise(assignmentPromise, {
      pending: "Assigning inductions...",
      success: "Inductions assigned successfully",
      error: (error) => `Failed to assign inductions: ${error.message || "Unknown error"}`
    });
  };

  const handleAddInduction = () => {
    const newInduction = {
      inductionId: "",
      name: "",
      dueDate: new Date().toISOString(),
      availableFrom: new Date().toISOString(),
      status: Status.ASSIGNED
    };
    const updatedInductions = [...newAssignments, newInduction];
    setNewAssignments(updatedInductions);
  };

  const handleRemoveInduction = (index) => {
    const updatedInductions = newAssignments.filter((_, i) => i !== index);
    setNewAssignments(updatedInductions);
    
    // Clear any errors
    const newErrors = { ...errors };
    delete newErrors[`induction-${index}`];
    delete newErrors[`date-${index}`];
    setErrors(newErrors);
  };

  const handleInductionChange = (index, field, value, label) => {
    const updatedInductions = [...newAssignments];
  
    if (!updatedInductions[index]) {
      updatedInductions[index] = {
        inductionId: "",
        name: "",
        dueDate: new Date().toISOString(),
        availableFrom: new Date().toISOString(),
        status: Status.ASSIGNED
      };
    }
  
    if (field === "inductionId" || field === "id") {
      updatedInductions[index].inductionId = value;
      updatedInductions[index].name = label;
      updatedInductions[index].id = value; // For compatibility

      
      // Clear any error for this induction when selected
      const newErrors = { ...errors };
      delete newErrors[`induction-${index}`];
      setErrors(newErrors);
    }
  
    // Handle date range separately
    if (field === "dateRange" && value) {
      updatedInductions[index].availableFrom = value[0]?.toISOString(); // Store as ISO
      updatedInductions[index].dueDate = value[1]?.toISOString();
      
      // Clear any date error when dates are changed
      const newErrors = { ...errors };
      delete newErrors[`date-${index}`];
      setErrors(newErrors);
    } else {
      updatedInductions[index][field] = value;
    }
  
    setNewAssignments(updatedInductions);
  };

  // Handler for selecting an induction from the modal
  const handleSelectInduction = (induction) => {
    if (currentInductionIndex !== null) {
      handleInductionChange(
        currentInductionIndex, 
        "inductionId", 
        induction.id, 
        induction.name
      );
    }
    
    setIsSelectionModalVisible(false);
  };

  // Function to open the browse modal
  const handleBrowseClick = (index) => {
    setCurrentInductionIndex(index);
    setIsSelectionModalVisible(true);
  };

  // Get current induction selection
  const getCurrentInductionSelection = () => {
    if (currentInductionIndex === null || !newAssignments[currentInductionIndex]) {
      return null;
    }
    return newAssignments[currentInductionIndex].inductionId || newAssignments[currentInductionIndex].id;
  };

  // Filter out inductions that are already assigned and incomplete or in draft mode
  const getSelectableInductions = () => {
    return availableInductions.filter(induction => {
      // Exclude draft inductions
      if (induction.isDraft) {
        return false;
      }
      
      // Exclude already assigned and incomplete inductions
      const existingInduction = existingInductions.find(existing => 
        existing.inductionId === induction.id && existing.status !== Status.COMPLETE
      );
      return !existingInduction;
    });
  };
  
  // Sort inductions by availability and name
  const getSortedSelectableInductions = () => {
    const selectable = getSelectableInductions();
    return selectable.sort((a, b) => a.name.localeCompare(b.name));
  };

  return (
    <>
      <div className="bg-white shadow-lg rounded-lg overflow-hidden w-full max-w-4xl mx-auto">
        {/* Header with gradient background */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 px-6 py-4">
          <h1 className="text-xl font-bold text-white flex items-center">
            <PlusOutlined className="mr-2 text-xl" />
            Assign New Inductions
          </h1>
          <p className="text-blue-100 text-sm mt-1">Select inductions to assign to this user</p>
        </div>
        
        <div className="p-6">
          <FormProvider {...methods}>
            <form onSubmit={methods.handleSubmit(handleSubmit)} className="w-full">
              {/* Empty state when no inductions added */}
              {newAssignments.length === 0 ? (
                <div className="flex justify-center py-6">
                  <button
                    type="button"
                    onClick={handleAddInduction}
                    className="inline-flex items-center px-5 py-3 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <PlusOutlined className="mr-2" />
                    Add Induction
                  </button>
                </div>
              ) : (
                <>
                  {/* Assignments list with cards */}
                  <div className="space-y-6 mb-6">
                    {newAssignments.map((induction, index) => (
                      <div
                        key={index}
                        className="bg-white rounded-lg border shadow-sm overflow-hidden transition-all hover:shadow-md"
                      >
                        {/* Card header with number indicator */}
                        <div className="bg-gray-50 px-4 py-3 border-b flex justify-between items-center">
                          <div className="flex items-center">
                            <span className="flex items-center justify-center h-6 w-6 rounded-full bg-blue-100 text-blue-800 text-xs font-bold mr-2">
                              {index + 1}
                            </span>
                            <h3 className="font-medium text-gray-700">Induction Assignment</h3>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveInduction(index)}
                            className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm rounded-md text-red-600 bg-white hover:bg-red-50 hover:border-red-300 transition-colors"
                          >
                            <DeleteOutlined className="mr-1" />
                            Remove
                          </button>
                        </div>
                        
                        {/* Card body */}
                        <div className="px-4 py-5 space-y-4">
                          {/* Induction selection with inline search and browse option */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor={`induction-${index}`}>
                              Select Induction <span className="text-red-500">*</span>
                            </label>
                            
                            <div className="flex space-x-2">
                              <div className="flex-grow">
                                {/* Inline searchable dropdown */}
                                <Select
                                  id={`induction-${index}`}
                                  showSearch
                                  placeholder="Search and select an induction"
                                  optionFilterProp="children"
                                  value={induction.inductionId || undefined}
                                  onChange={(value, option) => handleInductionChange(index, "inductionId", value, option.label)}
                                  filterOption={(input, option) => 
                                    option.label.toLowerCase().includes(input.toLowerCase())
                                  }
                                  className={`w-full ${
                                    errors[`induction-${index}`] ? 'border-red-500' : ''
                                  }`}
                                  status={errors[`induction-${index}`] ? "error" : ""}
                                  suffixIcon={<SearchOutlined />}
                                  options={getSortedSelectableInductions().map(ind => ({
                                    value: ind.id,
                                    label: ind.name
                                  }))}
                                />
                              </div>
                              <button
                                type="button"
                                onClick={() => handleBrowseClick(index)}
                                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                              >
                                <MenuOutlined className="mr-2" />
                                Browse All
                              </button>
                            </div>
                            
                            {errors[`induction-${index}`] && (
                              <p className="mt-1 text-sm text-red-600">
                                {errors[`induction-${index}`]}
                              </p>
                            )}
                          </div>
                          
                          {/* Date range selection */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor={`dates-${index}`}>
                              Available From & Due Date <span className="text-red-500">*</span>
                            </label>
                            <RangePicker
                              id={`dates-${index}`}
                              value={
                                induction.availableFrom && induction.dueDate
                                  ? [dayjs(induction.availableFrom), dayjs(induction.dueDate)]
                                  : [null, null]
                              }
                              onChange={(dates) => {
                                if (dates) {
                                  const availableFrom = dates[0].startOf("day");
                                  const dueDate = dates[1].endOf("day");
                                  handleInductionChange(index, "dateRange", [availableFrom, dueDate]);
                                }
                              }}
                              disabledDate={(current) => current && current < dayjs().startOf("day")}
                              format="DD-MM-YYYY"
                              className="w-full"
                              placeholder={['Available From', 'Due Date']}
                              status={errors[`date-${index}`] ? "error" : ""}
                            />
                            {errors[`date-${index}`] && (
                              <p className="mt-1 text-sm text-red-600">
                                {errors[`date-${index}`]}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4 border-t">
                    <button
                      type="button"
                      onClick={handleAddInduction}
                      className="order-2 sm:order-1 w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <PlusOutlined className="mr-2" />
                      Add Another Induction
                    </button>
                    
                    <button
                      className="order-1 sm:order-2 w-full sm:w-auto inline-flex items-center justify-center px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-400 disabled:cursor-not-allowed"
                      type="submit"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <LoadingOutlined className="mr-2" />
                          Assigning...
                        </>
                      ) : (
                        <>
                          <SaveOutlined className="mr-2" /> 
                          Save Assignments
                        </>
                      )}
                    </button>
                  </div>
                </>
              )}
            </form>
          </FormProvider>
        </div>
      </div>

      {/* Render the induction selection modal */}
      <InductionSelectionModal
        visible={isSelectionModalVisible}
        onCancel={() => setIsSelectionModalVisible(false)}
        onSelect={handleSelectInduction}
        availableInductions={availableInductions}
        currentSelection={getCurrentInductionSelection()}
        alreadyAssignedInductions={existingInductions}
      />
    </>
  );
};

export default InductionAssignmentForm;
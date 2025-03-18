import { useState, useEffect } from "react";
import Select from "react-select";
import { DefaultNewUser } from "../../models/User";
import { useForm, FormProvider } from "react-hook-form";
import useAuth from "../../hooks/useAuth";
import { DatePicker } from 'antd';
import dayjs from "dayjs";
import "react-datepicker/dist/react-datepicker.css";
import { getAllInductions } from "../../api/InductionApi";
import { DefaultNewAssignedInduction } from "../../models/AssignedInduction";
import Status from "../../models/Status";
import { useLocation, useNavigate } from "react-router-dom";
import ManageInductionModal from './ManageInductionModal';
import { FaSave, FaPlus } from 'react-icons/fa';
import { IoRemoveCircle } from "react-icons/io5";
import ChangeUser from './ChangeUser';


export const UserInductionManagement = ({ userData = DefaultNewUser, onSubmit }) => {
  const [user, setUser] = useState({ ...DefaultNewUser, position: '' });
  const [availableInductions, setAvailableInductions] = useState([]);
  const [newAssignedInductions, setNewAssignedInductions] = useState([]);
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [clickedFields, setClickedFields] = useState(new Set());
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedInduction, setSelectedInduction] = useState(null);
  const { RangePicker } = DatePicker;
  
  // Separate inductions by status
  const activeInductions = user.assignedInductions?.filter(induction => induction.status !== Status.COMPLETE) || [];
  const completedInductions = user.assignedInductions?.filter(induction => induction.status === Status.COMPLETE) || [];

  const [errors, setErrors] = useState({});
  const methods = useForm({
    defaultValues: userData,
    mode: "onChange",
  });

  const validateInductions = (inductions) => {
    const newErrors = {};
    
    if (inductions) {
      const uniqueIds = new Set();
      inductions.forEach((induction, index) => {
        if (!induction.id) {
          newErrors[`induction-${index}`] = "Please select an induction";
        }
        
        if (induction.id && uniqueIds.has(induction.id)) {
          newErrors[`induction-${index}`] = "Duplicate inductions are not allowed";
        } else if (induction.id) {
          uniqueIds.add(induction.id);
        }

        if (induction.dueDate && induction.availableFrom && induction.dueDate < induction.availableFrom) {
          newErrors[`date-${index}`] = "Due date must be after the available from date";
        }

        const existingInduction = Array.isArray(user.assignedInductions)
          ? user.assignedInductions.find(existing => existing.id === induction.id)
          : undefined;

        if (existingInduction && existingInduction.status !== Status.COMPLETE) {
          newErrors[`induction-${index}`] = `This induction is already assigned and not completed`;
        }
      });
    }

    return newErrors;
  };

  useEffect(() => {
    const fetchInductions = async () => {
      if (currentUser) {
        const inductions = await getAllInductions(currentUser);
        setAvailableInductions(inductions);
      }
    };
    fetchInductions();
  }, [currentUser]);

  useEffect(() => {
    setUser(userData);
    methods.reset(userData);
    if (userData.uid) {
      methods.trigger();
    }
  }, [userData, methods]);

  const handleSubmit = async (data) => {
    const validationErrors = validateInductions(newAssignedInductions);
    
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setUser(data);
    const userToSubmit = {
      ...user,
      
      assignedInductions: [
        ...(user.assignedInductions || []),
        ...(data.newAssignedInductions || []).map((induction) => ({
          ...DefaultNewAssignedInduction,
          ...induction,
        })),
      ],
    };

    await onSubmit(userToSubmit);

    if (!userData.uid) {
        methods.reset(DefaultNewUser); // Reset form for new user creation
        setUser(DefaultNewUser); // Reset state for new user creation
        setNewAssignedInductions([]); // Clear newly added inductions
      } else {
        setUser(userToSubmit); // Only update the inductions for existing users
        methods.reset(user); // Reset form with the existing user data
        setNewAssignedInductions([]); // Clear newly added inductions
      }
    };

  const handleAddInduction = () => {
    const newInduction = {
      ...DefaultNewAssignedInduction,
      dueDate: new Date(),
      availableFrom: new Date(),
    };
    const updatedInductions = [...newAssignedInductions, newInduction];
    setNewAssignedInductions(updatedInductions);
    methods.setValue("newAssignedInductions", updatedInductions, {
      shouldValidate: true,
    });
  };

  const handleRemoveInduction = (index) => {
    const updatedInductions = newAssignedInductions.filter(
      (_, i) => i !== index
    );
    setNewAssignedInductions(updatedInductions);
    methods.setValue("newAssignedInductions", updatedInductions, {
      shouldValidate: true,
    });
  };

  const handleInductionChange = (index, field, value, label) => {
    const updatedInductions = [...newAssignedInductions];
  
    if (!updatedInductions[index]) {
      updatedInductions[index] = { ...DefaultNewAssignedInduction };
    }
  
    if (field === "id" && label) {
      updatedInductions[index].name = label;
    }
  
    // Handle date range separately
    if (field === "dateRange" && value) {
      updatedInductions[index].availableFrom = value[0]?.toISOString(); // Store as ISO
      updatedInductions[index].dueDate = value[1]?.toISOString();
    } else {
      updatedInductions[index][field] = value;
    }
  
    setNewAssignedInductions(updatedInductions);
    methods.setValue("newAssignedInductions", updatedInductions, {
      shouldValidate: true,
    });
  };
  

  const handleManageInduction = (induction) => {
    setSelectedInduction(induction); // Set the induction data
    setIsModalVisible(true); // Show the modal
  };

  const handleSave = async (updatedInduction) => {

    //console.log(updatedInduction);

    // Update the induction in the user's assignedInductions array
    const updatedAssignedInductions = user.assignedInductions.map((induction) =>
      induction.id === updatedInduction.id ? updatedInduction : induction
    );
  
    // Update the user data
    const updatedUser = {
      ...user,
      assignedInductions: updatedAssignedInductions,
    };
    setUser(updatedUser);
  
    // Call the onSubmit function to update the user with the new induction data
    await onSubmit(updatedUser);
  
    // Close the modal after saving the updated induction
    setIsModalVisible(false);
  };  

  const handleCancel = () => {
    setIsModalVisible(false); // Close the modal without saving
  };

  {/* Delete the induction from the user's assignedInductions array */}
  const handleDelete = async () => {
    // Remove the induction from the assignedInductions array
    const updatedAssignedInductions = user.assignedInductions.filter(
      (induction) => induction.id !== selectedInduction.id
    );
  
    // Update the user state immediately
    setUser((prevUser) => ({
      ...prevUser,
      assignedInductions: updatedAssignedInductions,
    }));
  
    // Call the onSubmit function to update the user data in the backend
    await onSubmit({
      ...user,
      assignedInductions: updatedAssignedInductions,
    });
  
    // Close the modal after deleting the induction
    setIsModalVisible(false);
  };

  const handleDateFieldClick = (fieldId) => {
    const newClickedFields = new Set(clickedFields);
  
    // Always add the clicked field to the set of clicked fields
    newClickedFields.add(fieldId);
    setClickedFields(newClickedFields);
  
    // Clear the specific date field, even if it has content
    const [index, field] = fieldId.split('-');
    const updatedInductions = [...newAssignedInductions];
    if (updatedInductions[index]) {
      updatedInductions[index][field] = null; // Clear the date field
      setNewAssignedInductions(updatedInductions);
      methods.setValue("newAssignedInductions", updatedInductions, {
        shouldValidate: true,
      });
    }
  };

  const handleUserSelect = (selectedUser) => {
    setUser(selectedUser); // Set the user data after selecting a user
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

  return (
    <>

    <ChangeUser onUserSelect={handleUserSelect} />

    {/* Assign new induction */}
    <div className="flex flex-col items-start justify-center pt-8 px-2 sm:px-4 md:px-6 lg:px-8">
        <div className="bg-white shadow-lg rounded-lg p-4 sm:p-6 md:p-8 w-full max-w-4xl mx-auto">
            <FormProvider {...methods}>
            <form onSubmit={methods.handleSubmit(handleSubmit)} className="w-full">
                <div className="w-full px-1 sm:px-3 flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
                    <h1 className="text-left text-lg sm:text-xl font-semibold mb-2 sm:mb-0">Assign a New Induction</h1>
                    <button
                        type="button"
                        onClick={handleAddInduction}
                        className="text-white bg-gray-700 hover:bg-gray-900 px-3 py-2 rounded-md text-sm sm:text-base w-full sm:w-auto"
                    >
                        <FaPlus className="inline mr-2" /> Add Induction
                    </button>
                </div>

                {/* Show the induction details only if inductions are present */}
                {newAssignedInductions.length > 0 && (
                <div className="space-y-4">
                    {newAssignedInductions.map((induction, index) => (
                    <div
                        key={index}
                        className="p-4 rounded-md border-2 shadow-md mb-4"
                    >
                        <div className="flex items-center space-x-2 mb-2">
                        <Select
                            options={availableInductions.map((ind) => ({
                            value: ind.id,
                            label: ind.name,
                            }))}
                            onChange={(selected) =>
                            handleInductionChange(index, "id", selected.value, selected.label)
                            }
                            value={
                            availableInductions.find((ind) => ind.id === induction.id)
                                ? {
                                    value: induction.id,
                                    label: availableInductions.find((ind) => ind.id === induction.id).name,
                                }
                                : null
                            }
                            className="flex-1 w-3/4"
                        />
                        <button
                            type="button"
                            onClick={() => handleRemoveInduction(index)}
                            className="text-white bg-red-700 hover:bg-red-900 px-3 py-2 text-xs sm:text-sm rounded-md">
                            <IoRemoveCircle className="inline mr-2" /> Remove
                        </button>
                        </div>

                        <div className="flex flex-col md:flex-row space-x-0 md:space-x-4 mb-2">
                          <div className="flex flex-col w-full mb-2 md:mb-0">
                            <label
                              className="block uppercase tracking-wide text-gray-700 text-xs font-bold mb-1"
                              htmlFor="available-from"
                            >
                              Available From & Due Date:
                            </label>
                            <RangePicker
                              value={
                                newAssignedInductions[index]?.availableFrom && newAssignedInductions[index]?.dueDate
                                  ? [dayjs(newAssignedInductions[index].availableFrom), dayjs(newAssignedInductions[index].dueDate)]
                                  : [null, null] // Default to null for both dates
                              }
                              onChange={(dates) => {
                                if (dates) {
                                  const availableFrom = dates[0].startOf("day");
                                  const dueDate = dates[1].endOf("day"); // Use selected due date
                                  handleInductionChange(index, "dateRange", [availableFrom, dueDate]);
                                }
                              }}
                              disabledDate={(current) => current && current < dayjs().startOf("day")} // Disable past dates
                              format="DD-MM-YYYY"
                              className="w-full md:w-3/4"
                            />
                          </div>
                        </div>

                        {/* Error messages displayed here */}
                        {errors[`induction-${index}`] && (
                            <p className="text-red-500 text-xs italic mt-2">
                            {errors[`induction-${index}`]}
                            </p>
                        )}

                        {errors[`date-${index}`] && (
                            <p className="text-red-500 text-xs italic mt-2">
                            {errors[`date-${index}`]}
                            </p>
                        )}
                    </div>
                    ))}
                </div>
                )}

                {/* Hide the save button if no inductions are added */}
                {newAssignedInductions.length > 0 && (
                <div className="flex justify-center mt-4">
                    <button
                    className="text-white bg-blue-500 hover:bg-blue-600 px-3 py-2 rounded-md"
                    type="submit"
                    >
                    <FaSave className="inline mr-2" /> Assign Inductions | SAVE
                    </button>
                </div>
                )}
            </form>
            </FormProvider>
        </div>
    </div>

    {/* AssignedInduction List */}
    {user.uid && (
      <div className="flex items-start justify-center pt-8">
        <div className="bg-white shadow-lg rounded-lg p-8 w-full max-w-4xl mx-4 md:mx-8">
          <h1 className="text-left text-lg sm:text-xl font-semibold mb-2 sm:mb-0">Assigned Inductions</h1>
          <hr className="mb-4" />
          {Array.isArray(user.assignedInductions) && user.assignedInductions.length > 0 ? (
            <div className="overflow-x-auto">
              <div className="w-full">
                {/* Active Inductions */}
                {activeInductions.length > 0 && (
                  <>
                    <h2 className="text-left text-lg sm:text-lg font-semibold sm:mb-0">Active Inductions</h2>
                    {/* Table structure on Desktop */}
                    <div className="max-[970px]:hidden grid grid-cols-[2fr_1fr_1fr_1fr_2fr] gap-4 text-left">
                      {["Induction Name", "Available From", "Due Date", "Status", " "].map((header) => (
                        <div key={header} className="font-semibold">{header}</div>
                      ))}
                    </div>
                    {/* Flexbox Layout on Mobile */}
                    {activeInductions.map((induction, index) => {
                      const formatDate = (date) => (date ? new Date(date).toLocaleDateString() : "N/A");
                      return (
                        <div key={index} className="py-2 border-b border-gray-200 hover:bg-gray-50">
                          <div className="max-[970px]:hidden grid grid-cols-[2fr_1fr_1fr_1fr_2fr] gap-4 text-left">
                            <div>{induction.name}</div>
                            <div>{formatDate(induction.availableFrom)}</div>
                            <div>{formatDate(induction.dueDate)}</div>
                            <div><StatusBadge status={induction.status} /></div>
                            <div><button className="bg-blue-500 text-white py-1 px-3 rounded hover:bg-blue-600" onClick={() => handleManageInduction(induction)}>Manage</button></div>
                          </div>
                          {/* Mobile View */}
                          <div className="min-[970px]:hidden">
                            <div className="mb-2 mt-4 text-lg">
                              <strong>{induction.name}</strong> &nbsp; <StatusBadge status={induction.status} />
                            </div>
                            <div className="mb-2">
                             Available From <strong>{formatDate(induction.availableFrom)}</strong> and due on <strong>{formatDate(induction.dueDate)}</strong>
                            </div>
                            <div className="mt-2">
                              <button className="bg-blue-500 text-white py-1 px-3 rounded hover:bg-blue-600" onClick={() => handleManageInduction(induction)}>Manage</button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </>
                )}

                {/* Completed Inductions */}
                {completedInductions.length > 0 && (
                  <>
                    <h2 className="text-left text-lg sm:text-lg font-semibold text-green-500 mt-4 sm:mb-0">Completed Inductions</h2>
                    {/* Table structure on Desktop */}
                    <div className="max-[970px]:hidden grid grid-cols-[2fr_1fr_1fr_1fr_2fr] gap-4 text-left">
                      {["Induction Name", "Available From", "Due Date", "Completion Date", ""].map((header) => (
                        <div key={header} className="font-semibold">{header}</div>
                      ))}
                    </div>
                    {completedInductions.map((induction, index) => {
                      const formatDate = (date) => (date ? new Date(date).toLocaleDateString() : "N/A");
                      return (
                        <div key={index} className="py-2 border-b border-gray-200 hover:bg-gray-50">
                          <div className="max-[970px]:hidden grid grid-cols-[2fr_1fr_1fr_1fr_2fr] gap-4 text-left">
                            <div>{induction.name}</div>
                            <div>{formatDate(induction.availableFrom)}</div>
                            <div>{formatDate(induction.dueDate)}</div>
                            <div>{formatDate(induction.completionDate)}</div>
                            <div>
                              <button className="bg-blue-500 text-white py-1 px-3 rounded hover:bg-blue-600 mr-2" onClick={() => handleManageInduction(induction)}>Manage</button>
                              <button className="bg-gray-700 text-white py-1 px-3 rounded hover:bg-gray-900">View Results</button>
                            </div>
                          </div>
                          {/* Mobile View (Inline Labels) */}
                          <div className="min-[970px]:hidden">
                            <div className=" mt-4 text-lg">
                              <strong>{induction.name}</strong>
                            </div>
                            <div className="mb-2">
                              (Completed on {formatDate(induction.completionDate)})
                            </div>
                            <div className="mb-2 text-xs">
                             Was available from <strong>{formatDate(induction.availableFrom)}</strong> and due on <strong>{formatDate(induction.dueDate)}</strong>
                            </div> 
                            <div className="mt-2">
                              <button className="bg-blue-500 text-white py-1 px-3 rounded hover:bg-blue-600 mr-2" onClick={() => handleManageInduction(induction)}>Manage</button>
                              
                              <button className="bg-gray-700 text-white py-1 px-3 rounded hover:bg-gray-900">View Results</button>
                            </div>
                            
                          </div>
                        </div>
                      );
                    })}
                  </>
                )}
              </div>
            </div>
          ) : (
            <p className="text-gray-600 text-center">No assigned inductions for this user.</p>
          )}
        </div>
      </div>
    )}


      {/* Render the modal */}
      {selectedInduction && (
        <ManageInductionModal
          visible={isModalVisible}
          onCancel={handleCancel}
          onSave={handleSave}
          onDelete={handleDelete}
          inductionData={selectedInduction}
        />
      )}
    </>
  );
};

export default UserInductionManagement;
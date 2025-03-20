import React, { useState, useEffect } from "react";
import { Helmet } from 'react-helmet-async'; 
import { createNewInduction } from "../../api/InductionApi";
import { messageWarning, notifySuccess } from '../../utils/notificationService';
import PageHeader from "../../components/PageHeader";
import ManagementSidebar from "../../components/ManagementSidebar";
import InductionForm from "../../components/InductionForm";
import { DefaultNewInduction } from "../../models/Inductions";
import useAuth from "../../hooks/useAuth";
import { getAllDepartments } from "../../api/DepartmentApi";
import { FaEdit, FaSave, FaCheck } from 'react-icons/fa';
import { Modal, Result, Button } from 'antd';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css'; // import styles

const InductionCreate = () => {
  const { user } = useAuth(); // Get the user object from the useAuth hook

  // States for managing the induction data and ui states
  const [induction, setInduction] = useState({
    ...DefaultNewInduction,
    department: "",
  });
  const [showModal, setShowModal] = useState(false);
  const [isSubmitDisabled, setIsSubmitDisabled] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [isEditingDepartment, setIsEditingDepartment] = useState(false);
  const [Departments, setDepartments] = useState([]);
  const [showResult, setShowResult] = useState(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  // Functions for toggling edit/view modes for department and description
  const TOGGLE_EDIT_DEPARTMENT = () => setIsEditingDepartment((prev) => !prev);
  const TOGGLE_EDIT_DESCRIPTION = () => setIsEditingDescription((prev) => !prev);

  // Define the toolbar options
  const MODULES = {
    toolbar: [["bold", "italic", "underline"]],
  };

  const FORMATS = ["bold", "italic", "underline"];

  // Function to handle form submission, validate inputs and call API
  const HANDLE_SUBMIT = async (e) => {
    e.preventDefault();

    // Check if any required fields are missing and show warning if so
    const missingFields = [];
    if (!induction.name) missingFields.push("Induction name");
    if (!induction.department) missingFields.push("Department");
    if (!induction.description) missingFields.push("Description");

    if (missingFields.length > 0) {
      messageWarning(`Please fill in the following fields: ${missingFields.join(", ")}`);
      return;
    }

    // user exists, send api request to create new induction
    if (user) {
      const result = await createNewInduction(user, induction);
      console.log(result);
      //notifySuccess("Induction created successfully");

      // Set the showResult state to true to display the success screen
      setShowResult(true);
    }
  };

  // Function to update description as the user types
  const HANDLE_DESCRIPTION_CHANGE = (e) => {
    setInduction({
      ...induction,
      description: e.target.value,
    });
  };

    // Function to update department as the user types
  const HANDLE_DEPARTMENT_CHANGE = (e) => {
    setInduction({
      ...induction,
      department: e.target.value,
    });
  };

  // check if all fields are filled before enabling submit button
  useEffect(() => {
    if (!induction.name) {
      setShowModal(true);
    }

    const isFormComplete = induction.name && induction.department && induction.description;
    setIsSubmitDisabled(!isFormComplete);
  }, [induction]);

  // Handle closing modal
  const HANDLE_CLOSE_MODAL = () => {
    if (induction.name && induction.department && induction.description) {
      setShowModal(false);
    } else {
      messageWarning("Please complete all required fields before continuing.");
    }
  };
  
  // Step navigation functions for modal
  const HANDLE_NEXT_STEP = () => setCurrentStep((prevStep) => prevStep + 1);
  const HANDLE_PREVIOUS_STEP = () => setCurrentStep((prevStep) => prevStep - 1);

  useEffect(() => {
    const getDepartments = async () => {
      const data = await getAllDepartments();
      setDepartments(data);
    };
    getDepartments();
  }, []);

  // Detect window resizing
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };
    
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // If screen width is smaller than 900px, show a warning page
  if (windowWidth < 900) {
    return (

      <Result
        status="info"
        title="Sorry, this device is not supported for creating inductions"
        subTitle="Sorry, our induction modual creation tool requires a desktop, laptop, or a large tablet in landscape orientation to work optimally. Please switch to a supported device and try again."
        extra={[
          <Button type="primary" key="home" onClick={() => window.location.href = "/management/dashboard"}>
            Management Dashboard
          </Button>,
          <Button  key="home" onClick={() => window.location.href = "/management/inductions/view"}>
            View all Inductions
          </Button>
        ]}
      />
    );
  }

  return (
    <>
      {/* Helmet for setting page metadata */}
      <Helmet><title>Create Induction | AUT Events Induction Portal</title></Helmet>
  
      {/* Page Header */}
      <PageHeader title="Create Induction" subtext="Create new induction module" />
  
      {/* Confirmation Result Screen */}
      {showResult ? (
        <Result
          status="success"
          title="Induction Created Successfully!"
          subTitle="Your induction module has been created and can now be assigned to users."
          extra={[
            <Button type="primary" key="home" onClick={() => window.location.href = "/management/inductions/view"}>
              View all Inductions
            </Button>,
            <Button type="primary" key="home" onClick={() => window.location.href = "/management/inductions/create"}>
              Create Another Induction
            </Button>,
            <Button key="home" onClick={() => window.location.href = "/management/users/view"}>
              View & Manage Users
            </Button>,
            <Button key="home" onClick={() => window.location.href = "/management/dashboard"}>
              Go to Management Dashboard
            </Button>
          ]}
        />
      ) : (
        <>
          {/* Modal for induction creation steps */}
          {showModal && (
            <Modal
              visible={showModal}
              title={currentStep === 0
                ? "Welcome, Let's create your induction module."
                : currentStep === 1
                ? "Name"
                : currentStep === 2
                ? "Department"
                : "Description"}
              onCancel={HANDLE_CLOSE_MODAL}
              footer={null}
              width={600}  
              closable={false} // Disable the close "X" button as all fields are required
              style={{
                top: '50%',  
                transform: 'translateY(-50%)',  
              }}
              responsive={{
                xs: { width: '95%' }, // Full width on mobile
                sm: { width: '80%' }, // 80% width on small screens
              }}
            >
              <div>
                {currentStep === 0 && (
                  <div>
                    <p className="mb-4 text-gray-700">
                      Please complete the next questions to proceed to the questions section.
                    </p>
                  </div>
                )}

                {currentStep === 1 && (
                  <div>
                    <p className="mb-2 text-gray-500">What should we refer to this induction as?</p>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={induction.name}
                      onChange={(e) => setInduction({ ...induction, name: e.target.value })}
                      placeholder="e.g. General Health and Safety Induction"
                      className="w-full border border-gray-300 rounded-lg p-2 text-base focus:ring-gray-800 focus:border-gray-800"
                    />
                  </div>
                )}

                {currentStep === 2 && (
                  <div>
                    <p className="mb-2 text-gray-500">Which department does this induction best fit to?</p>
                    <select
                      id="department"
                      name="department"
                      value={induction.department}
                      onChange={(e) => setInduction({ ...induction, department: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg p-2 text-base focus:ring-gray-800 focus:border-gray-800"
                    >
                      <option value="">Select a department</option>
                      {Departments.map((dept) => (
                        <option key={dept.id} value={dept.name}>
                          {dept.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {currentStep === 3 && (
                  <div>
                    <p className="mb-2 text-gray-500">How should we describe what this induction covers? (Please be detailed)</p>
                    <ReactQuill
                      value={induction.description}
                      onChange={(value) => setInduction({ ...induction, description: value })}
                      placeholder="e.g. This induction covers the general health and safety across AUT and covers the following topics..."
                      className="w-full h-40 p-2 text-base focus:ring-gray-800 focus:border-gray-800"
                      modules={MODULES}
                      formats={FORMATS}
                    />
                  </div>
                )}
              </div>

              <div className="flex justify-between mt-12">
                {currentStep > 0 && (
                  <Button onClick={HANDLE_PREVIOUS_STEP} type="default">
                    Back
                  </Button>
                )}
                <Button
                  onClick={currentStep === 3 ? HANDLE_CLOSE_MODAL : HANDLE_NEXT_STEP}
                  type="primary"
                  disabled={
                    (currentStep === 1 && !induction.name) ||
                    (currentStep === 2 && !induction.department) ||
                    (currentStep === 3 && !induction.description)
                  }
                >
                  {currentStep === 3 ? "Continue to add questions" : "Next"}
                </Button>
              </div>
            </Modal>
          )}
  
          {/* Main content area */}
          <div className="flex bg-gray-50">
            {/* Management Sidebar */}
            <div className="hidden md:flex">
              <ManagementSidebar />
            </div>
  
            <div className="flex-1">
              {/* Induction Form Component */}
              <InductionForm
                induction={induction}
                setInduction={setInduction}
                handleSubmit={HANDLE_SUBMIT}
                isSubmitDisabled={isSubmitDisabled}
              />
  
              {/* Main content for managing induction details */}
              <div className="p-4 mx-auto max-w-5xl space-y-6">
                <div className="bg-white p-6 rounded-lg shadow-md space-y-6">
                  {/* Department Section */}
                  <div className="space-y-2">
                    <label htmlFor="department" className="text-sm font-bold text-gray-700 flex items-center">
                      Department:
                      {!isEditingDepartment ? (
                        <button
                          type="button"
                          onClick={TOGGLE_EDIT_DEPARTMENT}
                          className="ml-2 text-gray-600 hover:text-gray-800"
                          title="Edit department"
                        >
                          <FaEdit />
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={TOGGLE_EDIT_DEPARTMENT}
                          className="bg-gray-800 font-normal text-white px-3 py-1 rounded-md text-sm ml-2 flex items-center"
                        >
                          <FaCheck className="inline mr-2" /> Update
                        </button>
                      )}
                    </label>
                    {isEditingDepartment ? (
                      <div className="flex items-center space-x-2">
                        <select
                          id="department"
                          name="department"
                          value={induction.department}
                          onChange={HANDLE_DEPARTMENT_CHANGE}
                          className="border border-gray-300 rounded-lg p-2 focus:ring-gray-800 focus:border-gray-800"
                        >
                          <option value="">Select a department</option>
                          {Departments.map((dept) => (
                            <option key={dept.id} value={dept.name}>
                              {dept.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    ) : (
                      <span className="text-base">{induction.department || "Select a department"}</span>
                    )}
                  </div>
  
                  {/* Description Section */}
                  <div className="space-y-2">
                    <label htmlFor="description" className="text-sm font-bold text-gray-700 flex items-center">
                      Description:
                      {!isEditingDescription ? (
                        <button
                          type="button"
                          onClick={TOGGLE_EDIT_DESCRIPTION}
                          className="ml-2 text-gray-600 hover:text-gray-800"
                          title="Edit description"
                        >
                          <FaEdit />
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={TOGGLE_EDIT_DESCRIPTION}
                          className="bg-gray-800 font-normal text-white px-3 py-1 rounded-md text-sm ml-2 flex items-center"
                        >
                          <FaCheck className="inline mr-2" /> Update
                        </button>
                      )}
                    </label>
                    {isEditingDescription ? (
                      <ReactQuill
                        value={induction.description}
                        onChange={(value) => setInduction({ ...induction, description: value })}
                        placeholder="Enter description"
                        className="w-full h-50 p-2 text-base focus:ring-gray-800 focus:border-gray-800"
                        modules={MODULES}
                        formats={FORMATS}
                      />
                      ) : (
                      <p className="text-base" dangerouslySetInnerHTML={{ __html: induction.description || "No description added" }} />
                    )}
                  </div>

                </div>
  
                {/* Questions Section */}
                <hr />
                <div className="flex-1">
                  <h2 className="text-xl font-semibold">Questions</h2>
                  <p className="text-sm text-gray-500">Let's add some questions to the induction!</p>
                </div>
  
                <div className="bg-white p-6 rounded-lg shadow-md">
                  <p>Add question functionality in development</p>
                </div>
  
                {/* Save/Create Button */}
                <div className="flex justify-center mt-6">
                  <button
                    type="button"
                    onClick={HANDLE_SUBMIT}
                    className="text-white bg-gray-800 hover:bg-gray-900 px-4 py-2 rounded-md"
                    disabled={isSubmitDisabled}
                  >
                    <FaSave className="inline mr-2" /> Create Induction
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );  
};

export default InductionCreate;
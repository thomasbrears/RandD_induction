import React, { useState, useEffect } from "react";
import { Helmet } from 'react-helmet-async';
import { toast } from 'react-toastify';
import PageHeader from "../../components/PageHeader";
import ManagementSidebar from "../../components/ManagementSidebar";
import { DefaultNewInduction } from "../../models/Inductions";
import useAuth from "../../hooks/useAuth";
import { FaSave } from 'react-icons/fa';
import { Modal, Result, Button } from 'antd';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css'; // import styles
import InductionFormHeader from "../../components/InductionFormHeader";
import InductionFormContent from "../../components/InductionFormContent";
import { getAllDepartments } from "../../api/DepartmentApi";
import Loading from "../../components/Loading";
import { MODULES, FORMATS } from "../../models/QuillConfig";
import { createNewInduction } from "../../api/InductionApi";
import { useNavigate } from "react-router-dom";

const InductionCreate = () => {
  const { user } = useAuth(); // Get the user object from the useAuth hook

  // States for managing the induction data and ui states
  const [induction, setInduction] = useState({
    ...DefaultNewInduction,
    department: "",
  });

  const [showModal, setShowModal] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [fieldsBeingEdited, setFieldsBeingEdited] = useState({});
  const [saveAllFields, setSaveAllFields] = useState(false);
  const [actionType, setActionType] = useState(null);
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [expandOnError, setExpandOnError] = useState(false);
  const [savingInProgress, setSavingInProgress] = useState(false);
  const [Departments, setDepartments] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const getDepartments = async () => {
      const data = await getAllDepartments();
      setDepartments(data);
    };
    getDepartments();
  }, []);

  const updateFieldsBeingEdited = (field, state) => {
    setFieldsBeingEdited((prev) => {
      if (state === null) {
        const updatedFields = { ...prev };
        delete updatedFields[field];
        return updatedFields;
      }

      return { ...prev, [field]: state };
    });
  };

  const handleCancelAndReturnButton =() =>{
    navigate(-1); 
  };

  const handleSubmitButton = () => {
    const missingFields = checkForMissingFields();
    const hasEdits = Object.keys(fieldsBeingEdited).length > 0;

    if (missingFields.length === 0) {
      setActionType(hasEdits ? "unsaved" : "submit");
    } else {
      setActionType(hasEdits ? "unfinished" : "prompt");
    }

    setConfirmModalVisible(true);
  };

  const confirmSubmitActionHandler = () => {
    if (actionType === "submit" || actionType === "unsaved") {
      handleSubmit();
      setConfirmModalVisible(false);
      return;
    }
  };

  const handleSaveAndCheck = () => {
    if (actionType === "unsaved" || actionType === "unfinished") {
      if (savingInProgress) return;
      setSaveAllFields(true);
      setSavingInProgress(true);
      setTimeout(handleFailedSave, 5000);
    } else {
      setConfirmModalVisible(false);
    }
  };

  const handleFailedSave = () => {
    if (savingInProgress) return;
    setSavingInProgress(false);
    setSaveAllFields(false);
    setActionType("failedSave");
  };

  useEffect(() => {
    setExpandOnError(false)
  }, [expandOnError]);

  const handleCancel = () => {
    setConfirmModalVisible(false);
    if (checkForMissingFields().length > 0 || Object.keys(fieldsBeingEdited).length > 0) {
      setExpandOnError(true);
    }
  };

  useEffect(() => {
    if (!savingInProgress) return;

    const updatedMissingFields = checkForMissingFields();
    const hasEditsAfterSaving = Object.keys(fieldsBeingEdited).length > 0;

    if (!hasEditsAfterSaving) {
      setSavingInProgress(false);
      setSaveAllFields(false);
      if (updatedMissingFields.length === 0) {
        setActionType("submit");
      } else {
        setActionType("prompt");
      }
    }

  }, [savingInProgress, fieldsBeingEdited])

  // Function to handle form submission, validate inputs and call API
  const handleSubmit = async () => {

    // Double check if any required fields are missing and show warning if so
    const missingFields = checkForMissingFields();

    if (missingFields.length > 0) {
      toast.warn(`Please fill in the following fields: ${missingFields.join(", ")}`);
      console.log(missingFields);
      return;
    }

    // user exists, send api request to update induction
    if (user) {
      const result = await createNewInduction(user, induction);
      console.log(result);
      toast.success("Induction updated successfully!");
    }
    setShowResult(true);
  };

  const checkForMissingFields = () => {
    const missingFields = [];

    const isContentEmpty = (content) => {
      const strippedContent = content.replace(/<[^>]+>/g, '').trim();
      return strippedContent === '';
    };

    if (!induction.name || induction.name.trim() === "") {
      missingFields.push("Induction needs a name.");
    }
    if (!induction.description || isContentEmpty(induction.description)) {
      missingFields.push("Induction needs a description.");
    }
    if (induction.department === "Select a department" || !induction.department) {
      missingFields.push("Please select a department.");
    }

    // Check if there is at least one question
    if (!induction.questions || induction.questions.length === 0) {
      missingFields.push("Add at least one question.");
    } else {
      let questionsMissingAnswer = 0;
      let questionsMissingText = 0;
      let questionsMissingType = 0;
      let questionsMissingOptions = 0;
      let optionsMissingText = 0;

      induction.questions.forEach((question) => {
        if (!question.question || question.question.trim() === "") {
          questionsMissingText++;
        }

        if (!question.type || question.type.trim() === "") {
          questionsMissingType++;
        }

        if (!question.answers || question.answers.length === 0) {
          questionsMissingAnswer++;
        }

        if (!question.options || question.options.length === 0) {
          questionsMissingOptions++;
        } else {
          question.options.forEach((option) => {
            if (!option.trim()) {
              optionsMissingText++;
            }
          });
        }
      });

      // Summarize missing fields for questions
      if (questionsMissingText > 0) {
        missingFields.push(`${questionsMissingText} question${questionsMissingText > 1 ? "s" : ""} need${questionsMissingText > 1 ? "" : "s"} text.`);
      }
      if (questionsMissingType > 0) {
        missingFields.push(`${questionsMissingType} question${questionsMissingType > 1 ? "s" : ""} need${questionsMissingText > 1 ? "" : "s"} a type.`);
      }
      if (questionsMissingAnswer > 0) {
        missingFields.push(`${questionsMissingAnswer} question${questionsMissingAnswer > 1 ? "s" : ""} need${questionsMissingText > 1 ? "" : "s"} at least one answer.`);
      }
      if (questionsMissingOptions > 0) {
        missingFields.push(`${questionsMissingOptions} question${questionsMissingOptions > 1 ? "s" : ""} need${questionsMissingText > 1 ? "" : "s"} options.`);
      }
      if (optionsMissingText > 0) {
        missingFields.push(`${optionsMissingText} option${optionsMissingText > 1 ? "s" : ""} need${questionsMissingText > 1 ? "" : "s"} text.`);
      }
    }

    return missingFields;
  };

  // Handle closing modal
  const HANDLE_CLOSE_MODAL = () => {
    if (induction.name && induction.department && induction.description) {
      setShowModal(false);
    } else {
      toast.warn("Please complete all required fields before continuing.");
    }
  };

  // Step navigation functions for modal
  const HANDLE_NEXT_STEP = () => setCurrentStep((prevStep) => prevStep + 1);
  const HANDLE_PREVIOUS_STEP = () => setCurrentStep((prevStep) => prevStep - 1);

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
                ? "Welcome, let's create your induction module."
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
                <Button onClick={handleCancelAndReturnButton} type="default">
                  Cancel and Return
                </Button>
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

            {!showModal && (
              <>
                <Modal
                  title="Confirm Action"
                  open={confirmModalVisible}
                  onCancel={handleCancel}
                  footer={
                    <div className="flex flex-wrap justify-end gap-2 sm:flex-nowrap">
                      {actionType === "submit" && (
                        <Button key="submitConfirm" type="primary" className="w-auto min-w-0 text-sm" onClick={confirmSubmitActionHandler}>
                          Submit
                        </Button>
                      )}
                      {actionType === "unsaved" && (
                        <Button key="unsavedConfirm" type="primary" danger className="w-auto min-w-0 text-sm" onClick={confirmSubmitActionHandler}>
                          Discard & Submit
                        </Button>
                      )}
                      {(actionType === "prompt" || actionType === "unfinished" || actionType === "failedSave") && (
                        <Button key="continueEditing" type="default" className="w-auto min-w-0 text-sm" onClick={handleCancel}>
                          Continue Editing
                        </Button>
                      )}
                      {(actionType === "unsaved" || actionType === "unfinished") && (
                        <Button key="saveAndCheck" type="primary" className="w-auto min-w-0 text-sm" onClick={handleSaveAndCheck} disabled={savingInProgress}>
                          Save & Check
                        </Button>
                      )}
                      <Button key="cancel" type="default" className="w-auto min-w-0 text-sm" onClick={handleCancel}>
                        Cancel
                      </Button>
                    </div>
                  }
                >
                  {savingInProgress ? (
                    <div className="flex justify-center items-center">
                      <Loading message="Saving changes..." />
                    </div>
                  ) : (
                    <>
                      {actionType === "submit" && <p>Are you sure you want to submit this induction?</p>}
                      {actionType === "unsaved" && <p>You have unsaved changes. Are you sure you want to discard them and submit?</p>}
                      {actionType === "prompt" && (
                        <>
                          <p>Some details are missing. Please review the list below and try again.</p>
                          <hr />
                          <p>Issues that need attention:</p>
                          <ul>{checkForMissingFields().map((field) => <li key={field}>{field}</li>)}</ul>
                        </>
                      )}
                      {actionType === "unfinished" && <p>You have unsaved and missing fields. Would you like to save first?</p>}
                      {actionType === "failedSave" && (
                        <>
                          <p>Some fields couldn't be saved. Please check the details and try again.</p>
                          {checkForMissingFields().length > 0 && (
                            <>
                              <hr />
                              <p>Issues that need attention:</p>
                              <ul>{checkForMissingFields().map((field) => <li key={field}>{field}</li>)}</ul>
                            </>
                          )}
                        </>
                      )}
                    </>
                  )}
                </Modal>

                <div className="flex-1 min-w-0">
                  {/* Induction Form Component */}
                  <InductionFormHeader
                    induction={induction}
                    setInduction={setInduction}
                    handleSubmit={handleSubmitButton}
                    isCreatingInduction={true}
                    saveAllFields={saveAllFields}
                    updateFieldsBeingEdited={updateFieldsBeingEdited}
                  />

                  {/* Main content for managing induction details */}
                  <div className="p-4 mx-auto w-full max-w-full sm:max-w-3xl md:max-w-4xl lg:max-w-5xl space-y-6">

                    <InductionFormContent
                      induction={induction}
                      setInduction={setInduction}
                      saveAllFields={saveAllFields}
                      expandOnError={expandOnError}
                      updateFieldsBeingEdited={updateFieldsBeingEdited}
                    />

                    {/* Save Button */}
                    <div className="flex justify-center mt-6">
                      <Button
                        type="primary"
                        onClick={handleSubmitButton}
                        className="text-white bg-gray-800 hover:bg-gray-900 px-4 py-5 text-base rounded-md"
                        title="Save Induction"
                      >
                        <FaSave className="inline mr-2" /> Create Induction
                      </Button>
                    </div>
                  </div>
                </div>
              </>
            )}


          </div>
        </>
      )}
    </>
  );
};

export default InductionCreate;
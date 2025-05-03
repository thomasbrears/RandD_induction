import React, { useState, useEffect } from "react";
import { Helmet } from 'react-helmet-async';
import { messageWarning, notifySuccess } from '../../utils/notificationService';
import PageHeader from "../../components/PageHeader";
import ManagementSidebar from "../../components/ManagementSidebar";
import { DefaultNewInduction } from "../../models/Inductions";
import useAuth from "../../hooks/useAuth";
import { FaSave } from 'react-icons/fa';
import { Modal, Result, Button } from 'antd';
import 'react-quill/dist/quill.snow.css'; // import styles
import InductionFormHeader from "../../components/InductionFormHeader";
import InductionFormContent from "../../components/InductionFormContent";
import { getAllDepartments } from "../../api/DepartmentApi";
import Loading from "../../components/Loading";
import { updateInduction, createNewInduction } from "../../api/InductionApi";
import { useNavigate } from "react-router-dom";
import TiptapEditor from "../../components/TiptapEditor";
import { uploadFile } from "../../api/FileApi";

const InductionCreate = () => {
  const { user } = useAuth();// Get the user object from the useAuth hook

  // States for managing the induction data and ui states
  const [induction, setInduction] = useState({
    ...DefaultNewInduction,
    department: "",
  });

  const [showModal, setShowModal] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [actionType, setActionType] = useState(null);
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [Departments, setDepartments] = useState([]);
  const navigate = useNavigate();
  const [fileBuffer, setFileBuffer] = useState(new Map());
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');

  useEffect(() => {
    const getDepartments = async () => {
      const data = await getAllDepartments();
      setDepartments(data);
    };
    getDepartments();
  }, []);

  //File Handling
  const handleFileBufferUpdate = (questionId, file) => {
    setFileBuffer(prev => {
      const newBuffer = new Map(prev);
      if (file) {
        newBuffer.set(questionId, file);
      } else {
        newBuffer.delete(questionId);
      }
      return newBuffer;
    });
  };

  const getImageUrl = async (questionId) => {
    const file = fileBuffer.get(questionId);
    return file ? URL.createObjectURL(file) : null;
  };

  const handleUploadNewQuestionFiles = async (inductionId) => {
    let updatedInduction = { ...induction };

    const getFileName = (question, file) => `induction_images/${inductionId}/${question.id}_${file.name}`;

    for (const q of induction.questions) {
      const hasFileInBuffer = fileBuffer.has(q.id);
      const currentFileName = q.imageFile;

      if (hasFileInBuffer) {
        const file = fileBuffer.get(q.id);
        const finalFileName = getFileName(q, file);

        if (currentFileName !== finalFileName) {
          try {
            const result = await uploadFile(user, file, finalFileName);
            const uploadedFileName = result.gcsFileName || finalFileName;

            updatedInduction = {
              ...updatedInduction,
              questions: updatedInduction.questions.map((question) =>
                question.id === q.id
                  ? { ...question, imageFile: uploadedFileName }
                  : question
              ),
            };
          } catch (err) {
            messageWarning(`Failed to upload file for question ${q.id}`, err);
          }
        }
      }
    }

    return updatedInduction;
  };

  const handleCancelAndReturnButton = () => {
    navigate(-1);
  };

  const handleSubmitButton = () => {
    const missingFields = checkForMissingFields();

    if (missingFields.length === 0) {
      setActionType("submit");
    } else {
      messageWarning(`Please fill in the following fields: ${missingFields.join(", ")}`);
      setActionType("prompt");
    }

    setConfirmModalVisible(true);
  };

  const confirmSubmitActionHandler = () => {
    if (actionType === "submit") {
      handleSubmit();
      setConfirmModalVisible(false);
      return;
    }
  };

  const handleCancel = () => {
    setConfirmModalVisible(false);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setLoadingMessage(`Creating new Induction...`);

    if (!user) return;

    const result = await createNewInduction(user, induction);

    if (!result || !result.id) {
      setLoading(false);
      messageWarning("Error while creating induction.");
      return;
    }

    // Upload files
    const updatedInduction = await handleUploadNewQuestionFiles(result.id);

    const fullUpdatedInduction = {
      ...updatedInduction,
      id: result.id,
    };
    const updateResult = await updateInduction(user, fullUpdatedInduction);

    setLoading(false);
    if (updateResult) {
      notifySuccess("Induction created successfully!");
    } else {
      messageWarning("Induction created but failed to update image references.");
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
    if (!induction.questions || induction.questions.length === 0) {
      missingFields.push("Add at least one question.");
    }

    return missingFields;
  };

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
              open={showModal}
              title={currentStep === 0
                ? "Welcome, let's create your induction module."
                : currentStep === 1
                  ? "Name"
                  : currentStep === 2
                    ? "Department"
                    : "Description"
              }
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
                    <p className="mb-2 text-gray-500">e.g. This induction covers the general health and safety across AUT and covers the following topics...</p>
                    <TiptapEditor localDescription={induction.description} handleChange={(value) => setInduction({ ...induction, description: value })} />
                  </div>
                )}
              </div>

              {/* Button Section */}
              <div className="flex justify-between mt-12">
                <div className="flex justify-between w-full">
                  {/* Cancel and Return Button - Bottom Left */}
                  <Button
                    onClick={handleCancelAndReturnButton}
                    type="default"
                    className="mr-4"
                  >
                    Cancel and Return
                  </Button>

                  {/* Back and Next Buttons - Bottom Right */}
                  <div className="flex space-x-4">
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
                </div>
              </div>
            </Modal>
          )}

          {/* Main content area */}
          {loading && <Loading message={loadingMessage} />} {/* Loading animation */}
          <div className="flex bg-gray-50 w-full">
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
                      {(actionType === "prompt") && (
                        <Button key="continueEditing" type="default" className="w-auto min-w-0 text-sm" onClick={handleCancel}>
                          Continue Editing
                        </Button>
                      )}
                      {(!(actionType === "prompt")) && (
                        <Button key="cancel" type="default" className="w-auto min-w-0 text-sm" onClick={handleCancel}>
                          Cancel
                        </Button>
                      )}
                    </div>
                  }
                >
                  <>
                    {actionType === "submit" && <p>Are you sure you want to submit this induction?</p>}
                    {actionType === "prompt" && (
                      <>
                        <p>Some details are missing. Please review the list below and try again.</p>

                        {checkForMissingFields().length > 0 && (
                          <>
                            <div className="mt-4"></div>
                            <div className="p-4 bg-gray-50 border-l-4 border-gray-300 text-gray-700 rounded-md">
                              <p className="font-medium">Issues that need attention:</p>
                              <ul className="list-disc list-inside mt-2 space-y-1">
                                {checkForMissingFields().map((field) => (
                                  <li key={field} className="ml-4">{field}</li>
                                ))}
                              </ul>
                            </div>
                          </>
                        )}
                      </>
                    )}
                  </>
                </Modal>

                <div className="flex-1 min-w-0">
                  {/* Induction Form Component */}
                  <InductionFormHeader
                    induction={induction}
                    setInduction={setInduction}
                    handleSubmit={handleSubmitButton}
                    isCreatingInduction={true}
                  />

                  {/* Main content for managing induction details */}
                  <div className="p-4 mx-auto w-full max-w-full sm:max-w-3xl md:max-w-4xl lg:max-w-5xl space-y-6">

                    <InductionFormContent
                      induction={induction}
                      setInduction={setInduction}
                      getImageUrl={getImageUrl}
                      saveFileChange={handleFileBufferUpdate}
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
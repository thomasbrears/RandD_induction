import React, { useState, useEffect, useCallback } from "react";
import { Helmet } from 'react-helmet-async';
import { messageWarning, notifySuccess, messageSuccess } from '../../utils/notificationService';
import PageHeader from "../../components/PageHeader";
import ManagementSidebar from "../../components/ManagementSidebar";
import { DefaultNewInduction } from "../../models/Inductions";
import useAuth from "../../hooks/useAuth";
import { FaSave, FaCloudUploadAlt } from 'react-icons/fa';
import { CheckCircleOutlined, InfoCircleOutlined, CloudOutlined } from '@ant-design/icons';
import { Modal, Result, Button, Badge, Tooltip } from 'antd';
import 'react-quill/dist/quill.snow.css'; // import styles
import InductionFormHeader from "../../components/InductionFormHeader";
import InductionFormContent from "../../components/InductionFormContent";
import { getAllDepartments } from "../../api/DepartmentApi";
import Loading from "../../components/Loading";
import { createNewInduction, updateInduction, createDraftInduction, saveDraftInduction } from "../../api/InductionApi";
import { useNavigate } from "react-router-dom";
import TiptapEditor from "../../components/TiptapEditor";
import { uploadFile } from "../../api/FileApi";
import { v4 as uuidv4 } from 'uuid';
import {
  saveInductionDraftToLocalStorage,
  loadInductionDraftFromLocalStorage,
  hasSavedInductionDraft,
  clearSavedInductionDraft,
  setupInductionDraftTracking
} from "../../utils/InductionAutoSave";
import InductionDraftRecoveryModal from "../../components/InductionDraftRecoveryModal";

const InductionCreate = () => {
  const { user } = useAuth();// Get the user object from the useAuth hook

  // Generate a temporary ID for the new induction (for local storage only)
  const [tempId] = useState(() => `new_induction_${uuidv4()}`);

  // States for managing the induction data and ui states
  const [induction, setInduction] = useState({
    ...DefaultNewInduction,
    department: "",
    isDraft: false // Initialize isDraft to false
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
  
  const [lastSaved, setLastSaved] = useState(null);
  const [showRecoveryModal, setShowRecoveryModal] = useState(false);
  const [savedDraft, setSavedDraft] = useState(null);

  // Get the current induction data (used by auto-save)
  const getCurrentInductionData = useCallback(() => {
    return induction;
  }, [induction]);

  useEffect(() => {
  const getDepartments = async () => {
    const data = await getAllDepartments();
    setDepartments(data);
  };
  getDepartments();
  
  // Check for a saved draft with substantial content
  if (hasSavedInductionDraft(tempId, false)) {
    const draft = loadInductionDraftFromLocalStorage(tempId, false);
    // Additional verification that the draft has substantial content
    if (draft && hasSubstantialContent(draft)) {
      setSavedDraft({
        ...draft,
        lastUpdated: new Date().toISOString()
      });
      setShowRecoveryModal(true);
    } else {
      // Clear insufficient drafts
      clearSavedInductionDraft(tempId, false);
    }
  }
}, [tempId]);

  // Set up auto-save tracking
  useEffect(() => {
    // Set up auto-save tracking
    const cleanupFunction = setupInductionDraftTracking(
      tempId,
      getCurrentInductionData,
      setLastSaved,
      false // isEditing = false
    );
    
    // Cleanup function for when component unmounts
    return cleanupFunction;
  }, [tempId, getCurrentInductionData]);

  // Manual save to localStorage when induction state changes
  useEffect(() => {
    // Only save if not in loading state and we have data
    if (!loading && !showResult) {
      saveInductionDraftToLocalStorage(tempId, induction, setLastSaved, false);
    }
  }, [induction, tempId, loading, showResult]);

  // Handle recovering saved draft
  const handleRecoverDraft = () => {
    if (savedDraft) {
      setInduction(savedDraft);
      setShowRecoveryModal(false);
      setShowModal(false); // Skip the initial setup modal
      messageSuccess("Draft recovered successfully!");
    }
  };

  // Handle starting fresh (discard draft)
  const handleStartFresh = () => {
    clearSavedInductionDraft(tempId, false);
    setShowRecoveryModal(false);
    setLastSaved(null);
    messageSuccess("Starting with a clean slate!");
  };

  const hasSubstantialContent = (inductionData) => {
  // Check if there's a name
  const hasName = inductionData.name && inductionData.name.trim() !== "";
  
  // Check if there are any questions
  const hasQuestions = inductionData.questions && inductionData.questions.length > 0;
  
  // Only save if there's a name AND at least one question
  return hasName && hasQuestions;
};

  // Updated file handling to support multiple images per question
  const handleFileBufferUpdate = (questionId, file, imageIndex = 0) => {
    setFileBuffer(prev => {
      const newBuffer = new Map(prev);
      const key = `${questionId}_${imageIndex}`;
      
      if (file) {
        newBuffer.set(key, file);
      } else {
        newBuffer.delete(key);
      }
      return newBuffer;
    });
  };

  // Updated to support multiple images per question
  const getImageUrl = async (questionId, imageIndex = 0) => {
    const key = `${questionId}_${imageIndex}`;
    const file = fileBuffer.get(key);
    return file ? URL.createObjectURL(file) : null;
  };

  // Updated to support multiple images
  const handleUploadNewQuestionFiles = async (inductionId) => {
    let updatedInduction = { ...induction };

    const getFileName = (question, file, imageIndex) => 
      `induction_images/${inductionId}/${question.id}_${imageIndex}_${file.name}`;

    for (const q of induction.questions) {
      const updatedImageFiles = [];
      
      // Handle multiple images per question (max 2)
      for (let imageIndex = 0; imageIndex < 2; imageIndex++) {
        const key = `${q.id}_${imageIndex}`;
        const hasFileInBuffer = fileBuffer.has(key);
        
        // Get current filename for this image index
        const currentFileName = q.imageFiles?.[imageIndex] || (imageIndex === 0 ? q.imageFile : null);

        if (hasFileInBuffer) {
          const file = fileBuffer.get(key);
          const finalFileName = getFileName(q, file, imageIndex);

          if (currentFileName !== finalFileName) {
            try {
              const result = await uploadFile(user, file, finalFileName);
              const uploadedFileName = result.gcsFileName || finalFileName;
              updatedImageFiles[imageIndex] = uploadedFileName;
            } catch (err) {
              messageWarning(`Failed to upload file for question ${q.id}, image ${imageIndex}`, err);
              // Keep existing file if upload fails
              if (currentFileName) {
                updatedImageFiles[imageIndex] = currentFileName;
              }
            }
          } else {
            // No change needed, keep existing
            if (currentFileName) {
              updatedImageFiles[imageIndex] = currentFileName;
            }
          }
        } else if (currentFileName) {
          // Keep existing file
          updatedImageFiles[imageIndex] = currentFileName;
        }
      }

      // Update the question with new imageFiles array
      updatedInduction = {
        ...updatedInduction,
        questions: updatedInduction.questions.map((question) =>
          question.id === q.id
            ? { 
                ...question, 
                imageFiles: updatedImageFiles.filter(Boolean),
                imageFile: undefined 
              }
            : question
        ),
      };
    }

    return updatedInduction;
  };

  // function to save as draft to the database
  const handleSaveDraft = async () => {
    if (loading) return; // Prevent action while loading
    
    try {
      setLoading(true);
      setLoadingMessage("Saving draft to database...");
      
      // First handle any file uploads
      const updatedInduction = await handleUploadNewQuestionFiles();
      
      // Mark as draft and save to database
      const result = await createDraftInduction(user, {
        ...updatedInduction,
        isDraft: true
      });
      
      if (result) {
        // Update the induction state with the returned data (including ID)
        setInduction({
          ...updatedInduction,
          id: result.id,
          isDraft: true
        });
        
        // Clear local draft since we've saved to DB
        clearSavedInductionDraft(tempId, false);
        
        notifySuccess("Draft saved to database successfully!");
        navigate("/management/inductions/view");
        
      } else {
        messageWarning("Error while saving draft module.");
      }
    } catch (error) {
      console.error("Error saving draft:", error);
      messageWarning(error.message || "Error saving draft");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelAndReturnButton = () => {
    // Offer to save draft before navigating away
    if (induction.name || induction.department || induction.description || (induction.questions && induction.questions.length > 0)) {
      setActionType("cancel");
      setConfirmModalVisible(true);
    } else {
      navigate(-1);
    }
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
    } else if (actionType === "cancel") {
      // User confirmed they want to leave without saving
      navigate(-1);
      setConfirmModalVisible(false);
    } else if (actionType === "saveDraft") {
      handleSaveDraft();
      setConfirmModalVisible(false);
    }
  };

  const handleCancel = () => {
    setConfirmModalVisible(false);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setLoadingMessage(`Creating new module...`);

    if (!user) return;

    // First create the induction to get an ID
    const result = await createNewInduction(user, {
      ...induction,
      isDraft: false // Set isDraft to false when fully submitting
    });

    if (!result || !result.id) {
      setLoading(false);
      messageWarning("Error while creating module.");
      return;
    }

    // Upload files with the new induction ID
    const updatedInduction = await handleUploadNewQuestionFiles(result.id);

    // Update the induction with the uploaded file references
    const fullUpdatedInduction = {
      ...updatedInduction,
      id: result.id,
    };
    const updateResult = await updateInduction(user, fullUpdatedInduction);

    setLoading(false);
    if (updateResult) {
      // Clear the saved draft since we've successfully submitted
      clearSavedInductionDraft(tempId, false);
      
      notifySuccess("Module created successfully!");
    } else {
      messageWarning("Module created but failed to update image references.");
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
      missingFields.push("Module needs a name.");
    }
    if (!induction.description || isContentEmpty(induction.description)) {
      missingFields.push("Module needs a description.");
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
      <Helmet><title>Create Module | AUT Events Induction Portal</title></Helmet>

      {/* Page Header */}
      <PageHeader title="Create Module" subtext="Create new Module module" />

      {/* Draft recovery modal */}
      <InductionDraftRecoveryModal
        isVisible={showRecoveryModal}
        onRecover={handleRecoverDraft}
        onStartFresh={handleStartFresh}
        savedDraft={savedDraft}
        mode="create"
      />

      {/* Confirmation Result Screen */}
      {showResult ? (
        <Result
          status="success"
          title="Module Created Successfully!"
          subTitle="Your module has been created and can now be assigned to users."
          extra={[
            <Button type="primary" key="home" onClick={() => window.location.href = "/management/inductions/view"}>
              View all Inductions
            </Button>,
            <Button type="primary" key="create" onClick={() => window.location.href = "/management/inductions/create"}>
              Create Another Induction
            </Button>,
            <Button key="users" onClick={() => window.location.href = "/management/users/view"}>
              View & Manage Users
            </Button>,
            <Button key="dashboard" onClick={() => window.location.href = "/management/dashboard"}>
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
                    <p className="mb-2 text-gray-500">What should we refer to this module as?</p>
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
                    <p className="mb-2 text-gray-500">Which department does this module best fit to?</p>
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
                    <p className="mb-2 text-gray-500">How should we describe what this module covers? (Please be detailed)</p>
                    <p className="mb-2 text-gray-500">e.g. This module covers the general health and safety across AUT and covers the following topics...</p>
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

          {/* Confirmation Dialog */}
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
                {actionType === "saveDraft" && (
                  <Button 
                    key="saveDraftConfirm" 
                    type="primary" 
                    className="w-auto min-w-0 text-sm bg-yellow-400 border-yellow-500" 
                    onClick={confirmSubmitActionHandler}
                  >
                    Save as Draft
                  </Button>
                )}
                {actionType === "cancel" && (
                  <Button key="confirmLeave" type="primary" danger className="w-auto min-w-0 text-sm" onClick={confirmSubmitActionHandler}>
                    Leave Without Saving
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
              {actionType === "submit" && <p>Are you sure you want to submit this Module?</p>}
              {actionType === "saveDraft" && <p>Are you sure you want to save this as a draft Module? It won't be available for assignments until published.</p>}
              {actionType === "cancel" && (
                <p>You have unsaved changes. Are you sure you want to leave without saving? Your draft will still be available when you return.</p>
              )}
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

          {/* Main content area */}
          {loading && <Loading message={loadingMessage} />} {/* Loading animation */}
          <div className="flex bg-gray-50 w-full">
            {/* Management Sidebar - always rendered for mobile toggle */}
            <ManagementSidebar />

            {!showModal && (
              <div className="flex-1 min-w-0 ml-0 md:ml-8">
                {/* Induction Form Component */}
                <InductionFormHeader
                  induction={induction}
                  setInduction={setInduction}
                  handleSubmit={handleSubmitButton}
                  handleSaveDraft={handleSaveDraft}
                  isCreatingInduction={true}
                  lastSaved={lastSaved}
                  showAutoSave={true}
                />

                {/* Main content for managing induction details */}
                <div className="p-4 mx-auto w-full max-w-full sm:max-w-3xl md:max-w-4xl lg:max-w-5xl space-y-6">
                  <InductionFormContent
                    induction={induction}
                    setInduction={setInduction}
                    getImageUrl={getImageUrl}
                    saveFileChange={handleFileBufferUpdate}
                  />

                  {/* Save Button Section */}
                  <div className="flex justify-center gap-4 mt-6">
                    {/* Draft Button */}
                    <Button
                      type="default"
                      onClick={() => {
                        setActionType("saveDraft");
                        setConfirmModalVisible(true);
                      }}
                      className="bg-yellow-50 border-yellow-300 text-yellow-700 hover:bg-yellow-100 hover:border-yellow-400 px-4 py-5 text-base rounded-md"
                      icon={<CloudOutlined />}
                    >
                      Save as Draft
                    </Button>
                    
                    {/* Create/Publish Button */}
                    <Button
                      type="primary"
                      onClick={handleSubmitButton}
                      className="text-white bg-gray-800 hover:bg-gray-900 px-4 py-5 text-base rounded-md"
                      title="Create Module"
                    >
                      <FaSave className="inline mr-2" /> Create Module
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
};

export default InductionCreate;
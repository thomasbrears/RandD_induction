import React, { useState, useEffect, useCallback } from "react";
import { Helmet } from 'react-helmet-async';
import InductionFormHeader from "../../components/InductionFormHeader";
import { useLocation, useNavigate } from 'react-router-dom';
import useAuth from "../../hooks/useAuth";
import { DefaultNewInduction } from "../../models/Inductions";
import { updateInduction, getInduction, deleteInduction, saveDraftInduction } from "../../api/InductionApi";
import PageHeader from "../../components/PageHeader";
import ManagementSidebar from "../../components/ManagementSidebar";
import { FaSave, FaCloudUploadAlt } from 'react-icons/fa';
import Loading from "../../components/Loading";
import "react-quill/dist/quill.snow.css";
import InductionFormContent from "../../components/InductionFormContent";import { Modal, Button, Tooltip } from "antd";
import { messageWarning, notifySuccess, messageSuccess, notifyError } from '../../utils/notificationService';
import { getSignedUrl, uploadFile, deleteFile } from "../../api/FileApi";
import { CheckCircleOutlined, InfoCircleOutlined } from '@ant-design/icons';
import {
  saveInductionDraftToLocalStorage,
  loadInductionDraftFromLocalStorage,
  hasSavedInductionDraft,
  clearSavedInductionDraft,
  setupInductionDraftTracking
} from "../../utils/InductionAutoSave";
import InductionDraftRecoveryModal from "../../components/InductionDraftRecoveryModal";

const InductionEdit = () => {
  const { user, loading: authLoading } = useAuth();
  const [induction, setInduction] = useState(DefaultNewInduction);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const location = useLocation();
  const navigate = useNavigate();
  const id = location.state?.id;
  const [actionType, setActionType] = useState(null);
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [originalQuestions, setOriginalQuestions] = useState([]);
  const [fileBuffer, setFileBuffer] = useState(new Map());
  const [error, setError] = useState(null);

  const [lastSaved, setLastSaved] = useState(null);
  const [showRecoveryModal, setShowRecoveryModal] = useState(false);
  const [savedDraft, setSavedDraft] = useState(null);

  // Get the current induction data (used by auto-save)
  const getCurrentInductionData = useCallback(() => {
    return induction;
  }, [induction]);

  useEffect(() => {
    if (id && !authLoading) {
      const fetchInduction = async () => {
        try {
          setLoading(true);
          setLoadingMessage(`Loading the Module's details...`);
          setError(null); // Reset error state
          
          // First load the actual induction data from the server
          const inductionData = await getInduction(user, id);
          
          // Ensure the isDraft flag is properly set - convert to explicit boolean
          const normalizedInductionData = {
            ...inductionData,
            isDraft: inductionData.isDraft === true || inductionData.isDraft === "true"
          };
          
          // Create snapshot of original questions
          const snapshot = inductionData.questions.map((q) => ({
            id: q.id,
            imageFile: q.imageFile || null,
          }));
          setOriginalQuestions(snapshot);
          
          // Only now check if theres a saved draft with significant changes from the server version
          if (hasSavedInductionDraft(id, true, normalizedInductionData)) {
            const draft = loadInductionDraftFromLocalStorage(id, true);
            if (draft) {
              setSavedDraft({
                ...draft,
                lastUpdated: new Date().toISOString()
              });
              setShowRecoveryModal(true);
            }
          } else {
            // No significant local changes, clear any outdated drafts
            clearSavedInductionDraft(id, true);
          }
          
          // Set the loaded data to state
          setInduction(normalizedInductionData);
          
        } catch (err) {
          notifyError(err.response?.data?.message || "An error occurred");
        } finally {
          setLoading(false);
        }
      };
      fetchInduction();
    } else if (!authLoading) {
      messageWarning("No induction was selected. Please select an induction to edit.");
      setTimeout(() => navigate("/management/inductions/view"), 1000);
    }
  }, [id, user, authLoading, navigate]);

  // Auto-save tracking
  useEffect(() => {
    if (id) {
      // Auto-save tracking
      const cleanupFunction = setupInductionDraftTracking(
        id,
        getCurrentInductionData,
        setLastSaved,
        true // isEditing = true
      );
      
      // Cleanup function for when component unmounts
      return cleanupFunction;
    }
  }, [id, getCurrentInductionData]);

  // Manual save to localStorage when induction state changes
  useEffect(() => {
    if (id && induction.id) {
      // Only save if not in loading state and we have data
      if (!loading && !submitting) {
        saveInductionDraftToLocalStorage(id, induction, setLastSaved, true);
      }
    }
  }, [induction, id, loading, submitting]);

  // Handle recovering saved draft
  const handleRecoverDraft = () => {
    if (savedDraft) {
      setInduction(savedDraft);
      setShowRecoveryModal(false);
      messageSuccess("Draft recovered successfully!");
    }
  };

  // Handle start without recent changes (discard draft)
  const handleStartFresh = () => {
    clearSavedInductionDraft(id, true);
    setShowRecoveryModal(false);
    setLastSaved(null);
    messageSuccess("Discarding draft and using last saved version.");
  };

  //File handling
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
    const fileFromBuffer = fileBuffer.get(questionId);
    const fileFromInduction = induction.questions.find(q => q.id === questionId)?.imageFile;

    if (fileFromBuffer) {
      return URL.createObjectURL(fileFromBuffer); // Local preview
    } else if (fileFromInduction && user) {
      try {
        const result = await getSignedUrl(user, fileFromInduction);
        return result.url;
      } catch (err) {
        messageWarning(err.response?.data?.message || "Could not retrieve image");
        return null;
      }
    } else {
      return null;
    }
  };

  const handleSubmitFileChanges = async () => {
    const deletes = [];
    const uploads = [];

    const oldMap = new Map(originalQuestions.map(q => [q.id, q]));
    const currentIds = new Set(induction.questions.map(q => q.id));

    const getFileName = (question, file) => `induction_images/${induction.id}/${question.id}_${file.name}`;

    for (const newQ of induction.questions) {
      const oldQ = oldMap.get(newQ.id);
      const newFileName = newQ.imageFile;
      const oldFileName = oldQ?.imageFile;

      // === CASE: DELETE ===
      if (oldFileName && !newFileName) {
        deletes.push(deleteFile(user, oldFileName));
        continue;
      }

      // === UPLOAD NEW or CHANGED ===
      const file = fileBuffer.get(newQ.id);
      if ((oldFileName !== newFileName || !oldFileName) && file && newFileName) {
        if (oldFileName) deletes.push(deleteFile(user, oldFileName));

        const finalFileName = getFileName(newQ, file);
        uploads.push({ file, finalFileName, question: newQ });
        continue;
      }

      // === NEW QUESTION with FILE ===
      if (!oldQ && newFileName && file) {
        const finalFileName = getFileName(newQ, file);
        uploads.push({ file, finalFileName, question: newQ });
      }

      // No changes — skip
    }

    // === DELETED QUESTIONS ===
    for (const [oldId, oldQ] of oldMap) {
      if (!currentIds.has(oldId) && oldQ.imageFile) {
        deletes.push(deleteFile(user, oldQ.imageFile));
      }
    }

    // === Run deletions ===
    try {
      await Promise.all(deletes);
    } catch (err) {
      messageWarning("Some deletions failed", err);
    }

    // === Run uploads and update imageFile ===
    const updatedInduction = { ...induction };
    for (const { file, finalFileName, question } of uploads) {
      try {
        const response = await uploadFile(user, file, finalFileName);
        const newFileName = response.gcsFileName || finalFileName;

        updatedInduction.questions = updatedInduction.questions.map(q =>
          q.id === question.id ? { ...q, imageFile: newFileName } : q
        );
      } catch (err) {
        messageWarning(`Upload failed for ${file.name}`, err);
      }
    }

    return updatedInduction;
  };

  // New function to save as draft to the database
  const handleSaveDraft = async () => {
    if (loading || submitting) return; // Prevent action while loading

    // Only allow saving as draft if the induction is already a draft
    // Use explicit comparison with boolean true to handle cases where isDraft might be undefined
    if (induction.isDraft !== true) {
      console.error("Attempted to save non-draft Module as draft", induction);
      messageWarning("Only draft Modules can be saved as drafts.");
      return;
    }
    
    try {
      setLoading(true);
      setLoadingMessage("Saving draft to database...");
      
      // First handle any file uploads
      const updatedInduction = await handleSubmitFileChanges();
      
      // Log the induction state before saving
      console.log("Saving draft induction:", {
        ...updatedInduction,
        isDraft: true
      });
      
      // Ensure it's marked as a draft and save to database
      const result = await saveDraftInduction(user, {
        ...updatedInduction,
        isDraft: true
      });
      
      if (result) {
        // Update the induction state with the returned data
        setInduction({
          ...updatedInduction,
          isDraft: true
        });
        
        // Clear local draft since we've saved to DB
        clearSavedInductionDraft(id, true);
        
        notifySuccess("Draft saved to database successfully!");
        navigate("/management/inductions/view");
        
      } else {
        messageWarning("Error while saving draft Module.");
      }
    } catch (error) {
      console.error("Error saving draft:", error);
      messageWarning(error.message || "Error saving draft");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteFileChanges = async () => {
    const deletes = [];

    for (const q of originalQuestions) {
      if (q.imageFile) {
        deletes.push(deleteFile(user, q.imageFile));
      }
    }

    try {
      await Promise.all(deletes);
      notifySuccess("All old files deleted successfully!");
    } catch (err) {
      messageWarning("Some deletions failed", err);
    }
  };

  //Submit functions
  const handleSubmitButton = () => {
    const missingFields = checkForMissingFields();

    if (missingFields.length === 0) {
      setActionType("submit");
      setConfirmModalVisible(true);
    } else {
      messageWarning(`Please fill in the following fields: ${missingFields.join(", ")}`);
      setActionType("prompt");
      setConfirmModalVisible(true);
    }
  };

  const confirmSubmitActionHandler = () => {
    if (actionType === "submit") {
      handleSubmit();
      setConfirmModalVisible(false);
      setActionType(null);
      return;
    }
  };

  const handleCancel = () => {
    setConfirmModalVisible(false);
  };

const handleSubmit = async () => {
  if (submitting) return; // Prevent multiple submission attempts
  
  setSubmitting(true);
  setLoading(true);
  setLoadingMessage(`Saving the Module's details...`);
  setError(null); // Reset error state
  
  try {
    // Set a timeout to automatically stop loading after 30 seconds
    const timeoutId = setTimeout(() => {
      if (submitting) {
        setLoading(false);
        setSubmitting(false);
        setError("The request timed out. Please try again.");
        messageWarning("The request is taking longer than expected. Please try again.");
      }
    }, 30000);
    
    // Handle all of the file uploads and deletion
    const updatedInduction = await handleSubmitFileChanges();
    
    // When publishing, explicitly set isDraft to false
    const finalInductionData = {
      ...updatedInduction,
      isDraft: false  // Ensures the induction is published, not saved as draft
    };
    
    if (user) {
      const result = await updateInduction(user, finalInductionData);
      
      // Clear the timeout since we got a response
      clearTimeout(timeoutId);
      
      if (result) {
        // Clear the saved draft since we've successfully submitted
        clearSavedInductionDraft(id, true);
        
        notifySuccess("Module updated successfully!");
        
        // Update the original questions snapshot to reflect the current state
        const snapshot = finalInductionData.questions.map((q) => ({
          id: q.id,
          imageFile: q.imageFile || null,
        }));
        setOriginalQuestions(snapshot);
        
        // Refresh state with the published induction
        setInduction(finalInductionData);
        setFileBuffer(new Map());
        
        // Navigate to inductions list view after successful update
        setTimeout(() => {
          navigate("/management/inductions/view");
        }, 1500); // Delay to allow the success notification to be seen
      } else {
        messageWarning("Error while updating Module.");
      }
    }
  } catch (err) {
    // Handle specific error cases
    if (err.response && err.response.status === 400) {
      const errorMessage = err.response.data?.message || "Bad request - please check your data";
      messageWarning(errorMessage);
      
      console.error("Request failed with status 400. Details:", {
        message: err.message,
        responseData: err.response.data,
        sentData: induction
      });
    } else {
      messageWarning(err.message || "Error while updating Module");
    }
  } finally {
    setSubmitting(false);
    setLoading(false);
  }
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

  const onDeleteInduction = async () => {
    setLoading(true);
    setLoadingMessage("Deleting Module...");
    
    try {
      if (user) {
        //Delete all files from gcs
        await handleDeleteFileChanges();
        
        // Clear any saved drafts
        clearSavedInductionDraft(id, true);

        const result = await deleteInduction(user, induction.id);
        if (result) {
          notifySuccess("Module deleted successfully!");
          navigate("/management/inductions/view");
        } else {
          messageWarning("Error while deleting Module.");
        }
      }
    } catch (err) {
      messageWarning(err.message || "Error while deleting Module");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet><title>Edit Module | AUT Events Induction Portal</title></Helmet>

      {/* Page Header */}
      <PageHeader title="Edit Module" subtext={""} />

      {/* Local Draft recovery modal */}
      <InductionDraftRecoveryModal
        isVisible={showRecoveryModal}
        onRecover={handleRecoverDraft}
        onStartFresh={handleStartFresh}
        savedDraft={savedDraft}
        mode="edit"
      />

      {/* Main content area */}
      {loading && <Loading message={loadingMessage} />} {/* Loading animation */}
      
      <div className="flex bg-gray-50 w-full">
        {/* Management Sidebar - always rendered for mobile toggle */}
        <ManagementSidebar />

        {loading ? (
          <Loading message={loadingMessage} />
        ) : (
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
                {actionType === "submit" && <p>Are you sure you want to submit this Module?</p>}
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

            <div className="flex-1 min-w-0 ml-0 md:ml-8">
              {/* Induction Form Component */}
              <InductionFormHeader
                induction={induction}
                setInduction={setInduction}
                handleSubmit={handleSubmitButton}
                handleSaveDraft={induction.isDraft ? handleSaveDraft : undefined}
                isCreatingInduction={false}
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
                  onDeleteInduction={onDeleteInduction}
                />

                {/* Save Button */}
                <div className="flex justify-center gap-4 mt-6">
                  {/* Save as Draft Button - Only show for existing draft inductions */}
                  {induction.isDraft && (
                    <Tooltip title="Save as draft to the database - This makes the module available for others to view and edit. However cannot be assigned to users until published.">
                      <Button
                        type="default"
                        onClick={handleSaveDraft}
                        disabled={loading || submitting}
                        className={`bg-yellow-50 border-yellow-300 text-yellow-700 hover:bg-yellow-100 hover:border-yellow-400 px-4 py-5 text-base rounded-md ${(loading || submitting) ? 'opacity-50 cursor-not-allowed' : ''}`}
                        icon={<FaCloudUploadAlt className="mr-2" />}
                      > 
                        {(loading && loadingMessage === "Saving draft to database...") ? "Saving..." : "Save as Draft"}
                      </Button>
                    </Tooltip>
                  )}
                  
                  {/* Save/Publish Button */}
                  <Button
                    type="primary"
                    onClick={handleSubmitButton}
                    disabled={submitting} // Disable button when submitting
                    className={`text-white bg-gray-800 hover:bg-gray-900 px-4 py-5 text-base rounded-md ${submitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                    title={induction.isDraft ? "Publish Module" : "Save Changes"}
                  >
                    <FaSave className="inline mr-2" /> {induction.isDraft ? "Publish" : "Save"} Module
                  </Button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default InductionEdit;
import React, { useState, useEffect, useCallback } from "react";
import { Helmet } from 'react-helmet-async';
import InductionFormHeader from "../../components/InductionFormHeader";
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import useAuth from "../../hooks/useAuth";
import { DefaultNewInduction } from "../../models/Inductions";
import { updateInduction, getInduction, deleteInduction } from "../../api/InductionApi";
import PageHeader from "../../components/PageHeader";
import ManagementSidebar from "../../components/ManagementSidebar";
import { FaSave } from 'react-icons/fa';
import Loading from "../../components/Loading";
import "react-quill/dist/quill.snow.css";
import InductionFormContent from "../../components/InductionFormContent";
import { Modal, Button } from "antd";
import { messageWarning, notifySuccess, messageSuccess } from '../../utils/notificationService';
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
          setLoadingMessage(`Loading the induction's details...`);
          setError(null); // Reset error state
          
          // Check if theres a saved draft
          if (hasSavedInductionDraft(id, true)) {
            const draft = loadInductionDraftFromLocalStorage(id, true);
            if (draft) {
              setSavedDraft({
                ...draft,
                lastUpdated: new Date().toISOString()
              });
              setShowRecoveryModal(true);
            }
          }
          
          const inductionData = await getInduction(user, id);
          setInduction(inductionData);

          // Create snapshot of original questions
          const snapshot = inductionData.questions.map((q) => ({
            id: q.id,
            imageFile: q.imageFile || null,
          }));
          setOriginalQuestions(snapshot);
        } catch (err) {
          setError(err.message || "Failed to load induction");
          toast.error(err.response?.data?.message || "An error occurred while loading the induction");
        } finally {
          setLoading(false);
        }
      };
      fetchInduction();
    } else if (!authLoading) {
      toast.error("No induction was selected. Please select an induction to edit.");
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

    for (const newQ of induction.questions) {
      const oldQ = oldMap.get(newQ.id);
      const newFileName = newQ.imageFile;
      const oldFileName = oldQ?.imageFile;

      // === CASE: DELETE ===
      if (oldFileName && !newFileName) {
        deletes.push(deleteFile(user, oldFileName));
        continue;
      }

      // === CASE: UPLOAD NEW (no old file, new file exists) ===
      if (!oldFileName && newFileName) {
        const file = fileBuffer.get(newQ.id);
        if (file) {
          const finalFileName = `${newQ.id}_${file.name}`;
          uploads.push({ file, finalFileName, question: newQ });
        }
        continue;
      }

      // === CASE: FILENAME CHANGED ===
      if (oldFileName && newFileName && oldFileName !== newFileName) {
        deletes.push(deleteFile(user, oldFileName));
        const file = fileBuffer.get(newQ.id);
        if (file) {
          const finalFileName = `${newQ.id}_${file.name}`;
          uploads.push({ file, finalFileName, question: newQ });
        }
        continue;
      }

      // === CASE: New question with file ===
      if (!oldQ && newFileName) {
        const file = fileBuffer.get(newQ.id);
        if (file) {
          const finalFileName = `${newQ.id}_${file.name}`;
          uploads.push({ file, finalFileName, question: newQ });
        }
      }

      // CASE: No changes — skip
    }

    // === CASE: OLD QUESTION DELETED ENTIRELY ===
    for (const [oldId, oldQ] of oldMap) {
      if (!currentIds.has(oldId) && oldQ.imageFile) {
        deletes.push(deleteFile(user, oldQ.imageFile));
      }
    }

    // === Run deletes ===
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
    if (submitting) return; // Prevent multiple submission attempts
    
    setSubmitting(true);
    setLoading(true);
    setLoadingMessage(`Saving the induction's details...`);
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
      
      if (user) {
        const result = await updateInduction(user, updatedInduction);
        
        // Clear the timeout since we got a response
        clearTimeout(timeoutId);
        
        if (result) {
          // Clear the saved draft since we've successfully submitted
          clearSavedInductionDraft(id, true);
          
          notifySuccess("Induction updated successfully!");
          
          // Update the original questions snapshot to reflect the current state
          const snapshot = updatedInduction.questions.map((q) => ({
            id: q.id,
            imageFile: q.imageFile || null,
          }));
          setOriginalQuestions(snapshot);
          
          // Navigate to inductions list view after successful update
          setTimeout(() => {
            navigate("/management/inductions/view");
          }, 1500); // Delay to allow the success notification to be seen
        } else {
          messageWarning("Error while updating induction.");
        }
      }
    } catch (err) {
      // Handle specific error cases
      if (err.response && err.response.status === 400) {
        const errorMessage = err.response.data?.message || "Bad request - please check your data";
        messageWarning(errorMessage);
        
        // Log detailed information to help debug
        console.error("Request failed with status 400. Details:", {
          message: err.message,
          responseData: err.response.data,
          sentData: induction
        });
      } else {
        messageWarning(err.message || "Error while updating induction");
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

  const onDeleteInduction = async () => {
    setLoading(true);
    setLoadingMessage("Deleting induction...");
    
    try {
      if (user) {
        //Delete all files from gcs
        await handleDeleteFileChanges();
        
        // Clear any saved drafts
        clearSavedInductionDraft(id, true);

        const result = await deleteInduction(user, induction.id);
        if (result) {
          notifySuccess("Induction deleted successfully!");
          navigate("/management/inductions/view");
        } else {
          messageWarning("Error while deleting induction.");
        }
      }
    } catch (err) {
      messageWarning(err.message || "Error while deleting induction");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet><title>Edit Induction | AUT Events Induction Portal</title></Helmet>

      {/* Page Header */}
      <PageHeader title="Edit Induction" subtext={""} />

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
        {/* Management Sidebar */}
        <div className="hidden md:flex">
          <ManagementSidebar />
        </div>

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
                <div className="flex justify-center mt-6">
                  <Button
                    type="primary"
                    onClick={handleSubmitButton}
                    disabled={submitting} // Disable button when submitting
                    className={`text-white bg-gray-800 hover:bg-gray-900 px-4 py-5 text-base rounded-md ${submitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                    title="Save Induction"
                  >
                    <FaSave className="inline mr-2" /> {submitting ? 'Saving...' : 'Save Induction'}
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
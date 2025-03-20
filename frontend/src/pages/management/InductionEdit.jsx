import React, { useState, useEffect } from "react";
import { Helmet } from 'react-helmet-async'; // HelmetProvider to dynamicly set page head for titles, seo etc
import InductionFormHeader from "../../components/InductionFormHeader";
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import useAuth from "../../hooks/useAuth";
import { DefaultNewInduction } from "../../models/Inductions";
import { updateInduction, getInduction } from "../../api/InductionApi";
import PageHeader from "../../components/PageHeader";
import ManagementSidebar from "../../components/ManagementSidebar";
import { FaSave } from 'react-icons/fa';
import Loading from "../../components/Loading";
import "react-quill/dist/quill.snow.css";
import InductionFormContent from "../../components/InductionFormContent";
import { Modal, Button } from "antd";

const InductionEdit = () => {
  const { user, loading: authLoading } = useAuth();
  const [induction, setInduction] = useState(DefaultNewInduction);
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const location = useLocation();
  const navigate = useNavigate();
  const id = location.state?.id;
  const [fieldsBeingEdited, setFieldsBeingEdited] = useState({});
  const [saveAllFields, setSaveAllFields] = useState(false);
  const [actionType, setActionType] = useState(null);
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [expandOnError, setExpandOnError] = useState(false);
  const [savingInProgress, setSavingInProgress] = useState(false);
  const [saveTimeoutId, setSaveTimeoutId] = useState(null);

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

  useEffect(() => {
    if (id && !authLoading) {
      const fetchInduction = async () => {
        try {
          setLoading(true);
          setLoadingMessage(`Loading the inductions's details...`);
          const inductionData = await getInduction(user, id);
          setInduction(inductionData);
        } catch (err) {
          toast.error(err.response?.data?.message || "An error occurred");
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

      const timeoutId = setTimeout(handleFailedSave, 5000);
      setSaveTimeoutId(timeoutId);
    } else {
      setConfirmModalVisible(false);
    }
  };

  const handleFailedSave = () => {
    if (!savingInProgress && (actionType === "submit" || actionType === "prompt")) return;
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
      if (saveTimeoutId) {
        clearTimeout(saveTimeoutId);
        setSaveTimeoutId(null);
      }

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
      const result = await updateInduction(user, induction);
      console.log(result);
      toast.success("Induction updated successfully!");
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

  return (
    <>
      <Helmet><title>Edit Induction | AUT Events Induction Portal</title></Helmet>

      {/* Page Header */}
      <PageHeader
        title="Edit Induction"
        subtext={`Edit ${induction.name}`}
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
                  {actionType === "unsaved" && (
                    <Button key="unsavedConfirm" type="primary" danger className="w-auto min-w-0 text-sm" onClick={confirmSubmitActionHandler}>
                      Discard & Submit
                    </Button>
                  )}
                  {(actionType === "unsaved" || actionType === "unfinished") && (
                    <Button key="saveAndCheck" type="primary" className="w-auto min-w-0 text-sm" onClick={handleSaveAndCheck} disabled={savingInProgress}>
                      Save & Check
                    </Button>
                  )}
                  {(actionType === "prompt" || actionType === "unfinished" || actionType === "failedSave") && (
                    <Button key="continueEditing" type="default" className="w-auto min-w-0 text-sm" onClick={handleCancel}>
                      Continue Editing
                    </Button>
                  )}
                  {(!(actionType === "prompt" || actionType === "unfinished" || actionType === "failedSave")) && (
                    <Button key="cancel" type="default" className="w-auto min-w-0 text-sm" onClick={handleCancel}>
                      Cancel
                    </Button>
                  )}
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
                isCreatingInduction={false}
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
                    <FaSave className="inline mr-2" /> Save Induction
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
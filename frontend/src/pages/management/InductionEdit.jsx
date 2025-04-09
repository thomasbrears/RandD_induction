import React, { useState, useEffect } from "react";
import { Helmet } from 'react-helmet-async'; // HelmetProvider to dynamicly set page head for titles, seo etc
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
import { messageWarning, notifySuccess } from '../../utils/notificationService';

const InductionEdit = () => {
  const { user, loading: authLoading } = useAuth();
  const [induction, setInduction] = useState(DefaultNewInduction);
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const location = useLocation();
  const navigate = useNavigate();
  const id = location.state?.id;
  const [actionType, setActionType] = useState(null);
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [savingInProgress, setSavingInProgress] = useState(false);

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
    setSavingInProgress(true);

    if (user) {
      const result = await updateInduction(user, induction);
      setSavingInProgress(false);
      if (result) {
        notifySuccess("Induction updated successfully!");
      } else {
        messageWarning("Error while updating induction.");
      }
    }
    //add set show result maybe move it
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
    if (user) {
      const result = await deleteInduction(user, induction.id);
      console.log(result);
      toast.success("Induction deleted successfully!");
      navigate(-1);
    }
  };

  return (
    <>
      <Helmet><title>Edit Induction | AUT Events Induction Portal</title></Helmet>

      {/* Page Header */}
      <PageHeader title="Edit Induction" subtext={""} />

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
              {savingInProgress ? (
                <div className="flex justify-center items-center">
                  <Loading message="Saving changes..." />
                </div>
              ) : (
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
              )}
            </Modal>

            <div className="flex-1 min-w-0">
              {/* Induction Form Component */}
              <InductionFormHeader
                induction={induction}
                setInduction={setInduction}
                handleSubmit={handleSubmitButton}
                isCreatingInduction={false}
                onDeleteInduction={onDeleteInduction}
              />

              {/* Main content for managing induction details */}
              <div className="p-4 mx-auto w-full max-w-full sm:max-w-3xl md:max-w-4xl lg:max-w-5xl space-y-6">

                <InductionFormContent induction={induction} setInduction={setInduction} />

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
      </div >
    </>
  );
};

export default InductionEdit;
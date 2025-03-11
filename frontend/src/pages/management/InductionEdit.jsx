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

  const updateFieldsBeingEdited = (field, state) => {

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

  // Function to handle form submission, validate inputs and call API
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Check if any required fields are missing and show warning if so
    const missingFields = checkForMissingFields();
    //more required fields (for each question, no empty options, at least 1 answer, no empty question)

    if (missingFields.length > 0) {
      toast.warn(`Please fill in the following fields: ${missingFields.join(", ")}`);
      console.log(missingFields);
      return;
    }
    console.log(induction.description);

    // user exists, send api request to update induction
    if (user) {
      const result = await updateInduction(user, induction);
      console.log(result);
      toast.success("Induction updated successfully!");
    }
  };

  //Make output pretty
  const checkForMissingFields = () => {
    const missingFields = [];

    const isContentEmpty = (content) => {
      const strippedContent = content.replace(/<[^>]+>/g, '').trim();
      return strippedContent === '';
    };

    if (!induction.name || induction.name.trim() === "") {
      missingFields.push("Induction name");
    }
    if (!induction.description || isContentEmpty(induction.description)) {
      missingFields.push("Induction description");
    }
    if (induction.department === "Select a department" || !induction.department) {
      missingFields.push("Department");
    }

    // Check if there is at least one question
    if (!induction.questions || induction.questions.length === 0) {
      missingFields.push("At least one question");
    } else {

      let questionsMissingAnswer = 0;
      let questionsMissingText = 0;
      let questionsMissingType = 0;
      let questionsMissingOptions = 0;
      let optionsMissingText = 0;

      induction.questions.forEach((question, index) => {
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
          question.options.forEach((option, optionIndex) => {
            if (!option.trim()) {
              optionsMissingText++;
            }
          });
        }
      });

      // Summarize missing fields for questions
      if (questionsMissingAnswer > 0) {
        missingFields.push(`${questionsMissingAnswer} question${questionsMissingAnswer > 1 ? "s" : ""} need at least one answer`);
      }
      if (questionsMissingText > 0) {
        missingFields.push(`${questionsMissingText} question${questionsMissingText > 1 ? "s" : ""} need text`);
      }
      if (questionsMissingType > 0) {
        missingFields.push(`${questionsMissingType} question${questionsMissingType > 1 ? "s" : ""} need a type`);
      }
      if (questionsMissingOptions > 0) {
        missingFields.push(`${questionsMissingOptions} question${questionsMissingOptions > 1 ? "s" : ""} need options`);
      }
      if (optionsMissingText > 0) {
        missingFields.push(`${optionsMissingText} option${optionsMissingText > 1 ? "s" : ""} are missing text`);
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
            <div className="flex-1">
              {/* Induction Form Component */}
              <InductionFormHeader
                induction={induction}
                setInduction={setInduction}
                handleSubmit={handleSubmit}
                isCreatingInduction={false}
                saveAllFields={saveAllFields}
                updateFieldsBeingEdited={updateFieldsBeingEdited}
              />

              {/* Main content for managing induction details */}
              <div className="p-4 mx-auto max-w-5xl space-y-6">

                <InductionFormContent
                  induction={induction}
                  setInduction={setInduction}
                  saveAllFields={saveAllFields}
                  updateFieldsBeingEdited={updateFieldsBeingEdited}
                />

                {/* Save Button */}
                <div className="flex justify-center mt-6">
                  <button
                    type="button"
                    onClick={handleSubmit}
                    className="text-white bg-gray-800 hover:bg-gray-900 px-4 py-2 rounded-md"
                    title="Save Induction"
                  >
                    <FaSave className="inline mr-2" /> Save Induction
                  </button>
                  <button
                    type="button"
                    onClick={()=>{setSaveAllFields(true); }}
                    className="text-white bg-gray-800 hover:bg-gray-900 px-4 py-2 rounded-md"
                    title="Save All"
                  >
                    <FaSave className="inline mr-2" /> Save All
                  </button>
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
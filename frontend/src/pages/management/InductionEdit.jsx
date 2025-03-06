import React, { useState, useEffect } from "react";
import { Helmet } from 'react-helmet-async'; // HelmetProvider to dynamicly set page head for titles, seo etc
import InductionForm from "../../components/InductionForm";
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import useAuth from "../../hooks/useAuth";
import { DefaultNewInduction } from "../../models/Inductions"
import { updateInduction, getInduction } from "../../api/InductionApi";
import PageHeader from "../../components/PageHeader";
import ManagementSidebar from "../../components/ManagementSidebar";
import { getAllDepartments } from "../../api/DepartmentApi";
import ReactQuill from 'react-quill';
import { FaEdit, FaSave, FaCheck } from 'react-icons/fa';
import Loading from "../../components/Loading";
import "react-quill/dist/quill.snow.css";
import QuestionList from "../../components/questions/QuestionList";
import QuestionForm from "../../components/questions/QuestionForm";

const InductionEdit = () => {
  const { user, loading: authLoading } = useAuth();
  const [induction, setInduction] = useState(DefaultNewInduction);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [isEditingDepartment, setIsEditingDepartment] = useState(false);
  const [isSubmitDisabled, setIsSubmitDisabled] = useState(true);
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [Departments, setDepartments] = useState([]);
  const location = useLocation();
  const navigate = useNavigate();
  const id = location.state?.id;

  const [showModal, setShowModal] = useState(false);
  const [questions, setQuestions] = useState([]);

  const handleAddQuestion = () => {
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };

  const handleSaveQuestion = (newQuestion) => {
    setQuestions(prevQuestions => {
      const updatedQuestions = [...prevQuestions, newQuestion];
      console.log(updatedQuestions);
      return updatedQuestions;
    });

    setShowModal(false);
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

  useEffect(() => {
    const isFormComplete = induction.name && induction.department && induction.description;
    setIsSubmitDisabled(!isFormComplete);
  }, [induction]);

  useEffect(() => {
    const getDepartments = async () => {
      const data = await getAllDepartments();
      setDepartments(data);
    };
    getDepartments();
  }, []);


  // Define the toolbar options
  const MODULES = {
    toolbar: [["bold", "italic", "underline"]],
  };

  const FORMATS = ["bold", "italic", "underline"];

  // Functions for toggling edit/view modes for department and description
  const TOGGLE_EDIT_DEPARTMENT = () => setIsEditingDepartment((prev) => !prev);
  const TOGGLE_EDIT_DESCRIPTION = () => setIsEditingDescription((prev) => !prev);

  const handleDepartmentChange = (e) => {
    setInduction({
      ...induction,
      department: e.target.value,
    });
  };

  // Function to handle form submission, validate inputs and call API
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Check if any required fields are missing and show warning if so
    const missingFields = [];
    if (!induction.name) missingFields.push("Induction name");
    if (!induction.department) missingFields.push("Department");
    if (!induction.description) missingFields.push("Description");

    if (missingFields.length > 0) {
      toast.warn(`Please fill in the following fields: ${missingFields.join(", ")}`);
      return;
    }

    // user exists, send api request to update induction
    if (user) {
      const result = await updateInduction(user, induction);
      console.log(result);
      toast.success("Induction updated successfully!");
    }
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
            <div className="flex-1 ml-6 md:ml-8 p-6 w-full max-w-full">
              {/* Induction Form Component */}
              <InductionForm
                induction={induction}
                setInduction={setInduction}
                handleSubmit={handleSubmit}
                isSubmitDisabled={isSubmitDisabled}
                isCreatingInduction={false}
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
                          onChange={handleDepartmentChange}
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
                  <div className="space-y-2 w-full">
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
                      <div className="prose !max-w-none w-full">
                        <ReactQuill
                          value={induction.description}
                          onChange={(value) => setInduction({ ...induction, description: value })}
                          placeholder="Enter description"
                          className="w-full h-50 p-2 text-base focus:ring-gray-800 focus:border-gray-800"
                          modules={MODULES}
                          formats={FORMATS}
                        />
                      </div>
                    ) : (
                      <div className="prose !max-w-none w-full break-words">
                        <p className="text-base" dangerouslySetInnerHTML={{ __html: induction.description || "No description added" }} />
                      </div>
                    )}
                  </div>
                </div>

                {/* Questions Section */}
                <hr />
                {/*Modal for creating the questions */}
                <QuestionForm
                  visible={showModal}
                  onClose={handleCloseModal}
                  onSave={handleSaveQuestion}
                />

                <div className="bg-white p-6 rounded-lg shadow-md">
                  {/* Top Row - Title, Description, Add Question Button */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-semibold">Questions</h2>
                      <p className="text-sm text-gray-500">Let's add some questions to the induction!</p>
                    </div>
                    <button
                      className="text-white bg-gray-800 hover:bg-gray-900 px-4 py-2 rounded-md"
                      type="button"
                      onClick={handleAddQuestion}
                    >
                      Add Question
                    </button>
                  </div>

                  {/* Question List*/}
                  <div className="mt-4">
                    <QuestionList questions={questions} setQuestions={setQuestions} />
                  </div>

                  {questions.length > 0 && (
                    <div className="mt-6 flex justify-center">
                      <button
                        className="text-white bg-gray-800 hover:bg-gray-900 px-4 py-2 rounded-md"
                        type="button"
                        onClick={handleAddQuestion}
                      >
                        Add Question
                      </button>
                    </div>
                  )}
                </div>

                {/* Save Button */}
                <div className="flex justify-center mt-6">
                  <button
                    type="button"
                    onClick={handleSubmit}
                    className="text-white bg-gray-800 hover:bg-gray-900 px-4 py-2 rounded-md"
                    disabled={isSubmitDisabled}
                  >
                    <FaSave className="inline mr-2" /> Save Induction
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

import React, { useState, useEffect } from "react";
import { Helmet } from 'react-helmet-async'; 
import { createNewInduction } from "../../api/InductionApi";
import { toast } from 'react-toastify';
import PageHeader from "../../components/PageHeader";
import ManagementSidebar from "../../components/ManagementSidebar";
import InductionForm from "../../components/InductionForm";
import { DefaultNewInduction } from "../../models/Inductions";
import useAuth from "../../hooks/useAuth";
import Departments from "../../models/Departments";
import { FaEdit, FaSave, FaCheck } from 'react-icons/fa';

const InductionCreate = () => {
  const { user } = useAuth();
  const [induction, setInduction] = useState({
    ...DefaultNewInduction,
    department: "",
  });
  const [showModal, setShowModal] = useState(false);
  const [isSubmitDisabled, setIsSubmitDisabled] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [isEditingDepartment, setIsEditingDepartment] = useState(false);
  const [heroImage, setHeroImage] = useState(null);

  const toggleEditDepartment = () => setIsEditingDepartment((prev) => !prev);
  const toggleEditDescription = () => setIsEditingDescription((prev) => !prev);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const missingFields = [];
    if (!induction.name) missingFields.push("Induction name");
    if (!induction.department) missingFields.push("Department");
    if (!induction.description) missingFields.push("Description");

    if (missingFields.length > 0) {
      toast.warn(`Please fill in the following fields: ${missingFields.join(", ")}`);
      return;
    }

    if (user) {
      const result = await createNewInduction(user, induction);
      console.log(result);
      toast.success("Induction created successfully!");
    }
  };

  const handleDescriptionChange = (e) => {
    setInduction({
      ...induction,
      description: e.target.value,
    });
  };

  const handleDepartmentChange = (e) => {
    setInduction({
      ...induction,
      department: e.target.value,
    });
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setHeroImage(file);
    }
  };

  useEffect(() => {
    if (!induction.name) {
      setShowModal(true);
    }

    const isFormComplete = induction.name && induction.department && induction.description;
    setIsSubmitDisabled(!isFormComplete);
  }, [induction]);

  const handleCloseModal = () => setShowModal(false);
  const handleNextStep = () => setCurrentStep((prevStep) => prevStep + 1);
  const handlePreviousStep = () => setCurrentStep((prevStep) => prevStep - 1);

  return (
    <>
      <Helmet>
        <title>Create Induction | AUT Events Induction Portal</title>
      </Helmet>

      <PageHeader title="Create Induction" subtext="Create new induction module" />

      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full sm:w-3/4 md:w-1/2 lg:w-1/3">
          <h2 className="text-xl font-semibold mb-2 text-center">
              {currentStep === 0
                ? "Welcome to the Induction Creation"
                : currentStep === 1
                ? "Induction Name"
                : currentStep === 2
                ? "Department Selection"
                : "Induction Description"}
            </h2>
            {currentStep > 0 && (
              <p className="text-sm text-gray-500 text-center mb-4">
                Step {currentStep} of 3
              </p>
            )}

            {currentStep === 0 && (
              <div>
                <p className="mb-4 text-gray-700">
                  Welcome! Let's create your induction module. Complete the steps to proceed to the questions section.
                </p>

              </div>
            )}

            {currentStep === 1 && (
              <div>
                <p className="mb-2 text-gray-500">Enter the name of the induction:</p>
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
                <p className="mb-2 text-gray-500">Select the department the induction belongs to:</p>
                <select
                  id="department"
                  name="department"
                  value={induction.department}
                  onChange={(e) => setInduction({ ...induction, department: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg p-2 text-base focus:ring-gray-800 focus:border-gray-800"
                >
                  <option value="">Select a department</option>
                  {Object.keys(Departments).map((key) => (
                    <option key={key} value={Departments[key]}>
                      {Departments[key]}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {currentStep === 3 && (
              <div>
                <p className="mb-2 text-gray-500">Enter a description for this induction:</p>
                <textarea
                  id="description"
                  name="description"
                  value={induction.description}
                  onChange={handleDescriptionChange}
                  placeholder="e.g. This induction covers the general health and safety accross AUT and covers the following topics..."
                  className="w-full h-40 border border-gray-300 rounded-lg p-2 text-base focus:ring-gray-800 focus:border-gray-800"
                />
              </div>
            )}

            <div className="mt-4 flex justify-between">
              {currentStep > 0 && (
                <button
                  type="button"
                  onClick={handlePreviousStep}
                  className="bg-gray-800 text-white px-4 py-2 rounded-md"
                >
                  Back
                </button>
              )}
              <button
                type="button"
                onClick={currentStep === 3 ? handleCloseModal : handleNextStep}
                className="bg-gray-800 text-white px-4 py-2 rounded-md"
              >
                {currentStep === 3 ? "Continue to add questions" : "Next"}
              </button>
            </div>
          </div>
        </div>
      )}


      <div className="flex bg-gray-50">
        <div className="hidden md:flex">
          <ManagementSidebar />
        </div>

        <div className="flex-1">
          <InductionForm
            induction={induction}
            setInduction={setInduction}
            handleSubmit={handleSubmit}
            isSubmitDisabled={isSubmitDisabled}
          />

          <div className="p-4 mx-auto max-w-5xl space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-md space-y-6">
              {/* Department Section */}
              <div className="space-y-2">
                <label htmlFor="department" className="block text-sm font-bold text-gray-700 flex items-center">
                  Department:
                  {!isEditingDepartment ? (
                    <button
                      type="button"
                      onClick={toggleEditDepartment}
                      className="ml-2 text-gray-600 hover:text-gray-800"
                      title="Edit department"
                    >
                      <FaEdit />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={toggleEditDepartment}
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
                      {Object.keys(Departments).map((key) => (
                        <option key={key} value={Departments[key]}>
                          {Departments[key]}
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
                <label htmlFor="description" className="block text-sm font-bold text-gray-700 flex items-center">
                  Description:
                  {!isEditingDescription ? (
                    <button
                      type="button"
                      onClick={toggleEditDescription}
                      className="ml-2 text-gray-600 hover:text-gray-800"
                      title="Edit description"
                    >
                      <FaEdit />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={toggleEditDescription}
                      className="bg-gray-800 font-normal text-white px-3 py-1 rounded-md text-sm ml-2 flex items-center"
                    >
                      <FaCheck className="inline mr-2" /> Update
                    </button>
                  )}
                </label>
                {isEditingDescription ? (
                  <textarea
                    id="description"
                    name="description"
                    value={induction.description}
                    onChange={handleDescriptionChange}
                    placeholder="Enter description"
                    className="w-full h-40 border border-gray-300 rounded-lg p-2 text-base focus:ring-gray-800 focus:border-gray-800"
                  />
                ) : (
                  <p className="text-base">{induction.description || "No description added"}</p>
                )}
              </div>

              {/* File Upload for Hero Image */}
              <div className="space-y-2">
                <label htmlFor="heroImage" className="block text-sm font-bold text-gray-700">
                  Hero/Background Image:
                </label>
                {/* Subtext for Hero Image */}
                <p className="text-sm text-gray-500">This image will be used on the first page of the induction.</p>
      
                <input
                  type="file"
                  id="heroImage"
                  name="heroImage"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="border border-gray-300 rounded-lg p-2 focus:ring-gray-800 focus:border-gray-800"
                />
                {heroImage && (
                  <p className="mt-2 text-sm text-gray-500">Selected file: {heroImage.name}</p>
                )}
              </div>
            </div>

            {/* Questions Section */}
            <hr />
            <div className="flex-1">
              <h2 className="text-xl font-semibold">Questions</h2>
              <p className="text-sm text-gray-500">Lets add some questions to the induction!</p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <p>Add question functionality in development</p>
            </div>

            {/* Save/Create Button */}
            <div className="flex justify-center mt-6">
              <button
              type="button"
              onClick={handleSubmit}
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
  );
};

export default InductionCreate;
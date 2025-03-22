import React, { useState, useEffect } from "react";
import { FaEdit, FaCheck, FaTimes } from "react-icons/fa";
import { getAllDepartments } from "../api/DepartmentApi";
import QuestionList from "../components/questions/QuestionList";
import QuestionForm from "../components/questions/QuestionForm";
import TiptapEditor from "./TiptapEditor";

const InductionFormContent = ({ induction, setInduction, saveAllFields, expandOnError, updateFieldsBeingEdited }) => {
    const [localDepartment, setLocalDepartment] = useState(induction.department);
    const [localDescription, setLocalDescription] = useState(induction.description);
    const [editingField, setEditingField] = useState(null);
    const [Departments, setDepartments] = useState([]);
    const [showQuestionModal, setShowQuestionModal] = useState(false);
    const [validationErrors, setValidationErrors] = useState({});

    useEffect(() => {
        const getDepartments = async () => {
            const data = await getAllDepartments();
            setDepartments(data);
        };
        getDepartments();
    }, []);

    useEffect(() => {
        if (saveAllFields && editingField) {
            if (editingField === "department") {
                handleDepartmentUpdate();
            } else if (editingField === "description") {
                handleDescriptionUpdate();
            }
            setEditingField(null);
        }
        updateFieldsBeingEdited("induction_content", editingField);

    }, [saveAllFields, editingField]);

    const startEditing = (field) => {
        if (editingField) {
            if (editingField === "department") {
                handleDepartmentUpdate();
            } else if (editingField === "description") {
                handleDescriptionUpdate();
            }
        }
        setEditingField(field);
    };

    const cancelEditing = (field) => {
        if (field === "department") {
            setLocalDepartment(induction.department);
        } else if (field === "description") {
            setLocalDescription(induction.description);
        }
        setEditingField(null);
    };

    const handleLocalChange = (field, value) => {
        if (field === "department") {
            setLocalDepartment(value);
        } else if (field === "description") {
            setLocalDescription(value);
        }
    };

    const handleDepartmentUpdate = () => {
        setInduction({
            ...induction,
            department: localDepartment.trim(),
        });
        setEditingField(null);
    };

    const handleDescriptionUpdate = () => {
        setInduction({
            ...induction,
            description: localDescription.trim(),
        });
        setEditingField(null);
    };

    //Question methods
    const handleCloseModal = () => {
        setShowQuestionModal(false);
    };

    const handleAddQuestion = () => {
        setShowQuestionModal(true);
    };

    const handleSaveQuestion = (newQuestion) => {
        setInduction((prevInduction) => ({
            ...prevInduction,
            questions: [...prevInduction.questions, newQuestion],
        }));

        setShowQuestionModal(false);
    };

    const handleUpdateQuestions = (updateFunction) => {
        setInduction((prevInduction) => ({
            ...prevInduction,
            questions: updateFunction(prevInduction.questions || []),
        }));
    };

    const validateForm = () => {
        const errors = {};

        const isContentEmpty = (content) => {
            const strippedContent = content.replace(/<[^>]+>/g, '').trim();
            return strippedContent === '';
        };

        if (!induction.description || isContentEmpty(induction.description)) {
            errors.description = "Induction must have a description";
        }
        if (induction.department === "Select a department" || !induction.department) {
            errors.department = "Induction must have a department";
        }

        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    useEffect(() => {
        setValidationErrors({});
        validateForm();

    }, [induction]);

    return (
        <>
            <hr />
            {/*Modal for creating the questions */}
            <QuestionForm
                visible={showQuestionModal}
                onClose={handleCloseModal}
                onSave={handleSaveQuestion}
            />

            <div className="bg-white p-6 rounded-lg shadow-md space-y-6">
                {/* Department Section */}
                <div className="space-y-2">
                    <label htmlFor="department" className="text-base font-semibold flex items-center">
                        Department:
                        {editingField !== "department" ? (
                            <button
                                type="button"
                                onClick={() => { startEditing("department") }}
                                className="ml-2 text-gray-600 hover:text-gray-800"
                                title="Edit department"
                            >
                                <FaEdit />
                            </button>
                        ) : (
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={handleDepartmentUpdate}
                                    className="bg-gray-800 font-normal text-white px-3 py-1 rounded-md text-sm ml-2 flex items-center"
                                    title="Save Changes"
                                >
                                    <FaCheck className="inline mr-2" /> Update
                                </button>
                                <button
                                    type="button"
                                    onClick={() => { cancelEditing("department") }}
                                    className="bg-red-500 font-normal text-white px-3 py-1 rounded-md text-sm ml-2 flex items-center"
                                    title="Discard Changes"
                                >
                                    <FaTimes className="inline mr-2" /> Cancel
                                </button>
                            </div>
                        )}
                    </label>
                    {validationErrors.department && <p className="text-red-500 text-sm">{validationErrors.department}</p>}
                    {editingField === "department" ? (
                        <div className="flex items-center space-x-2">
                            <select
                                id="department"
                                name="department"
                                value={localDepartment}
                                onChange={(e) => handleLocalChange("department", e.target.value)}
                                className="border border-gray-300 rounded-lg p-1 focus:ring-gray-800 focus:border-gray-800 text-sm"
                            >
                                <option value="" disabled>
                                    Select a department
                                </option>
                                {Departments.map((dept) => (
                                    <option key={dept.id} value={dept.name}>
                                        {dept.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    ) : (
                        <div className="flex items-center mt-1">
                            <span className="text-base">{induction.department || "Select a department"}</span>
                        </div>
                    )}
                </div>

                {/* Description Section */}
                <div className="space-y-2 w-full">
                    <label htmlFor="description" className="text-base font-semibold flex items-center">
                        Description:
                        {editingField !== "description" ? (
                            <button
                                type="button"
                                onClick={() => { startEditing("description") }}
                                className="ml-2 text-gray-600 hover:text-gray-800"
                                title="Edit description"
                            >
                                <FaEdit />
                            </button>
                        ) : (
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={handleDescriptionUpdate}
                                    className="bg-gray-800 font-normal text-white px-3 py-1 rounded-md text-sm ml-2 flex items-center"
                                    title="Save Changes"
                                >
                                    <FaCheck className="inline mr-2" /> Update
                                </button>
                                <button
                                    type="button"
                                    onClick={() => { cancelEditing("description") }}
                                    className="bg-red-500 font-normal text-white px-3 py-1 rounded-md text-sm ml-2 flex items-center"
                                    title="Discard Changes"
                                >
                                    <FaTimes className="inline mr-2" /> Cancel
                                </button>
                            </div>
                        )}
                    </label>
                    {validationErrors.description && <p className="text-red-500 text-sm">{validationErrors.description}</p>}

                    {editingField === "description" ? (
                        <TiptapEditor localDescription={localDescription} handleLocalChange={handleLocalChange}/>
                    ) : (
                        <div className="prose !max-w-none w-full break-words">
                            <p className="text-base" dangerouslySetInnerHTML={{ __html: localDescription || "No description added" }} />
                        </div>
                    )}
                </div>
            </div>

            {/* Questions Section */}
            <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-semibold">Questions</h2>
                        <p className="text-sm text-gray-500">Let's add some questions to the induction!</p>
                    </div>
                    <button
                        className="text-white bg-gray-800 hover:bg-gray-900 px-4 py-2 rounded-md"
                        type="button"
                        onClick={handleAddQuestion}
                        title="Add Question"
                    >
                        Add Question
                    </button>
                </div>

                {/* Question List*/}
                <div className="mt-4">
                    <QuestionList
                        questions={induction.questions}
                        setQuestions={handleUpdateQuestions}
                        saveAllFields={saveAllFields}
                        expandOnError={expandOnError}
                        updateFieldsBeingEdited={updateFieldsBeingEdited}
                    />
                </div>

                {induction.questions.length > 0 && (
                    <div className="mt-6 flex justify-center">
                        <button
                            className="text-white bg-gray-800 hover:bg-gray-900 px-4 py-2 rounded-md"
                            type="button"
                            onClick={handleAddQuestion}
                            title="Add Question"
                        >
                            Add Question
                        </button>
                    </div>
                )}
            </div>

        </>
    );
};
export default InductionFormContent;
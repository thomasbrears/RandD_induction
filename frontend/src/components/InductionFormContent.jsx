import React, { useState, useEffect } from "react";
import { getAllDepartments } from "../api/DepartmentApi";
import QuestionList from "../components/questions/QuestionList";
import QuestionForm from "../components/questions/QuestionForm";
import TiptapEditor from "./TiptapEditor";
import { Select } from "antd";
import InductionExpiryOptions from "../models/InductionExpiryOptions";

const InductionFormContent = ({ induction, setInduction, getImageUrl, saveFileChange }) => {
    const [Departments, setDepartments] = useState([]);
    const [showQuestionModal, setShowQuestionModal] = useState(false);
    const [validationErrors, setValidationErrors] = useState({});
    const [editingQuestion, setEditingQuestion] = useState({});

    useEffect(() => {
        const getDepartments = async () => {
            const data = await getAllDepartments();
            setDepartments(data);
        };
        getDepartments();
    }, []);

    const handleDescriptionUpdate = (value) => {
        setInduction({
            ...induction,
            description: value.trim(),
        });
    };

    //Field validation
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

    }, [induction.description, induction.department, induction.expiryMonths]);

    //Question methods
    const handleCloseModal = () => {
        setShowQuestionModal(false);
    };

    const handleUpdateQuestions = (updateFunction) => {
        setInduction((prevInduction) => ({
            ...prevInduction,
            questions: updateFunction(prevInduction.questions || []),
        }));
    };

    const handleSaveQuestion = (updatedQuestion) => {
        setInduction((prevInduction) => ({
            ...prevInduction,
            questions: prevInduction.questions.some(q => q.id === updatedQuestion.id)
                ? prevInduction.questions.map(q => q.id === updatedQuestion.id ? updatedQuestion : q)
                : [...prevInduction.questions, updatedQuestion],
        }));

        setShowQuestionModal(false);
    };

    const handleAddQuestion = () => {
        setEditingQuestion(null);
        setShowQuestionModal(true);
    };

    const handleQuestionEdit = (question) => {
        setEditingQuestion(question);
        setShowQuestionModal(true);
    };

    return (
        <>
            {/*Modal for creating the questions */}
            <QuestionForm
                visible={showQuestionModal}
                onClose={handleCloseModal}
                onSave={handleSaveQuestion}
                questionData={editingQuestion}
                getImageUrl={getImageUrl}
                saveFileChange={saveFileChange}
            />

            <div className="bg-white p-6 rounded-lg shadow-md space-y-6">
                {/* Department Section */}
                <div className="space-y-2">
                    <label htmlFor="department" className="text-base font-semibold flex items-center">
                        Department:
                    </label>
                    {validationErrors.department && <p className="text-red-500 text-sm">{validationErrors.department}</p>}

                    <Select
                        id="department"
                        name="department"
                        value={induction.department}
                        onChange={(value) => setInduction({...induction, department: value})}
                        className="w-full rounded-lg text-sm"
                        placeholder="Select a department"
                        style={{ border: "1px solid #d1d5db" }}
                    >
                        {Departments.map((dept) => (
                            <Select.Option key={dept.id} value={dept.name}>
                                {dept.name}
                            </Select.Option>
                        ))}
                    </Select>
                </div>

                {/* Description Section */}
                <div className="space-y-2 w-full">
                    <label htmlFor="description" className="text-base font-semibold flex items-center">
                        Description:
                    </label>
                    {validationErrors.description && <p className="text-red-500 text-sm">{validationErrors.description}</p>}

                    <TiptapEditor description={induction.description} handleChange={handleDescriptionUpdate} />
                </div>

                {/* Expiry Period Section */}
                <div className="space-y-2">
                <label htmlFor="expiry" className="text-base font-semibold flex items-center">
                    Expiry Period:
                </label>
                {validationErrors.expiryMonths && <p className="text-red-500 text-sm">{validationErrors.expiryMonths}</p>}
                <Select
                    id="expiry"
                    name="expiry"
                    value={induction.expiryMonths}
                    onChange={(value) =>
                    setInduction({ ...induction, expiryMonths: value })
                    }
                    className="w-full rounded-lg text-sm"
                    placeholder="Select expiry period"
                    style={{ border: "1px solid #d1d5db" }}
                >
                    {InductionExpiryOptions.map((option) => (
                    <Select.Option key={option.label} value={option.value}>
                        {option.label}
                    </Select.Option>
                    ))}
                </Select>
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
                        onQuestionEdit={handleQuestionEdit}
                        getImageUrl={getImageUrl}
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
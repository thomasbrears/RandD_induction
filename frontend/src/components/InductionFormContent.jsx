import React, { useState, useEffect } from "react";
import { getAllDepartments } from "../api/DepartmentApi";
import QuestionList from "../components/questions/QuestionList";
import QuestionForm from "../components/questions/QuestionForm";
import TiptapEditor from "./TiptapEditor";
import { Select, Input, Button, Popconfirm } from "antd";
import { DeleteOutlined } from "@ant-design/icons";

const InductionFormContent = ({ induction, setInduction, getImageUrl, saveFileChange, onDeleteInduction, isCreatingInduction }) => {
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

    const handleDepartmentUpdate = (value) => {
        setInduction({
            ...induction,
            department: value,
        });
    };

    const handleDescriptionUpdate = (value) => {
        setInduction({
            ...induction,
            description: value.trim(),
        });
    };

    const handleInductionNameChange = (e) => {
        setInduction({ ...induction, name: e.target.value });
    };

    //Field validation
    const validateForm = () => {
        const errors = {};

        const isContentEmpty = (content) => {
            const strippedContent = content.replace(/<[^>]+>/g, '').trim();
            return strippedContent === '';
        };

        if (typeof induction.name !== "string" || induction.name.trim() === "") {
            errors.inductionName = "Induction must have a name";
        }
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

    }, [induction.name, induction.description, induction.department]);

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
                {/* Details Section Header with Title and Delete Button */}
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h2 className="text-xl font-semibold">Induction Details</h2>
                        <p className="text-sm text-gray-500">Basic information about this induction</p>
                    </div>
                    {!isCreatingInduction && (
                        <Popconfirm
                            title="Delete Induction"
                            description="This action will permanently remove this induction and all associated data. THIS CANNOT BE UNDONE."
                            onConfirm={onDeleteInduction}
                            okText="Delete"
                            cancelText="Cancel"
                            okButtonProps={{ danger: true }}
                        >
                            <Button 
                                danger 
                                icon={<DeleteOutlined />}
                            >
                                Delete Induction
                            </Button>
                        </Popconfirm>
                    )}
                </div>

                {/* Induction Name Section */}
                <div className="space-y-2">
                    <label htmlFor="name" className="text-base font-semibold flex items-center">
                        Induction Name:
                    </label>
                    {validationErrors.inductionName && (
                        <p className="text-red-500 text-sm">{validationErrors.inductionName}</p>
                    )}
                    <Input.TextArea
                        id="name"
                        name="name"
                        value={induction.name}
                        onChange={handleInductionNameChange}
                        placeholder="Enter Induction Name"
                        className="w-full border border-gray-300 rounded-lg p-2 text-base focus:ring-gray-800 focus:border-gray-800"
                        autoSize={{ minRows: 1, maxRows: 3 }}
                        maxLength={100}
                        showCount={true}
                    />
                </div>

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
                        onChange={(value) => handleDepartmentUpdate(value)}
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
            </div>

            {/* Questions Section */}
            <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-semibold">Questions</h2>
                        <p className="text-sm text-gray-500">Let's add some questions to the induction!</p>
                    </div>
                    <button
                        className="text-white bg-blue-600 hover:bg-blue-900 px-4 py-2 rounded-md"
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
                            className="text-white bg-blue-600 hover:bg-blue-900 px-4 py-2 rounded-md"
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
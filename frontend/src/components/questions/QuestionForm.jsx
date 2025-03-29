import { useState, useEffect } from "react";
import { Modal, Select, Input, Button } from "antd";
import QuestionTypes from "../../models/QuestionTypes";
import TiptapEditor from "../TiptapEditor";
import { FaCheck, FaTimes } from "react-icons/fa";
import { DefaultNewQuestion } from "../../models/Question";

const QuestionForm = ({ visible, onClose, onSave, editingQuestion }) => {
    const [question, setQuestion] = useState(DefaultNewQuestion);

    const [showDescription, setShowDescription] = useState(false);
    const [showImageUpload, setShowImageUpload] = useState(false);

    const [validationErrors, setValidationErrors] = useState({});
    const [validateAll, setValidateAll] = useState(false);

    useEffect(() => {
        setQuestion(editingQuestion || DefaultNewQuestion);
        if(!editingQuestion) handleChange("type", "");
    }, [editingQuestion]);

    const handleChange = (field, value) => {
        setQuestion((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    const handleQuestionTypeChange = (value) => {
        if (validateAll) {//Reset validation if form changes
            setValidateAll(false);
            setValidationErrors({});
        }
        handleChange("type", value);
        switch (value) {
            case QuestionTypes.TRUE_FALSE:
                handleChange("options",["True", "False"]);
                handleChange("answers",[0]);
                break;
            case QuestionTypes.DROPDOWN:
            case QuestionTypes.MULTICHOICE:
                handleChange("options",[]);
                handleChange("answers",[]);
                break;
            case QuestionTypes.FILE_UPLOAD:
            case QuestionTypes.YES_NO:
            case QuestionTypes.INFORMATION:
            case QuestionTypes.SHORT_ANSWER:
                handleChange("options",["Yes", "No"]);
                handleChange("answers",[0]);
                break;
            default:
                handleChange("options",[]);
                handleChange("answers",[]);
        }
    };

    const handleAddOption = () => {
        if (question.options.length < 10) {
            handleChange("options", [...question.options, ""]);
        }
    };

    const handleRemoveOption = (index) => {
        const updatedOptions = question.options.filter((_, i) => i !== index);
        const updatedAnswers = question.answers
            .filter((answerIndex) => answerIndex !== index)
            .map((answerIndex) => (answerIndex > index ? answerIndex - 1 : answerIndex));
    
        handleChange("options", updatedOptions);
        handleChange("answers", updatedAnswers);
    };

    const handleOptionChange = (index, value) => {
        const updatedOptions = [...question.options];
        updatedOptions[index] = value;
        
        handleChange("options", updatedOptions);
    };

    const handleAnswerClick = (index) => {
        setQuestion((prev) => {
            let newAnswers;
    
            if (question.type === QuestionTypes.DROPDOWN) {
                newAnswers = [index]; 
            } else {
                if (prev.answers.includes(index)) {
                    newAnswers = prev.answers.filter((answer) => answer !== index); 
                } else {
                    newAnswers = [...prev.answers, index];
                }
            }
    
            console.log("Updated answers:", newAnswers); 
    
            return {
                ...prev,
                answers: newAnswers,
            };
        });
    };

    const handleRadioAnswerSelect = (index) => {
        handleChange("answers", [index]);
    };

    const resetForm = () => {
        setQuestion(DefaultNewQuestion);
        handleChange("type", "");

        setShowDescription(false);
        setShowImageUpload(false);

        setValidationErrors({});
        setValidateAll(false);
    };

    const validateForm = () => {
        const errors = {};

        if (!question.type) {
            errors.questionType = "Question type is required";
        }
        if (!question.question.trim()) {
            errors.questionText = "Question text cannot be empty";
        }
        if ((question.type === QuestionTypes.MULTICHOICE || question.type === QuestionTypes.DROPDOWN) && question.options.length === 0) {
            errors.options = "At least one option is required";
        }
        if ((question.type === QuestionTypes.MULTICHOICE || question.type === QuestionTypes.DROPDOWN) && question.answers.length === 0) {
            if (question.type === QuestionTypes.DROPDOWN) {
                errors.answers = "One answer must be selected";
            } else {
                errors.answers = "At least one answer must be selected";
            }
        }
        if (question.options.some(option => option.trim() === "")) {
            errors.options = "All options must have text";
        }

        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    useEffect(() => {
        if (validateAll) {
            setValidationErrors({});
            validateForm();
        }

    }, [question, validateAll]);

    const handleSubmit = () => {
        setValidateAll(true);
        if (!validateForm()) return;
    
        let updatedQuestion = { ...question };
    
        // Set the id for new questions
        if (!editingQuestion) {
            updatedQuestion.id = Date.now().toString();
        }
    
        console.log(updatedQuestion);
    
        onSave(updatedQuestion);
        resetForm();
        onClose();
    };

    const handleCancel = () => {
        resetForm();
        onClose();
    };

    return (
        <Modal open={visible} title="Add Question" onCancel={handleCancel} footer={null}>
            {/*Question Type Dropdown */}
            <div>
                <label className="font-semibold">Question Type:</label>
                <Select
                    className="w-full"
                    value={question.type}
                    onChange={handleQuestionTypeChange}
                    autoFocus
                >
                    <Select.Option value={QuestionTypes.MULTICHOICE}>Multiple Choice</Select.Option>
                    <Select.Option value={QuestionTypes.TRUE_FALSE}>True/False</Select.Option>
                    <Select.Option value={QuestionTypes.DROPDOWN}>Dropdown</Select.Option>
                    <Select.Option value={QuestionTypes.FILE_UPLOAD}>File Upload</Select.Option>
                    <Select.Option value={QuestionTypes.YES_NO}>Yes/No</Select.Option>
                    <Select.Option value={QuestionTypes.SHORT_ANSWER}>Short Answer</Select.Option>
                    <Select.Option value={QuestionTypes.INFORMATION}>Information</Select.Option>
                </Select>
                {validationErrors.questionType && <p className="text-red-500 text-sm">{validationErrors.questionType}</p>}
            </div>

            {question.type && (
                <>
                    {/*Question Text Input*/}
                    <div className="mt-4">
                        <label className="block mb-0 font-semibold">Question:</label>
                        {validationErrors.questionText && <p className="text-red-500 text-sm mb-1">{validationErrors.questionText}</p>}
                        <Input
                            value={question.question}
                            onChange={(e) => handleChange("question",e.target.value)}
                            placeholder="Enter your question"
                        />
                    </div>

                    <div className="mt-4">
                        {/* Checkbox to toggle description input */}
                        <label className="flex items-center gap-2 cursor-pointer">
                            <span className="text-gray-700">Add a Question Description:</span>
                            <input
                                type="checkbox"
                                checked={showDescription}
                                onChange={() => setShowDescription(!showDescription)}
                                className="cursor-pointer"
                            />

                        </label>

                        {/* Hidden input field for description */}
                        {showDescription && (
                            <TiptapEditor description={question.description} handleChange={(value) => handleChange("description", value)} />
                        )}
                    </div>

                    {/* Checkbox to toggle image upload input */}
                    <div className="mt-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <span className="text-gray-700">Add an Image:</span>
                            <input
                                type="checkbox"
                                checked={showImageUpload}
                                onChange={() => setShowImageUpload(!showImageUpload)}
                                className="cursor-pointer"
                            />
                        </label>

                        {/* Hidden input field for image upload, to be implemented */}
                        {showImageUpload && (
                            <div className="flex flex-col mt-2">
                                <button
                                    type="button"
                                    onClick={() => alert("Image upload feature coming soon!")}
                                    className="text-white bg-gray-800 hover:bg-gray-900 px-4 py-2 rounded-md"
                                >
                                    Upload Image
                                </button>
                            </div>
                        )}
                    </div>
                </>
            )}

            {(question.type === QuestionTypes.MULTICHOICE || question.type === QuestionTypes.DROPDOWN) && (
                <div className="mt-4">
                    <div className="flex justify-between items-center">
                        <label className="font-semibold">Options:</label>
                        <Button
                            onClick={handleAddOption}
                            className="text-white bg-gray-800 hover:bg-gray-900 px-4 py-2 rounded-md"
                            title={question.options.length >= 10 ? "Maximum options reached" : "Add Option"}
                            disabled={question.options.length >= 10}
                        >
                            {question.options.length >= 10 ? "Max Options" : "Add Option"}
                        </Button>
                    </div>
                    {validationErrors.options && <p className="text-red-500 text-sm">{validationErrors.options}</p>}
                    {validationErrors.answers && <p className="text-red-500 text-sm">{validationErrors.answers}</p>}

                    {/* Option inputs */}
                    {question.options.map((option, index) => (
                        <div
                            key={index}
                            className={`flex items-center gap-2 mt-2 p-2 rounded-md border-2 transition-colors ${question.answers.includes(index)
                                ? "bg-green-100 border-green-500"
                                : "bg-gray-200 border-gray-400"
                                }`}
                        >
                            <button
                                type="button"
                                onClick={() => handleAnswerClick(index)}
                                className={`relative w-7 h-7 flex items-center justify-center rounded-md cursor-pointer transition-all ${question.answers.includes(index) ? "bg-green-500" : "bg-gray-400"
                                    }`}
                            >
                                <span className="group">
                                    {question.answers.includes(index) ? (
                                        <FaCheck className="text-white w-5 h-5" />
                                    ) : (
                                        <FaTimes className="text-white w-5 h-5" />
                                    )}
                                    {/* Tooltip */}
                                    <span className="absolute left-1/2 transform -translate-x-1/2 bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black text-white text-xs rounded px-2 py-1 whitespace-nowrap">
                                        {question.answers.includes(index) ? "Correct answer" : "Incorrect answer"}
                                    </span>
                                </span>
                            </button>

                            <Input
                                value={option}
                                onChange={(e) => handleOptionChange(index, e.target.value)}
                                placeholder="Enter your answer option"
                                className="flex-1"
                            />

                            <Button
                                onClick={() => handleRemoveOption(index)}
                                className="text-white bg-red-500 hover:bg-red-600 px-3 py-1 rounded-md"
                            >
                                Remove
                            </Button>
                        </div>
                    ))}
                </div>
            )}

            {(question.type === QuestionTypes.TRUE_FALSE || question.type === QuestionTypes.YES_NO)&& (
                <div className="mt-4">
                    <div className="flex justify-between items-center">
                        <label className="font-semibold">Options:</label>
                        <p className="text-sm text-gray-500">Choose correct answer.</p>
                    </div>

                    {question.options.map((option, index) => (
                        <div
                            key={index}
                            className={`flex items-center gap-2 mt-2 p-2 rounded-md cursor-pointer border-2 ${question.answers.length > 0 && question.answers[0] === index
                                ? 'bg-green-100 border-green-500'
                                : 'bg-gray-200 border-gray-400'
                                }`}
                        >
                            <input
                                type="radio"
                                name="radioAnswer"
                                value={index}
                                checked={question.answers.length > 0 ? question.answers[0] === index : index === 0}
                                onChange={() => handleRadioAnswerSelect(index)}
                                className="cursor-pointer"
                            />
                            <label className="text-gray-700 text-sm">{option}</label>
                        </div>
                    ))}
                </div>
            )}

            {/*Save button */}
            <div className="mt-6 flex justify-end">
                <Button onClick={handleCancel} className="mr-2">Cancel</Button>
                <Button type="primary" onClick={handleSubmit} disabled={Object.keys(validationErrors).length > 0}>
                    {editingQuestion ? "Save Changes" : "Add Question"}
                </Button>
            </div>
        </Modal>
    );
};

export default QuestionForm;

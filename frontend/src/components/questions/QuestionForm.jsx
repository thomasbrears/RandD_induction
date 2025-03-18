import { useState, useEffect } from "react";
import { Modal, Select, Input, Button, Upload, Checkbox } from "antd";
import QuestionTypes from "../../models/QuestionTypes";
import { Check, X } from "lucide-react";
import ReactQuill from "react-quill";
import { MODULES, FORMATS } from "../../models/QuillConfig";

const QuestionForm = ({ visible, onClose, onSave }) => {
    const [questionType, setQuestionType] = useState("");
    const [questionText, setQuestionText] = useState("");
    const [options, setOptions] = useState([]);
    const [answers, setAnswers] = useState([]);
    const [showDescription, setShowDescription] = useState(false);
    const [description, setDescription] = useState("");
    const [validationErrors, setValidationErrors] = useState({});
    const [validateAll, setValidateAll] = useState(false);

    const [showImageUpload, setShowImageUpload] = useState(false);
    const [imageFile, setImageFile] = useState(null); {/*figure out how this works later */ }

    const handleQuestionTypeChange = (value) => {
        if (validateAll) {//Reset validation if form changes
            setValidateAll(false);
            setValidationErrors({});
        }
        setQuestionType(value);
        switch (value) {
            case QuestionTypes.TRUE_FALSE:
                setOptions(["True", "False"]);
                setAnswers([0]);
                break;
            case QuestionTypes.DROPDOWN:
            case QuestionTypes.MULTICHOICE:
                setOptions([]);
                setAnswers([]);
                break;
            case QuestionTypes.FILE_UPLOAD:
                setOptions(["Yes", "No"]);
                setAnswers([0]);
                break;
            default:
                setOptions([]);
                setAnswers([]);
        }
    };

    const handleAddOption = () => {
        setOptions([...options, ""]);
    };

    const handleRemoveOption = (index) => {
        const updatedOptions = options.filter((_, i) => i !== index);
        const updatedAnswers = answers
            .filter((answerIndex) => answerIndex !== index)
            .map((answerIndex) => (answerIndex > index ? answerIndex - 1 : answerIndex));

        setOptions(updatedOptions);
        setAnswers(updatedAnswers);
    };

    const handleOptionChange = (index, value) => {
        const updatedOptions = [...options];
        updatedOptions[index] = value;
        setOptions(updatedOptions);
    };

    const handleAnswerSelect = (index) => {
        setAnswers((prevAnswers) =>
            prevAnswers.includes(index)
                ? prevAnswers.filter((answer) => answer !== index)
                : [...prevAnswers, index]
        );
    };

    const handleTrueFalseAnswerSelect = (index) => {
        setAnswers([index]);
    };

    const resetForm = () => {
        setQuestionType("");
        setQuestionText("");
        setOptions([]);
        setAnswers([]);
        setShowDescription(false);
        setDescription("");
        setValidateAll(false);
        setValidationErrors({});
    };

    const validateForm = () => {
        const errors = {};

        if (!questionType) {
            errors.questionType = "Question type is required";
        }
        if (!questionText.trim()) {
            errors.questionText = "Question text cannot be empty";
        }
        if ((questionType === QuestionTypes.MULTICHOICE || questionType === QuestionTypes.DROPDOWN) && options.length === 0) {
            errors.options = "At least one option is required";
        }
        if ((questionType === QuestionTypes.MULTICHOICE || questionType === QuestionTypes.DROPDOWN) && answers.length === 0) {
            errors.answers = "At least one answer must be selected";
        }
        if (options.some(option => option.trim() === "")) {
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

    }, [questionType, questionText, options, answers, validateAll]);

    const handleSubmit = () => {
        setValidateAll(true);
        if (!validateForm()) return;

        const newQuestion = {
            id: Date.now().toString(),
            type: questionType,
            question: questionText,
            description,
            options,
            answers,
            imageFile,
        };
        onSave(newQuestion);
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
                    value={questionType}
                    onChange={handleQuestionTypeChange}
                    autoFocus
                >
                    <Select.Option value={QuestionTypes.MULTICHOICE}>Multiple Choice</Select.Option>
                    <Select.Option value={QuestionTypes.TRUE_FALSE}>True/False</Select.Option>
                    <Select.Option value={QuestionTypes.DROPDOWN}>Dropdown</Select.Option>
                    <Select.Option value={QuestionTypes.FILE_UPLOAD}>File Upload</Select.Option>
                </Select>
                {validationErrors.questionType && <p className="text-red-500 text-sm">{validationErrors.questionType}</p>}
            </div>

            {questionType && (
                <>
                    {/*Question Text Input*/}
                    <div className="mt-4">
                        <label className="block mb-0 font-semibold">Question:</label>
                        {validationErrors.questionText && <p className="text-red-500 text-sm mb-1">{validationErrors.questionText}</p>}
                        <Input
                            value={questionText}
                            onChange={(e) => setQuestionText(e.target.value)}
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
                            <div className="prose !max-w-none w-full">
                                <ReactQuill
                                    value={description}
                                    onChange={(value) => setDescription(value)}
                                    placeholder="Enter description..."
                                    className="w-full h-50 p-2 text-base focus:ring-gray-800 focus:border-gray-800"
                                    modules={MODULES}
                                    formats={FORMATS}
                                />
                            </div>
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

            {(questionType === QuestionTypes.MULTICHOICE || questionType === QuestionTypes.DROPDOWN) && (
                <div className="mt-4">
                    <div className="flex justify-between items-center">
                        <label className="font-semibold">Options:</label>
                        <Button
                            onClick={handleAddOption}
                            className="text-white bg-gray-800 hover:bg-gray-900 px-4 py-2 rounded-md"
                        >
                            Add Option
                        </Button>
                    </div>
                    {validationErrors.options && <p className="text-red-500 text-sm">{validationErrors.options}</p>}
                    {validationErrors.answers && <p className="text-red-500 text-sm">{validationErrors.answers}</p>}

                    {/* Option inputs */}
                    {options.map((option, index) => (
                        <div
                            key={index}
                            className={`flex items-center gap-2 mt-2 p-2 rounded-md border-2 transition-colors ${answers.includes(index)
                                ? "bg-green-100 border-green-500"
                                : "bg-gray-200 border-gray-400"
                                }`}
                        >
                            <button
                                type="button"
                                onClick={() => handleAnswerSelect(index)}
                                className={`relative w-7 h-7 flex items-center justify-center rounded-md cursor-pointer transition-all ${answers.includes(index) ? "bg-green-500" : "bg-gray-400"
                                    }`}
                            >
                                <span className="group">
                                    {answers.includes(index) ? (
                                        <Check className="text-white w-5 h-5" />
                                    ) : (
                                        <X className="text-white w-5 h-5" />
                                    )}
                                    {/* Tooltip */}
                                    <span className="absolute left-1/2 transform -translate-x-1/2 bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black text-white text-xs rounded px-2 py-1 whitespace-nowrap">
                                        {answers.includes(index) ? "Correct answer" : "Incorrect answer"}
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

            {questionType === QuestionTypes.TRUE_FALSE && (
                <div className="mt-4">
                    <div className="flex justify-between items-center">
                        <label className="font-semibold">Options:</label>
                        <p className="text-sm text-gray-500">Choose correct answer.</p>
                    </div>

                    {options.map((option, index) => (
                        <div
                            key={index}
                            className={`flex items-center gap-2 mt-2 p-2 rounded-md cursor-pointer border-2 ${answers.length > 0 && answers[0] === index
                                ? 'bg-green-100 border-green-500'
                                : 'bg-gray-200 border-gray-400'
                                }`}
                        >
                            <input
                                type="radio"
                                name="trueFalseAnswer"
                                value={index}
                                checked={answers.length > 0 ? answers[0] === index : index === 0}
                                onChange={() => handleTrueFalseAnswerSelect(index)}
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
                    Save
                </Button>
            </div>
        </Modal>
    );
};

export default QuestionForm;

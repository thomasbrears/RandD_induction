import { useState } from "react";
import { Modal, Select, Input, Button, Upload, Checkbox } from "antd";
import QuestionTypes from "../models/QuestionTypes";
import { Check, X } from "lucide-react";

const QuestionForm = ({ visible, onClose, onSave }) => {
    const [questionType, setQuestionType] = useState("");
    const [questionText, setQuestionText] = useState("");
    const [options, setOptions] = useState([]);
    const [answers, setAnswers] = useState([]);
    const [showDescription, setShowDescription] = useState(false);
    const [description, setDescription] = useState("");

    const [showImageUpload, setShowImageUpload] = useState(false);
    const [imageFile, setImageFile] = useState(null); {/*figure out how this works later */ }

    const handleQuestionTypeChange = (value) => {
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
        setOptions(options.filter((_, i) => i !== index));
        setAnswers(answers.filter((i) => i !== index));
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
    };

    const handleSubmit = () => {
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

    return (
        <Modal open={visible} title="Add Question" onCancel={onClose} footer={null}>
            {/*Question Type Dropdown */}
            <div>
                <label>Question Type:</label>
                <Select
                    className="w-full"
                    value={questionType}
                    onChange={handleQuestionTypeChange}
                >
                    <Select.Option value={QuestionTypes.MULTICHOICE}>Multiple Choice</Select.Option>
                    <Select.Option value={QuestionTypes.TRUE_FALSE}>True/False</Select.Option>
                    <Select.Option value={QuestionTypes.DROPDOWN}>Dropdown</Select.Option>
                    <Select.Option value={QuestionTypes.FILE_UPLOAD}>File Upload</Select.Option>
                </Select>
            </div>


            {questionType && (
                <>
                    {/*Question Text Input*/}
                    <div className="mt-4">
                        <label>Question:</label>
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
                            <Input
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Enter description..."
                            />
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
                        <label>Options:</label>
                        <Button
                            onClick={handleAddOption}
                            className="text-white bg-gray-800 hover:bg-gray-900 px-4 py-2 rounded-md"
                        >
                            Add Option
                        </Button>
                    </div>

                    {/* Option inputs */}
                    {options.map((option, index) => (
                        <div
                            key={index}
                            className={`flex items-center gap-2 mt-2 p-2 rounded-md border-2 transition-colors ${
                            answers.includes(index)
                                ? "bg-green-100 border-green-500"
                                : "bg-red-100 border-red-500"
                            }`}
                        >
                            <button
                            type="button"
                            onClick={() => handleAnswerSelect(index)}
                            className={`w-7 h-7 flex items-center justify-center rounded-md cursor-pointer transition-all ${
                                answers.includes(index) ? "bg-green-500" : "bg-red-500"
                            }`}
                            >
                            {answers.includes(index) ? (
                                <Check className="text-white w-5 h-5" /> // Green tick
                            ) : (
                                <X className="text-white w-5 h-5" /> // Red cross
                            )}
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
                <label>Options:</label>
                <p className="text-sm text-gray-500">Choose correct answer.</p>
                </div>

                {options.map((option, index) => (
                <div
                    key={index}
                    className={`flex items-center gap-2 mt-2 p-2 rounded-md cursor-pointer border-2 ${
                    answers.length > 0 && answers[0] === index
                        ? 'bg-green-100 border-green-500'
                        : 'bg-white border-transparent'
                    }`}
                >
                    <input
                    type="radio"
                    name="trueFalseAnswer"
                    checked={answers.length > 0 ? answers[0] === index : index === 0}
                    onChange={() => handleTrueFalseAnswerSelect(index)}
                    className="cursor-pointer"
                    />
                    <label className="text-gray-700 text-sm">{option}</label>
                </div>
                ))}
            </div>
            )}

            {/*implement form input checking */}
            <div className="mt-6 flex justify-end">
                <Button onClick={onClose} className="mr-2">Cancel</Button>
                <Button type="primary" onClick={handleSubmit} disabled={!questionText || (questionType !== QuestionTypes.FILE_UPLOAD && answers.length === 0)}>
                    Save
                </Button>
            </div>
        </Modal>
    );
};

export default QuestionForm;

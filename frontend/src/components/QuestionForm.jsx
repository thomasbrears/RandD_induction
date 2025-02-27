import { useState } from "react";
import { Modal, Select, Input, Button, Upload, Checkbox } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import QuestionTypes from "../models/QuestionTypes";
import { CheckCircle, XCircle } from "lucide-react";

const QuestionForm = ({ visible, onClose, onSave }) => {
    const [questionType, setQuestionType] = useState("");
    const [questionText, setQuestionText] = useState("");
    const [options, setOptions] = useState([]);
    const [answers, setAnswers] = useState([]);
    const [file, setFile] = useState(null);

    const handleQuestionTypeChange = (value) => {
        setQuestionType(value);
        switch (value) {
            case QuestionTypes.TRUE_FALSE:
                setOptions(["True", "False"]);
                setAnswers([]);
                break;
            case QuestionTypes.DROPDOWN:
            case QuestionTypes.MULTICHOICE:
                setOptions([]);
                setAnswers([]);
                break;
            default:
                setOptions([]);
                setAnswers([]);
        }
    };

    const handleAddOption = () => {
        setOptions([...options, ""]);
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

    const handleSubmit = () => {
        const newQuestion = {
            id: Date.now().toString(),
            type: questionType,
            question: questionText,
            options,
            answers,
            file,
        };
        onSave(newQuestion);
        onClose();
    };

    return (
        <Modal open={visible} title="Add Question" onCancel={onClose} footer={null}>
            <div>
                <label>Question Type:</label>
                <Select className="w-full" onChange={handleQuestionTypeChange}>
                    <Select.Option value={QuestionTypes.MULTICHOICE}>Multiple Choice</Select.Option>
                    <Select.Option value={QuestionTypes.TRUE_FALSE}>True/False</Select.Option>
                    <Select.Option value={QuestionTypes.DROPDOWN}>Dropdown</Select.Option>
                    <Select.Option value={QuestionTypes.FILE_UPLOAD}>File Upload</Select.Option>
                </Select>
            </div>

            {questionType && (
                <div className="mt-4">
                    <label>Question:</label>
                    <Input
                        value={questionText}
                        onChange={(e) => setQuestionText(e.target.value)}
                        placeholder="Enter your question"
                    />
                </div>
            )}

            {(questionType === QuestionTypes.MULTICHOICE || questionType === QuestionTypes.TRUE_FALSE || questionType === QuestionTypes.DROPDOWN) && (
                <div className="mt-4">
                    <label>Options:</label>
                    {options.map((option, index) => (
                        <div key={index} className="flex items-center gap-2">
                            <Input
                                value={option}
                                onChange={(e) => handleOptionChange(index, e.target.value)}
                                disabled={questionType === QuestionTypes.TRUE_FALSE}
                            />
                            <Checkbox
                                checked={answers.includes(index)}
                                onChange={() => handleAnswerSelect(index)}
                                className="cursor-pointer"
                            >
                                {answers.includes(index) ? (
                                    <CheckCircle className="text-green-500" size={20} />
                                ) : (
                                    <XCircle className="text-red-500" size={20} />
                                )}
                            </Checkbox>
                        </div>
                    ))}

                    {(questionType === QuestionTypes.MULTICHOICE || questionType === QuestionTypes.DROPDOWN) && (
                        <Button onClick={handleAddOption} className="mt-2">Add Option</Button>
                    )}
                </div>
            )}

            {questionType === QuestionTypes.FILE_UPLOAD && (
                <div className="mt-4">
                    <label>Upload Document:</label>
                    <Upload beforeUpload={(file) => { setFile(file); return false; }}>
                        <Button icon={<UploadOutlined />}>Click to Upload</Button>
                    </Upload>
                </div>
            )}

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

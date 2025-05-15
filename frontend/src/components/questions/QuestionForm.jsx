import React, { useEffect, useState } from "react";
import { Modal, Form, Select, Input, Button, Collapse, Switch, Radio, Popconfirm } from "antd";
import QuestionTypes from "../../models/QuestionTypes";
import TiptapEditor from "../TiptapEditor";
import { FaCheck, FaTimes, FaInfoCircle } from "react-icons/fa";
import { DeleteOutlined } from '@ant-design/icons';
import { DefaultNewQuestion } from "../../models/Question";
import { UpOutlined, PlusOutlined } from "@ant-design/icons";
import "../../style/AntdOverride.css";
import { v4 as uuidv4 } from 'uuid';
import ImageUpload from "../ImageUpload";

const { Option } = Select;

const QuestionForm = ({ visible, onClose, onSave, questionData, getImageUrl, saveFileChange, onDeleteQuestion }) => {
    const [form] = Form.useForm();
    const selectedType = Form.useWatch('type', form);
    const requiresValidation = Form.useWatch('requiresValidation', form);
    const answers = Form.useWatch('answers', form);
    const [tempFile, setTempFile] = useState(null);
    const [fileUrl, setFileUrl] = useState(null);
    const isEditMode = questionData?.id ? true : false;

    const handleFileChange = (file) => {
        if (fileUrl?.startsWith("blob:")) {
            URL.revokeObjectURL(fileUrl);
        }
    
        if (file) {
            setTempFile(file);
            form.setFieldValue("imageFile", file.name);
    
            const previewUrl = URL.createObjectURL(file);
            setFileUrl(previewUrl);
        } else {
            setTempFile(null);
            form.setFieldValue("imageFile", null);
            setFileUrl(null);
        }
    };

    const handleQuestionTypeChange = (value) => {
        let newOptions = [];
        let newAnswers = [];

        switch (value) {
            case QuestionTypes.TRUE_FALSE:
                newOptions = ["True", "False"];
                newAnswers = [0];
                break;
            case QuestionTypes.DROPDOWN:
            case QuestionTypes.MULTICHOICE:
                newOptions = [""];
                newAnswers = [];
                break;
            case QuestionTypes.FILE_UPLOAD:
            case QuestionTypes.YES_NO:
            case QuestionTypes.INFORMATION:
            case QuestionTypes.SHORT_ANSWER:
                newOptions = ["Yes", "No"];
                newAnswers = [0];
                break;
            default:
                newOptions = [];
                newAnswers = [];
        }

        form.setFieldsValue({
            type: value,
            options: newOptions,
            answers: newAnswers,
        });
    };

    useEffect(() => {
        if (visible) {
            const initialValues = {
                ...DefaultNewQuestion,
                ...questionData,
            };

            // If new question generate new ID
            if (!initialValues.id) {
                initialValues.id = uuidv4();
                initialValues.type = null;
            }

            form.resetFields();
            form.setFieldsValue(initialValues);

            //File/image handling
            setTempFile(null);
            setFileUrl(null);
            if (questionData && questionData.imageFile) {
                const loadImage = async () => {
                    const url = await getImageUrl(form.getFieldValue('id'));
                    setFileUrl(url);
                };
    
                loadImage();
            }
        }
    }, [questionData, visible]);

    const onFinish = (formData) => {
        if(tempFile && form.getFieldValue('imageFile')){
            saveFileChange(form.getFieldValue('id'), tempFile);
        } else if (!tempFile && !form.getFieldValue('imageFile')){
            saveFileChange(form.getFieldValue('id'), null);
        }

        const newQuestion = {
            id: form.getFieldValue('id'),
            question: form.getFieldValue('question') || "",
            description: form.getFieldValue('description') || "",
            type: form.getFieldValue('type') || QuestionTypes.MULTICHOICE,
            options: form.getFieldValue('options') || [],
            answers: form.getFieldValue('answers') || [],
            requiresValidation: form.getFieldValue('requiresValidation') || true,
            hint: form.getFieldValue('hint') || "",
            imageFile: form.getFieldValue('imageFile') || null,
            youtubeUrl: form.getFieldValue('youtubeUrl') || null,
        }

        onSave(newQuestion);
        onClose();
    };

    const handleDeleteQuestion = () => {
        if (onDeleteQuestion && form.getFieldValue('id')) {
            onDeleteQuestion(form.getFieldValue('id'));
            onClose();
        }
    };

    const handleAnswerClick = (index) => {
        let answers = form.getFieldValue("answers") || [];

        if (selectedType === QuestionTypes.DROPDOWN || selectedType === QuestionTypes.YES_NO || selectedType === QuestionTypes.TRUE_FALSE) {
            answers = [index];
        } else {
            answers = answers.includes(index)
                ? answers.filter((answer) => answer !== index)
                : [...answers, index];
        }

        form.setFieldsValue({ answers });
        form.validateFields(["options"]);
    };

    const handleCancel = (e) => {
        onClose();
    };

    // Helper function to render question type information
    const renderQuestionTypeInfo = () => {
        let infoMessage = '';
        
        switch (selectedType) {
            case QuestionTypes.FILE_UPLOAD:
                infoMessage = "A file upload field will be presented to the user. They will be able to upload one Image (JPG, PNG, GIF) or document (PDF, Word, Excel, PowerPoint) file, upto 10MB in size.";
                break;
            case QuestionTypes.SHORT_ANSWER:
                infoMessage = "A text area will be provided for user to enter their answer. The response will be limited to 1000 characters.";
                break;
            case QuestionTypes.INFORMATION:
                infoMessage = "This is an informational question type. No input will be required from the user - use this to provide instructions or additional context in the description field.";
                break;
            default:
                return null;
        }

        return (
            <div className="border-t border-gray-200 pt-4 mt-4 mb-4">
                <div className="p-3 rounded-md bg-blue-50 border border-blue-200 flex items-start">
                    <FaInfoCircle className="text-blue-500 mt-1 mr-2 flex-shrink-0" />
                    <div className="text-sm text-blue-700">
                        {infoMessage}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <Modal 
            open={visible} 
            title={isEditMode ? "Edit Question" : "Add Question"} 
            onCancel={handleCancel} 
            footer={null}
            width={600}
        >
            <Form
                form={form}
                initialValues={questionData}
                onValuesChange={(changedValues) => {
                    if (changedValues.type) handleQuestionTypeChange(changedValues.type);
                }}
                onFinish={onFinish}
                layout="vertical"
                scrollToFirstError={{ behavior: 'auto', block: 'end', focus: true }}
            >

                {/* Question Type Dropdown */}
                <Form.Item name="type" className="mb-2" label={<span className="font-semibold">Question Type:</span>} rules={[{ required: true }]} >
                    <Select autoFocus>
                        <Option value={QuestionTypes.MULTICHOICE}>Multiple Choice</Option>
                        <Option value={QuestionTypes.TRUE_FALSE}>True/False</Option>
                        <Option value={QuestionTypes.DROPDOWN}>Dropdown</Option>
                        <Option value={QuestionTypes.FILE_UPLOAD}>File Upload</Option>
                        <Option value={QuestionTypes.YES_NO}>Yes/No</Option>
                        <Option value={QuestionTypes.SHORT_ANSWER}>Short Answer</Option>
                        <Option value={QuestionTypes.INFORMATION}>Information</Option>
                    </Select>
                </Form.Item>

                {selectedType && (
                    <>
                        {/* Question Input */}
                        <Form.Item
                            name="question"
                            label={<span className="font-semibold">Question Title:</span>}
                            rules={[
                                { required: true, message: 'Question is required' },
                            ]}
                            className="mb-6 mt-2"
                        >
                            <Input.TextArea placeholder="Enter your question" maxLength={200} autoSize={{ minRows: 1, maxRows: 3 }} showCount={true} />
                        </Form.Item>

                        {/* Question Type Information */}
                        {(selectedType === QuestionTypes.FILE_UPLOAD || 
                          selectedType === QuestionTypes.SHORT_ANSWER || 
                          selectedType === QuestionTypes.INFORMATION) && renderQuestionTypeInfo()}

                        {/* Collapsible Additional Fields*/}
                        <Collapse
                            expandIconPosition="end"
                            expandIcon={({ isActive }) => (
                                <UpOutlined 
                                    className={`transition-transform ${isActive ? 'rotate-0' : 'rotate-180'}`}
                                    style={{ transform: isActive ? 'rotate(0deg)' : 'rotate(180deg)' }}
                                    title={isActive ? "Collapse Details" : "Expand Details"} 
                                />
                            )}
                            className="border border-gray-300 rounded-md mt-4 p-0 mb-2"
                            items={[
                                {
                                    key: "1",
                                    label: (
                                        <div className="font-semibold">
                                            Optional Fields
                                        </div>
                                    ),
                                    children: (
                                        <div>
                                            {/* Description Section */}
                                            <div className="mt-3">
                                                <span className="font-semibold">Add a Question Description (Optional):</span>
                                                <Form.Item name="description" className="mt-2">
                                                    <TiptapEditor
                                                        description={form.getFieldValue('description')}
                                                        handleChange={(value) => {
                                                            // Carefully update the form value without triggering a full form reset
                                                            form.setFieldsValue({ 
                                                                description: value 
                                                            });
                                                            
                                                            // Prevent immediate validation
                                                            setTimeout(() => {
                                                                form.validateFields(['description'])
                                                                    .catch(() => {
                                                                        // Silently catch validation errors to prevent UI disruption
                                                                    });
                                                            }, 500);
                                                        }}
                                                    />
                                                </Form.Item>
                                            </div>

                                            {/* Image Upload Section */}
                                            <div className="mt-6 pt-2 border-t border-gray-300">
                                                <span className="font-semibold">Add an Image (Optional):</span>
                                                <ImageUpload
                                                    fileUrl={fileUrl}
                                                    saveFileChange={handleFileChange}
                                                />
                                            </div>

                                            {/* YouTube Video URL Section */}
                                            <div className="mt-6 pt-2 border-t border-gray-300">
                                                <span className="font-semibold">Add a YouTube Video (Optional):</span>
                                                <Form.Item name="youtubeUrl" className="mt-2">
                                                    <Input 
                                                        placeholder="Enter YouTube video URL (e.g. https://www.youtube.com/watch?v=dQw4w9WgXcQ)"
                                                        onChange={(e) => form.setFieldsValue({ youtubeUrl: e.target.value })}
                                                    />
                                                </Form.Item>
                                            </div>
                                        </div>
                                    ),
                                }
                            ]}
                        />

                        {/* Collapsible Validation Settings */}
                        {(selectedType === QuestionTypes.MULTICHOICE ||
                            selectedType === QuestionTypes.TRUE_FALSE ||
                            selectedType === QuestionTypes.DROPDOWN ||
                            selectedType === QuestionTypes.YES_NO) && (
                                <Collapse
                                    expandIconPosition="end"
                                    expandIcon={({ isActive }) => (
                                        <UpOutlined 
                                            className={`transition-transform ${isActive ? 'rotate-0' : 'rotate-180'}`}
                                            style={{ transform: isActive ? 'rotate(0deg)' : 'rotate(180deg)' }}
                                            title={isActive ? "Collapse Details" : "Expand Details"} 
                                        />
                                    )}
                                    className="border border-gray-300 rounded-md mt-4 p-0 mb-2"
                                    items={[
                                        {
                                            key: "2",
                                            label: "Validation Settings",
                                            children: (
                                                <div>
                                                    <div className="flex items-center justify-between mb-2 mt-3">
                                                        <span className="font-semibold">Requires Validation:</span>
                                                        <Form.Item name="requiresValidation" valuePropName="checked" noStyle>
                                                            <Switch
                                                                title={form.getFieldValue("requiresValidation") ? "On" : "Off"}
                                                            />
                                                        </Form.Item>
                                                    </div>

                                                    {/* Show Hint only if Requires Validation is enabled */}
                                                    {requiresValidation && (
                                                        <Form.Item
                                                            name="hint"
                                                            label={<span className="font-semibold">Hint (Optional):</span>}
                                                            className="mt-6 pt-2 border-t border-gray-300"
                                                        >
                                                            <Input.TextArea
                                                                maxLength={150}
                                                                showCount
                                                                rows={3}
                                                                className="w-full text-sm resize-y"
                                                                placeholder="Enter a hint (max 150 characters)"
                                                            />
                                                        </Form.Item>
                                                    )}
                                                </div>
                                            ),
                                        }
                                    ]}
                                />
                            )}

                        {/* Options Section */}
                        {(selectedType === QuestionTypes.MULTICHOICE || selectedType === QuestionTypes.DROPDOWN) && (
                            <Form.Item
                                className="!mb-2"
                                label={<span className="font-semibold">Options:</span>}
                                name="options"
                                dependencies={["options"]}
                                rules={[
                                    {
                                        validator: async (_, options) => {
                                            const answers = form.getFieldValue("answers") || [];
                                            if (options.length === 0) {
                                                return Promise.reject(new Error("At least one option is required."));
                                            }
                                            if (answers.length === 0) {
                                                return Promise.reject(new Error("At least one option must be correct."));
                                            }
                                            return Promise.resolve();
                                        }
                                    }
                                ]}
                            >
                                <Form.List name="options">
                                    {(fields, { add, remove }) => {
                                        const options = form.getFieldValue("options") || [];
                                        const answers = form.getFieldValue("answers") || [];

                                        const handleRemove = (index) => {
                                            const newAnswers = answers
                                                .filter(answerIndex => answerIndex !== index)
                                                .map(answerIndex => (answerIndex > index ? answerIndex - 1 : answerIndex));

                                            remove(index);
                                            form.setFieldsValue({ answers: newAnswers });
                                            form.validateFields(["options"]);
                                        };

                                        return (
                                            <>
                                                {fields.map(({ key, name, ...restField }, index) => (
                                                    <div
                                                        key={key}
                                                        className={`flex gap-2 p-2 pb-0 rounded-md border-2 transition-colors mb-2
                                                        ${answers.includes(index) ? "bg-green-100 border-green-500" : "bg-gray-200 border-gray-400"}`}
                                                    >
                                                        {/* Answer Selection Button */}
                                                        <button
                                                            type="button"
                                                            onClick={() => handleAnswerClick(index)}
                                                            className={`relative w-7 h-7 flex items-center justify-center rounded-md cursor-pointer transition-all  ${answers.includes(index) ? "bg-green-500" : "bg-gray-400"}`}
                                                            title={answers.includes(index) ? "Correct Answer" : "Incorrect Answer"}
                                                        >
                                                            {answers.includes(index) ? (
                                                                <FaCheck className="text-white w-5 h-5" />
                                                            ) : (
                                                                <FaTimes className="text-white w-5 h-5" />
                                                            )}
                                                        </button>

                                                        {/* Option Input */}
                                                        <Form.Item
                                                            {...restField}
                                                            name={[name]}
                                                            rules={[{ required: true, message: "Option cannot be empty" }]}
                                                            className="flex-1"
                                                        >
                                                            <Input.TextArea
                                                                placeholder="Enter option"
                                                                autoSize={{ minRows: 1, maxRows: 3 }}
                                                                maxLength={150}
                                                                showCount
                                                            />
                                                        </Form.Item>

                                                        {/* Remove Option Button */}
                                                        <Button
                                                            onClick={() => handleRemove(index)}
                                                            className="text-white bg-red-500 hover:bg-red-600 px-3 py-1 rounded-md"
                                                            title="Remove Option"
                                                        >
                                                            Remove
                                                        </Button>
                                                    </div>
                                                ))}

                                                {/* Add Option Button*/}
                                                <div className="flex items-center justify-center">
                                                    <Button
                                                        type="dashed"
                                                        onClick={() => add("")}
                                                        disabled={options.length >= 10}
                                                        className={`mt-2 text-gray px-4 py-2 rounded-md gap-2 ${options.length >= 10 ? "cursor-not-allowed" : "hover:bg-gray-900"
                                                            }`}
                                                        title={options.length >= 10 ? "Maximum 10 options allowed" : "Add Option"}
                                                        style={{ width: '60%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                                        icon={<PlusOutlined />}
                                                    >
                                                        {options.length >= 10 ? "Max Options Reached" : "Add Option"}
                                                    </Button>
                                                </div>
                                            </>
                                        );
                                    }}
                                </Form.List>
                            </Form.Item>
                        )}

                        {/*Radio for options*/}
                        {(selectedType === QuestionTypes.TRUE_FALSE || selectedType === QuestionTypes.YES_NO) && (
                            <Form.Item
                                label={<span className="font-semibold">Options:</span>}
                                name="answers"
                                normalize={(value) => (Array.isArray(value) ? value.map(Number) : [Number(value)])}
                            >
                                <div>
                                    <p className="text-sm text-gray-500">Choose correct answer.</p>
                                    <Radio.Group
                                        onChange={(e) => {
                                            form.setFieldsValue({ answers: [Number(e.target.value)] });
                                        }}
                                        value={Number(form.getFieldValue("answers")?.[0])}
                                        className="w-full"
                                    >
                                        <div className="mt-2 flex flex-col gap-2">
                                            {form.getFieldValue("options")?.map((option, index) => (
                                                <div
                                                    key={index}
                                                    className={`flex items-center gap-2 p-2 rounded-md cursor-pointer border-2 transition-colors  
                                                ${Number(form.getFieldValue("answers")?.[0]) === index ? "bg-green-100 border-green-500" : "bg-gray-200 border-gray-400"}`}
                                                >
                                                    <Radio key={index} value={index}>
                                                        <span className="text-gray-700 text-sm">{option}</span>
                                                    </Radio>
                                                </div>
                                            ))}
                                        </div>
                                    </Radio.Group>
                                </div>
                            </Form.Item>
                        )}

                        <Form.Item className="!mb-0 mt-4">
                            <div className="flex justify-between items-center">
                                {/* Delete Button - Only show when editing */}
                                {isEditMode && (
                                    <Popconfirm
                                        title="Delete Question"
                                        description="Are you sure you want to delete this question? THIS CANNOT BE UNDONE."
                                        onConfirm={handleDeleteQuestion}
                                        okText="Delete"
                                        cancelText="Cancel"
                                        okButtonProps={{ danger: true }}
                                    >
                                        <Button 
                                            danger 
                                            icon={<DeleteOutlined />}
                                            type="button"
                                        >
                                            Delete Question
                                        </Button>
                                    </Popconfirm>
                                )}
                                
                                {/* Action Buttons */}
                                <div className="flex justify-end">
                                    <Button onClick={handleCancel} className="mr-2" type="button">Cancel</Button>
                                    <Button type="primary" htmlType="submit" title={questionData ? "Save Changes" : "Create Question"}>
                                        {questionData ? "Save Changes" : "Create Question"}
                                    </Button>
                                </div>
                            </div>
                        </Form.Item>
                    </>
                )}
            </Form>
        </Modal>
    );
};

export default QuestionForm;
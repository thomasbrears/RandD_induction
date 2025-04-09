import React, { useState, useRef, useEffect } from "react";
import {
    useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Input, Button } from "antd";
import TrueFalseQuestion from "./TrueFalseQuestion";
import MultichoiceQuestion from "./MultichoiceQuestion";
import DropdownQuestion from "./DropdownQuestion";
import FileUploadQuestion from "./FileUploadQuestion";
import { FaBars, FaChevronDown, FaChevronUp, FaEdit, FaCheck, FaTimes } from 'react-icons/fa';
import QuestionTypes from "../../models/QuestionTypes";
import ConfirmationModal from "../ConfirmationModal";
import { Trash } from "lucide-react";
import ShortAnswerQuestion from "./ShortAnswerQuestion";
import InformationQuestion from "./InformationQuestion";

const QuestionItem = ({ question, onChange, onDeleteQuestion, saveAllFields, expandOnError, updateFieldsBeingEdited }) => {
    const [hasExpandedBefore, setHasExpandedBefore] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const [editingField, setEditingField] = useState(null);
    const [localValues, setLocalValues] = useState({ ...question });
    const contentRef = useRef(null);
    const [maxHeight, setMaxHeight] = useState("0px");
    const [isAnimating, setIsAnimating] = useState(false);
    const [confirmAction, setConfirmAction] = useState(false);
    const [actionType, setActionType] = useState(null);
    const [validationErrors, setValidationErrors] = useState({});

    useEffect(() => {
        if (saveAllFields) {
            stopEditing(editingField, localValues[editingField]);
            setEditingField(null);
        }
        updateFieldsBeingEdited(`${question.id}_header`, editingField);

    }, [saveAllFields, editingField]);

    const startEditing = (field) => setEditingField(field);
    const stopEditing = (field, value) => {
        onChange(question.id, field, value);
        setEditingField(null);
    };

    const handleEditCancel = (field) => {
        setLocalValues((prev) => ({ ...prev, [field]: question[field] }));
        setEditingField(null);
    };

    const handleLocalChange = (field, value) => {
        setLocalValues((prev) => ({ ...prev, [field]: value }));
    };

    const toggleExpand = () => setIsExpanded((prev) => !prev);

    const { attributes, listeners, setNodeRef, transform, transition } =
        useSortable({ id: question.id });

    const style = {
        transform: transform ? CSS.Translate.toString(transform) : undefined,
        transition,
    };

    const handleConfirmDelete = () => {
        setActionType('delete');
        setConfirmAction(true);
    };

    useEffect(() => {
        if (!hasExpandedBefore && !isExpanded) {
            return;
        }

        setHasExpandedBefore(true);

        if (isExpanded) {
            setIsAnimating(true);
            const height = contentRef.current?.scrollHeight;
            setMaxHeight(`${height}px`);

            const timer = setTimeout(() => {
                setMaxHeight("none");
                setIsAnimating(false);
            }, 300);

            return () => clearTimeout(timer);
        } else {
            if (contentRef.current) {
                setMaxHeight(`${contentRef.current.scrollHeight}px`);

                requestAnimationFrame(() => {
                    requestAnimationFrame(() => {
                        setMaxHeight("0px");
                        setIsAnimating(true);
                    });
                });
            } else {
                setMaxHeight("0px");
                setIsAnimating(true);
            }
        }
    }, [isExpanded]);

    const renderQuestion = () => {
        switch (question.type) {
            case QuestionTypes.TRUE_FALSE:
                return <TrueFalseQuestion
                    question={question}
                    onChange={onChange}
                    isExpanded={isExpanded}
                    saveAllFields={saveAllFields}
                    updateFieldsBeingEdited={updateFieldsBeingEdited}
                />;
            case QuestionTypes.YES_NO:
                return <TrueFalseQuestion
                    question={question}
                    onChange={onChange}
                    isExpanded={isExpanded}
                    saveAllFields={saveAllFields}
                    updateFieldsBeingEdited={updateFieldsBeingEdited}
                />;
            case QuestionTypes.MULTICHOICE:
                return <MultichoiceQuestion
                    question={question}
                    onChange={onChange}
                    isExpanded={isExpanded}
                    setIsExpanded={setIsExpanded}
                    saveAllFields={saveAllFields}
                    expandOnError={expandOnError}
                    updateFieldsBeingEdited={updateFieldsBeingEdited}
                />;
            case QuestionTypes.DROPDOWN:
                return <DropdownQuestion
                    question={question}
                    onChange={onChange}
                    isExpanded={isExpanded}
                    setIsExpanded={setIsExpanded}
                    saveAllFields={saveAllFields}
                    expandOnError={expandOnError}
                    updateFieldsBeingEdited={updateFieldsBeingEdited}
                />;
            case QuestionTypes.FILE_UPLOAD:
                return <FileUploadQuestion
                    question={question}
                    onChange={onChange}
                    isExpanded={isExpanded}
                    saveAllFields={saveAllFields}
                    updateFieldsBeingEdited={updateFieldsBeingEdited}
                />;
            case QuestionTypes.SHORT_ANSWER:
                return <ShortAnswerQuestion
                    question={question}
                    onChange={onChange}
                    isExpanded={isExpanded}
                    saveAllFields={saveAllFields}
                    updateFieldsBeingEdited={updateFieldsBeingEdited}
                />;
            case QuestionTypes.INFORMATION:
                return <InformationQuestion
                    question={question}
                    onChange={onChange}
                    isExpanded={isExpanded}
                    saveAllFields={saveAllFields}
                    updateFieldsBeingEdited={updateFieldsBeingEdited}
                />;
            default:
                return <span>{question.question}</span>;
        }
    };

    const renderQuestionType = () => {
        switch (question.type) {
            case QuestionTypes.TRUE_FALSE:
                return "True/False";
            case QuestionTypes.YES_NO:
                return "Yes/No";
            case QuestionTypes.MULTICHOICE:
                return "Multi Choice";
            case QuestionTypes.DROPDOWN:
                return "Dropdown";
            case QuestionTypes.FILE_UPLOAD:
                return "File Upload";
            case QuestionTypes.SHORT_ANSWER:
                return "Short Answer";
            case QuestionTypes.INFORMATION:
                return "Information";
            default:
                return question.questionType;
        }
    };

    // Function to render required/optional badge
    const renderRequiredBadge = () => {
        // Questions are required by default unless explicitly set to false
        const isRequired = question.isRequired !== false;
        // Information questions are always optional
        if (question.type === QuestionTypes.INFORMATION) {
            return <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">Info Only</span>;
        }
        return isRequired ? 
            <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">Required</span> : 
            <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">Optional</span>;
    };

    const cancelActionHandler = () => {
        setConfirmAction(false);
    };

    const confirmActionHandler = () => {
        if (actionType === 'delete') {
            onDeleteQuestion(localValues.id);
        }
        setConfirmAction(false);
    };

    const validateForm = () => {
        const errors = {};

        if (!question.question.trim()) {
            errors.questionText = "Question text cannot be empty";
        }

        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    useEffect(() => {
        setValidationErrors({});
        validateForm();

    }, [question]);

    return (
        <>
            <ConfirmationModal
                isOpen={confirmAction}
                message="Are you sure you want to delete this question?"
                subtext="This action cannot be undone."
                onCancel={cancelActionHandler}
                onConfirm={confirmActionHandler}
                actionLabel="Yes, Delete Question"
                cancelLabel="Cancel"
            />

            <li ref={setNodeRef} style={style} {...attributes} className="p-3 bg-white shadow-md rounded-md flex flex-col border w-full">
                {/* Header Section */}
                <div className="flex items-start gap-2 mt-2 p-2 w-full gap-4">
                    {/* Drag Icon */}
                    <span {...listeners} className="text-gray-600 cursor-grab flex py-2 items-center" title="Drag to change question order" style={{ fontSize: '1.125rem', height: '1.25rem' }}>
                        <FaBars />
                    </span>

                    {/* Question Type and Text */}
                    <span className="text-lg font-bold uppercase min-w-max">{renderQuestionType()}</span>
                    <div className="flex flex-wrap items-center flex-grow gap-4 min-w-0">
                        {editingField === "question" ? (
                            <>
                                <div className="flex flex-col gap-2 w-full">
                                    {/* Textarea */}
                                    <Input.TextArea
                                        value={localValues.question}
                                        onChange={(e) => handleLocalChange("question", e.target.value)}
                                        placeholder="Enter your question..."
                                        autoSize={{ minRows: 1, maxRows: 5 }}
                                        className="w-full text-sm"
                                        maxLength={250}
                                        showCount={true}
                                    />

                                    {validationErrors.questionText && <p className="text-red-500 text-sm">{validationErrors.questionText}</p>}

                                    <div className="flex gap-2 w-full mt-2">
                                        {/* Update Button */}
                                        <Button
                                            onClick={() => stopEditing("question", localValues.question)}
                                            className="bg-gray-800 text-white px-3 py-1 rounded-md text-sm flex items-center h-8"
                                            title="Save Changes"
                                        >
                                            <FaCheck className="mr-1 w-4 h-4" /> Update
                                        </Button>

                                        {/* Cancel Button */}
                                        <Button
                                            onClick={() => handleEditCancel("question")}
                                            className="bg-red-500 text-white px-3 py-1 rounded-md text-sm flex items-center h-8"
                                            title="Discard Changes"
                                        >
                                            <FaTimes className="mr-1 w-4 h-4" /> Cancel
                                        </Button>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="flex-1 min-w-0">
                                <div className="text-gray-600 break-words text-base">
                                    {question.question}
                                    <FaEdit
                                        className="inline-block ml-2 text-gray-500 cursor-pointer"
                                        onClick={() => startEditing("question")}
                                        title="Edit Question"
                                    />
                                </div>

                                {validationErrors.questionText && (
                                    <p className="text-red-500 text-sm mt-1">{validationErrors.questionText}</p>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Required/Optional Badge */}
                    <div className="flex items-center mr-2">
                        {renderRequiredBadge()}
                    </div>

                    {/* Expand/Collapse Button */}
                    <button
                        type="button"
                        className="text-gray-700 items-center shrink-0"
                        onClick={toggleExpand}
                        title={isExpanded ? "Hide Question Details" : "Show Question Details"}
                    >
                        {isExpanded ? <FaChevronUp size={20} /> : <FaChevronDown size={20} />}
                    </button>
                </div>

                {/* Smooth Expanded Section */}
                <div
                    ref={contentRef}
                    style={{
                        maxHeight,
                        overflow: "hidden",
                        transition: isAnimating ? "max-height 0.3s ease-in-out" : "none",
                    }}
                >
                    <div className="p-3 mt-3 border-t border-gray-300">{renderQuestion()}</div>
                    {/* Delete Question button */}
                    <div className="flex justify-end mr-6 mb-2">
                        <Button
                            onClick={() => handleConfirmDelete()}
                            className="text-white bg-red-500 hover:bg-red-600 px-3 py-1 rounded-md flex items-center gap-2"
                            title="Delete Question"
                        >
                            <Trash className="w-4 h-4" /> Delete Question
                        </Button>
                    </div>
                </div>
            </li>
        </>
    );
};

export default QuestionItem;
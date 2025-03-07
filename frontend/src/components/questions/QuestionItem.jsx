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

const QuestionItem = ({ question, onChange, onDeleteQuestion }) => {
    const [hasExpandedBefore, setHasExpandedBefore] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const [editingField, setEditingField] = useState(null);
    const [localValues, setLocalValues] = useState({ ...question });
    const contentRef = useRef(null);
    const [maxHeight, setMaxHeight] = useState("0px");
    const [isAnimating, setIsAnimating] = useState(false);
    const [confirmAction, setConfirmAction] = useState(false);
    const [actionType, setActionType] = useState(null);

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
        transform: CSS.Transform.toString(transform),
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
                return <TrueFalseQuestion question={question} onChange={onChange} isExpanded={isExpanded} />;
            case QuestionTypes.MULTICHOICE:
                return <MultichoiceQuestion question={question} onChange={onChange} isExpanded={isExpanded} />;
            case QuestionTypes.DROPDOWN:
                return <DropdownQuestion question={question} onChange={onChange} isExpanded={isExpanded} />;
            case QuestionTypes.FILE_UPLOAD:
                return <FileUploadQuestion question={question} onChange={onChange} isExpanded={isExpanded} />;
            default:
                return <span>{question.question}</span>;
        }
    };

    const renderQuestionType = () => {
        switch (question.type) {
            case QuestionTypes.TRUE_FALSE:
                return "True/False";
            case QuestionTypes.MULTICHOICE:
                return "Multi Choice";
            case QuestionTypes.DROPDOWN:
                return "Dropdown";
            case QuestionTypes.FILE_UPLOAD:
                return "File Upload";
            default:
                return question.questionType;
        }
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

                                    <div className="flex gap-2 w-full mt-2">
                                        {/* Update Button */}
                                        <Button
                                            onClick={() => stopEditing("question", localValues.question)}
                                            className="bg-gray-800 text-white px-3 py-1 rounded-md text-sm flex items-center h-8"
                                        >
                                            <FaCheck className="mr-1 w-4 h-4" /> Update
                                        </Button>

                                        {/* Cancel Button */}
                                        <Button
                                            onClick={() => handleEditCancel("question")}
                                            className="bg-red-500 text-white px-3 py-1 rounded-md text-sm flex items-center h-8"
                                        >
                                            <FaTimes className="mr-1 w-4 h-4" /> Cancel
                                        </Button>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div
                                className="cursor-pointer text-gray-600 flex-1 break-words min-w-0 text-base"
                                onClick={() => startEditing("question")}
                                title="Edit Question"
                            >
                                {question.question} <FaEdit className="inline-block ml-2 text-gray-500" />
                            </div>
                        )}
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
                    className="mt-3 border-t border-gray-300"
                >
                    <div className="p-3">{renderQuestion()}</div>
                    {/* Delete Question button */}
                    <div className="flex justify-end mr-6 mb-2">
                        <Button
                            onClick={() => handleConfirmDelete()}
                            className="text-white bg-red-500 hover:bg-red-600 px-3 py-1 rounded-md flex items-center gap-2"
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
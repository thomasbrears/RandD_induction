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
import { FaGripLines, FaChevronDown, FaChevronUp, FaEdit } from 'react-icons/fa';
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
                return <TrueFalseQuestion question={question} onChange={onChange} />;
            case QuestionTypes.MULTICHOICE:
                return <MultichoiceQuestion question={question} onChange={onChange} />;
            case QuestionTypes.DROPDOWN:
                return <DropdownQuestion question={question} onChange={onChange} />;
            case QuestionTypes.FILE_UPLOAD:
                return <FileUploadQuestion question={question} onChange={onChange} />;
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
                <div className="flex items-center w-full gap-4">
                    {/* Drag Icon */}
                    <span {...listeners} className="text-gray-600 cursor-grab flex items-center"
                        title="Drag to change question order">
                        <FaGripLines />
                    </span>

                    {/* Question Type and Text */}
                    <p className="text-lg font-bold uppercase">{renderQuestionType()}</p>
                    <div className="flex flex-wrap items-center flex-grow gap-4 min-w-0">
                        {editingField === "question" ? (
                            <>
                                <div className="flex flex-wrap items-center flex-grow">
                                    <Input.TextArea
                                        value={localValues.question}
                                        onChange={(e) => handleLocalChange("question", e.target.value)}
                                        onBlur={() => stopEditing("question", localValues.question)}
                                        placeholder="Enter your question..."
                                        autoSize={{ minRows: 1, maxRows: 5 }}
                                        className="w-full text-xl font-semibold"
                                    />
                                </div>
                            </>
                        ) : (
                            <p
                                className="text-xl font-semibold cursor-text break-words w-full "
                                onClick={() => startEditing("question")}
                                title="Edit Question"
                            >
                                {question.question} <FaEdit className="inline-block text-gray-500 ml-2" />
                            </p>
                        )}
                    </div>

                    {/* Expand/Collapse Button */}
                    <button
                        type="button"
                        className="text-gray-700 ml-2 shrink-0"
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
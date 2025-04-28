import React, { useState, useRef, useEffect } from "react";
import {
    useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "antd";
import TrueFalseQuestion from "./TrueFalseQuestion";
import MultichoiceQuestion from "./MultichoiceQuestion";
import DropdownQuestion from "./DropdownQuestion";
import FileUploadQuestion from "./FileUploadQuestion";
import YesNoQuestion from "./YesNoQuestion";
import ShortAnswerQuestion from "./ShortAnswerQuestion";
import InformationQuestion from "./InformationQuestion";
import { FaBars, FaChevronDown, FaChevronUp, FaEdit } from 'react-icons/fa';
import QuestionTypes from "../../models/QuestionTypes";
import ConfirmationModal from "../ConfirmationModal";
import { Trash } from "lucide-react";
import ShortAnswerQuestion from "./ShortAnswerQuestion";
import InformationQuestion from "./InformationQuestion";

const QuestionItem = ({ question, onDeleteQuestion, onQuestionEdit, index, getImageUrl }) => {
    const [hasExpandedBefore, setHasExpandedBefore] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const contentRef = useRef(null);
    const [maxHeight, setMaxHeight] = useState("0px");
    const [isAnimating, setIsAnimating] = useState(false);
    const [confirmAction, setConfirmAction] = useState(false);
    const [actionType, setActionType] = useState(null);

    const toggleExpand = () => setIsExpanded((prev) => !prev);

    const { attributes, listeners, setNodeRef, transform, transition } =
        useSortable({ id: question.id });

    const style = {
        transform: transform ? CSS.Translate.toString(transform) : undefined,
        transition,
    };

    const handleQuestionEdit = () => {
        onQuestionEdit(question);
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
                    getImageUrl={getImageUrl}
                />;
            case QuestionTypes.MULTICHOICE:
                return <MultichoiceQuestion
                    question={question}
                    getImageUrl={getImageUrl}
                />;
            case QuestionTypes.DROPDOWN:
                return <DropdownQuestion
                    question={question}
                    getImageUrl={getImageUrl}
                />;
            case QuestionTypes.FILE_UPLOAD:
                return <FileUploadQuestion
                    question={question}
                    getImageUrl={getImageUrl}
                />;
            case QuestionTypes.YES_NO:
                return <YesNoQuestion
                    question={question}
                    getImageUrl={getImageUrl}
                />;
            case QuestionTypes.SHORT_ANSWER:
                return <ShortAnswerQuestion
                    question={question}
                    getImageUrl={getImageUrl}
                />;
            case QuestionTypes.INFORMATION:
                return <InformationQuestion
                    question={question}
                    getImageUrl={getImageUrl}
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

    const cancelActionHandler = () => {
        setConfirmAction(false);
    };

    const confirmActionHandler = () => {
        if (actionType === 'delete') {
            onDeleteQuestion(question.id);
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

            <li ref={setNodeRef} style={style} {...attributes} className="p-4 bg-white shadow-md rounded-md flex flex-col border w-full">
                {/* Header Section */}
                <div className="flex items-center gap-4 p-3 w-full">
                    {/* Drag Icon */}
                    <span {...listeners} className="text-gray-600 cursor-grab flex items-center" title="Drag to change question order">
                        <FaBars size={18} />
                    </span>

                    {/* Question Index */}
                    <span className="text-gray-500 font-semibold">{index + 1}.</span>

                    {/* Question Type and Text */}
                    <span className="text-lg font-semibold text-gray-800">{renderQuestionType()}</span>

                    <div className="flex flex-wrap items-center flex-grow min-w-0">
                        <div className="flex-1 min-w-0">
                            <div className="text-gray-700 break-words text-base">{question.question}</div>
                        </div>
                    </div>

                    {/* Question Edit Button */}
                    <button
                        type="button"
                        className="text-white bg-gray-800 hover:bg-gray-900 px-3 py-2 rounded-md flex items-center gap-2"
                        onClick={handleQuestionEdit}
                        title="Edit Question"
                    >
                        <FaEdit size={16} /> Edit
                    </button>

                    {/* Expand/Collapse Button */}
                    <button
                        type="button"
                        className="text-gray-700 hover:text-gray-900 items-center shrink-0"
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
                    <div className="p-4 mt-2 border-t border-gray-300">{renderQuestion()}</div>

                    {/* Delete Question button */}
                    <div className="flex justify-end  pr-4 pb-4">
                        <Button
                            onClick={handleConfirmDelete}
                            className="text-white bg-red-500 hover:bg-red-600 px-3 py-2 rounded-md flex items-center gap-2"
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

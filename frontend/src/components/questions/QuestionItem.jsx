import React, { useState, useRef, useEffect } from "react";
import {
    useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button, Tooltip, Popconfirm } from "antd";
import TrueFalseQuestion from "./TrueFalseQuestion";
import MultichoiceQuestion from "./MultichoiceQuestion";
import DropdownQuestion from "./DropdownQuestion";
import FileUploadQuestion from "./FileUploadQuestion";
import YesNoQuestion from "./YesNoQuestion";
import ShortAnswerQuestion from "./ShortAnswerQuestion";
import InformationQuestion from "./InformationQuestion";
import { FaChevronDown, FaChevronUp, FaEdit } from 'react-icons/fa';
import { FaArrowsUpDown } from 'react-icons/fa6';
import { DeleteOutlined } from '@ant-design/icons';
import QuestionTypes from "../../models/QuestionTypes";

const QuestionItem = ({ question, onDeleteQuestion, onQuestionEdit, index, getImageUrl }) => {
    const [hasExpandedBefore, setHasExpandedBefore] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const contentRef = useRef(null);
    const [maxHeight, setMaxHeight] = useState("0px");
    const [isAnimating, setIsAnimating] = useState(false);
    const [isDragging, setIsDragging] = useState(false);

    const toggleExpand = () => setIsExpanded((prev) => !prev);

    const { attributes, listeners, setNodeRef, transform, transition, isDragging: dndIsDragging } =
        useSortable({ id: question.id });
    
    useEffect(() => {
        setIsDragging(dndIsDragging);
        
        // Collapse expanded view when dragging
        if (dndIsDragging && isExpanded) {
            setIsExpanded(false);
        }
    }, [dndIsDragging, isExpanded]);

    const style = {
        transform: transform ? CSS.Translate.toString(transform) : undefined,
        transition,
        zIndex: isDragging ? 999 : 'auto',
        position: isDragging ? 'relative' : 'static',
        boxShadow: isDragging ? '0 4px 20px rgba(0, 0, 0, 0.2)' : 'none',
    };

    const handleQuestionEdit = () => {
        onQuestionEdit(question);
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

    const getQuestionType = () => {
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
        // This function is no longer needed with Popconfirm
    };

    const confirmActionHandler = () => {
        // This function is no longer needed with Popconfirm
    };

    return (
        <>
            <li 
                ref={setNodeRef} 
                style={style} 
                {...attributes} 
                className={`p-4 bg-white shadow-md rounded-md flex flex-col border w-full ${isDragging ? 'bg-blue-50' : ''}`}
            >
                {/* Header Section */}
                <div className="flex items-center gap-4 p-3 w-full">
                    {/* Drag Handle with Tooltip */}
                    <Tooltip title="Drag to reorder question" placement="top">
                        <div 
                            {...listeners} 
                            className="flex items-center justify-center h-10 w-10 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-600 cursor-grab transition-colors" 
                            aria-label="Drag to reorder"
                        >
                            <FaArrowsUpDown size={18} />
                        </div>
                    </Tooltip>

                    {/* Question Index */}
                    <span className="text-gray-500 font-semibold">{index + 1}.</span>

                    {/* Question Text as Main Focus with Type Tag */}
                    <div className="flex flex-wrap items-center flex-grow min-w-0">
                        <div className="flex-1 min-w-0 flex items-center gap-2 flex-wrap">
                            <div className="text-gray-700 break-words text-lg font-medium">
                                {question.question}
                            </div>
                            {/* Question Type Tag */}
                            <div className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm font-medium whitespace-nowrap">
                                {getQuestionType()}
                            </div>
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
                    <div className="flex justify-end pr-4 pb-4">
                        <Popconfirm
                            title="Delete Question"
                            description="Are you sure you want to delete this question? THIS CANNOT BE UNDONE."
                            onConfirm={() => onDeleteQuestion(question.id)}
                            okText="Delete"
                            cancelText="Cancel"
                            okButtonProps={{ danger: true }}
                        >
                            <Button 
                                danger 
                                icon={<DeleteOutlined />}
                            >
                                Delete Question
                            </Button>
                        </Popconfirm>
                    </div>
                </div>
            </li>
        </>
    );
};

export default QuestionItem;
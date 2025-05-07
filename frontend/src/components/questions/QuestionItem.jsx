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
import { FaChevronDown, FaChevronUp, FaEdit, FaCopy } from 'react-icons/fa';
import { FaArrowsUpDown } from 'react-icons/fa6';
import { DeleteOutlined } from '@ant-design/icons';
import QuestionTypes from "../../models/QuestionTypes";

const QuestionItem = ({ question, onDeleteQuestion, onQuestionEdit, onQuestionDuplicate, index, getImageUrl }) => {
    const [hasExpandedBefore, setHasExpandedBefore] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const contentRef = useRef(null);
    const [maxHeight, setMaxHeight] = useState("0px");
    const [isAnimating, setIsAnimating] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    
    // Refs for the areas we want to exclude from edit click
    const actionsRef = useRef(null);
    const dragHandleRef = useRef(null);

    const toggleExpand = (e) => {
        e.stopPropagation();
        setIsExpanded((prev) => !prev);
    };

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

    const handleQuestionEdit = (e) => {
        if (e) e.stopPropagation();
        onQuestionEdit(question);
    };

    const handleQuestionDuplicate = (e) => {
        e.stopPropagation();
        onQuestionDuplicate(question);
    };
    
    const handleDeleteQuestion = (e) => {
        if (e) e.stopPropagation();
        onDeleteQuestion(question.id);
    };

    const handleListItemClick = (e) => {
        // Check if the click was inside our excluded areas (action buttons or drag handle)
        if (actionsRef.current && actionsRef.current.contains(e.target)) {
            return; // Clicked on action buttons - do nothing
        }
        
        if (dragHandleRef.current && dragHandleRef.current.contains(e.target)) {
            return; // Clicked on drag handle - do nothing
        }
        
        // If we got here, the click was on the main area of the question item - edit the question
        handleQuestionEdit();
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

    return (
        <>
            <li 
                ref={setNodeRef} 
                style={style} 
                {...attributes} 
                className={`p-4 bg-white shadow-md rounded-md flex flex-col border w-full ${isDragging ? 'bg-blue-50' : ''} cursor-pointer hover:bg-gray-50 transition-colors`}
                onClick={handleListItemClick}
            >
                {/* Header Section */}
                <div className="flex items-center gap-4 p-3 w-full">
                    {/* Drag Handle with Tooltip */}
                    <Tooltip title="Drag to reorder question" placement="top">
                        <div 
                            ref={dragHandleRef}
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

                    {/* Action Buttons */}
                    <div ref={actionsRef} className="flex items-center gap-2">
                        {/* Edit Button - Small and first in order */}
                        <Tooltip title="Edit Question" placement="top">
                            <button
                                type="button"
                                className="text-gray-600 hover:text-gray-800 bg-gray-50 hover:bg-gray-100 p-2 rounded-md"
                                onClick={handleQuestionEdit}
                            >
                                <FaEdit size={16} />
                            </button>
                        </Tooltip>
                        
                        {/* Duplicate Button */}
                        <Tooltip title="Duplicate Question" placement="top">
                            <button
                                type="button"
                                className="text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 p-2 rounded-md"
                                onClick={handleQuestionDuplicate}
                            >
                                <FaCopy size={16} />
                            </button>
                        </Tooltip>

                        {/* Delete Button */}
                        <Tooltip title="Delete Question" placement="top">
                            <Popconfirm
                                title="Delete Question"
                                description="Are you sure you want to delete this question? THIS CANNOT BE UNDONE."
                                onConfirm={handleDeleteQuestion}
                                okText="Delete"
                                cancelText="Cancel"
                                okButtonProps={{ danger: true }}
                            >
                                <button
                                    type="button"
                                    className="text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 p-2 rounded-md"
                                >
                                    <DeleteOutlined style={{ fontSize: '16px' }} />
                                </button>
                            </Popconfirm>
                        </Tooltip>

                        {/* Expand/Collapse Button */}
                        <button
                            type="button"
                            className="text-gray-600 hover:text-gray-800 bg-gray-50 hover:bg-gray-100 p-2 rounded-md"
                            onClick={toggleExpand}
                            title={isExpanded ? "Hide Question Details" : "Show Question Details"}
                        >
                            {isExpanded ? <FaChevronUp size={16} /> : <FaChevronDown size={16} />}
                        </button>
                    </div>
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

                    {/* Edit and Delete buttons in expanded view */}
                    <div className="flex justify-end pr-4 pb-4 gap-2">
                        <Button 
                            type="primary"
                            icon={<FaEdit />}
                            onClick={handleQuestionEdit}
                        >
                            Edit Question
                        </Button>
                        
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
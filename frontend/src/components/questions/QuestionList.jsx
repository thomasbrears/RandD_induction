import React, { useState, useRef, useEffect } from "react";
import {
  DndContext,
  closestCenter,
  useSensor,
  useSensors,
  PointerSensor,
  KeyboardSensor,
  TouchSensor,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Input } from "antd";
import TrueFalseQuestion from "./TrueFalseQuestion";
import MultichoiceQuestion from "./MultichoiceQuestion";
import DropdownQuestion from "./DropdownQuestion";
import FileUploadQuestion from "./FileUploadQuestion";
import { FaGripLines, FaChevronDown, FaChevronUp, FaEdit} from 'react-icons/fa';

// QuestionItem component
const QuestionItem = ({ question, onChange }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [editingField, setEditingField] = useState(null);
  const [localValues, setLocalValues] = useState({ ...question });
  const contentRef = useRef(null);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    if (isExpanded && contentRef.current) {
      setHeight(contentRef.current.scrollHeight);
    } else {
      setHeight(0);
    }
  }, [isExpanded]);

  const startEditing = (field) => setEditingField(field);
  const stopEditing = () => {
    onChange(question.id, localValues);
    setEditingField(null);
  };

  const handleChange = (field, value) => {
    setLocalValues((prev) => ({ ...prev, [field]: value }));
    onChange(question.id, field, value);
  };

  const toggleExpand = () => setIsExpanded((prev) => !prev);

  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: question.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const renderQuestion = () => {
    switch (question.type) {
      case "true_false":
        return <TrueFalseQuestion question={question} onChange={onChange} />;
      case "multichoice":
        return <MultichoiceQuestion question={question} onChange={onChange} />;
        case "dropdown":
        return <DropdownQuestion question={question} onChange={onChange} />;
        case "file_upload":
        return <FileUploadQuestion question={question} onChange={onChange} />;
      default:
        return <span>{question.question}</span>;
    }
  };

  return (
    <li ref={setNodeRef} style={style} {...attributes} className="p-3 bg-white shadow-md rounded-md flex flex-col border w-full">
      {/* Header Section */}
      <div className="flex items-center w-full gap-4">
        {/* Drag Icon */}
        <span {...listeners} className="text-gray-600 cursor-grab flex items-center">
          <FaGripLines />
        </span>

        {/* Question Type and Text */}
        <p className="text-lg font-bold uppercase">{question.type}</p>
        <div className="flex flex-wrap items-center flex-grow gap-4 min-w-0">
          {editingField === "question" ? (
            <>
              <div className="flex flex-wrap items-center flex-grow">
                <Input.TextArea
                  value={localValues.question}
                  onChange={(e) => handleChange("question", e.target.value)}
                  onBlur={stopEditing}
                  placeholder="Enter your question..."
                  autoSize={{ minRows: 1, maxRows: 5 }}
                  className="w-full text-xl font-semibold"
                  onPressEnter={stopEditing}
                  allowClear={true}
                />
              </div>
            </>
          ) : (
            <p
              className="text-xl font-semibold cursor-text break-words w-full "
              onClick={() => startEditing("question")}
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
        >
          {isExpanded ? <FaChevronUp size={20} /> : <FaChevronDown size={20} />}
        </button>
      </div>

      {/* Smooth Expanded Section */}
      <div
        ref={contentRef}
        style={{
          height: `${height}px`,
          overflow: "hidden",
          transition: "height 0.3s ease-in-out",
        }}
        className="mt-3 border-t border-gray-300"
      >
        <div className="p-3">{renderQuestion()}</div>
      </div>
    </li>
  );
};

// QuestionList component
const QuestionList = ({ questions = [], setQuestions }) => {

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor),
    useSensor(TouchSensor)
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setQuestions((prevQuestions) => {
      const oldIndex = prevQuestions.findIndex((q) => q.id === active.id);
      const newIndex = prevQuestions.findIndex((q) => q.id === over.id);
      return arrayMove(prevQuestions, oldIndex, newIndex);
    });
  };

  const handleQuestionChange = (id, field, value) => {
    setQuestions((prevQuestions) =>
      prevQuestions.map((q) =>
        q.id === id ? { ...q, [field]: value } : q
      )
    );
  };

  return (
    <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd} sensors={sensors}>
      <SortableContext items={questions.map((q) => q.id)} strategy={verticalListSortingStrategy}>
        <ul className="space-y-2">
          {questions.map((question) => (
            <QuestionItem key={question.id} question={question} onChange={handleQuestionChange} />
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  );
};

export default QuestionList;
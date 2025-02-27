import React, { useState } from "react";
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
import TrueFalseQuestion from "./questions/TrueFalseQuestion";

const QuestionItem = ({ question, onChange }) => {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: question.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const renderQuestion = () => {
    switch (question.type) {
      case "true-false":
        return <TrueFalseQuestion question={question} onChange={onChange} />;
      default:
        return <span>{question.question}</span>;
    }
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="p-3 bg-white shadow-md rounded-md flex items-center cursor-grab"
    >
      <span className="mr-2 text-gray-600">☰</span> 
      {renderQuestion()}
    </li>
  );
};

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
  
    const handleAnswerChange = (id, answer) => {
      setQuestions((prevQuestions) =>
        prevQuestions.map((q) => (q.id === id ? { ...q, answer } : q))
      );
    };
  
    return (
      <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd} sensors={sensors}>
        <SortableContext items={questions.map(q => q.id)} strategy={verticalListSortingStrategy}>
          <ul className="space-y-2">
            {questions.map((question) => (
              <QuestionItem key={question.id} question={question} onChange={handleAnswerChange} />
            ))}
          </ul>
        </SortableContext>
      </DndContext>
    );
  };

export default QuestionList;
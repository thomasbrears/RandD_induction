import React from "react";
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
  arrayMove,
} from "@dnd-kit/sortable";
import QuestionItem from "./QuestionItem";

const QuestionList = ({ questions = [], setQuestions, saveAllFields, updateFieldsBeingEdited }) => {

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

  const handleQuestionDelete = (id) => {
    setQuestions((prevQuestions) => prevQuestions.filter((q) => q.id !== id));
  };

  return (
    <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd} sensors={sensors}>
      <SortableContext items={questions.map((q) => q.id)} strategy={verticalListSortingStrategy}>
        <ul className="space-y-2">
          {questions.map((question) => (
            <QuestionItem  key={question.id} 
            question={question} 
            onChange={handleQuestionChange} 
            onDeleteQuestion={handleQuestionDelete}
            saveAllFields={saveAllFields}
            updateFieldsBeingEdited={updateFieldsBeingEdited}
            />
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  );
};

export default QuestionList;
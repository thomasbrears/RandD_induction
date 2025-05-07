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
  arrayMove,
} from "@dnd-kit/sortable";
import QuestionItem from "./QuestionItem";
import { FaArrowsUpDown } from "react-icons/fa6";
import QuestionForm from "./QuestionForm";
import { v4 as uuidv4 } from 'uuid';

const QuestionList = ({ questions = [], setQuestions, onQuestionEdit, getImageUrl, saveFileChange }) => {
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);

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

  const handleQuestionDelete = (id) => {
    setQuestions((prevQuestions) => prevQuestions.filter((q) => q.id !== id));
    // Close modal if we're deleting from the modal
    if (showQuestionModal && editingQuestion?.id === id) {
      setShowQuestionModal(false);
    }
  };

  const handleCloseModal = () => {
    setShowQuestionModal(false);
    setEditingQuestion(null);
  };

  const handleQuestionEdit = (question) => {
    setEditingQuestion(question);
    setShowQuestionModal(true);
  };

  const handleSaveQuestion = (updatedQuestion) => {
    setQuestions((prevQuestions) => {
      if (prevQuestions.some(q => q.id === updatedQuestion.id)) {
        return prevQuestions.map(q => q.id === updatedQuestion.id ? updatedQuestion : q);
      } else {
        return [...prevQuestions, updatedQuestion];
      }
    });
    setShowQuestionModal(false);
    setEditingQuestion(null);
  };

  const handleQuestionDuplicate = (questionToDuplicate) => {
    // Create a deep copy of the question with a new ID
    const duplicatedQuestion = {
      ...JSON.parse(JSON.stringify(questionToDuplicate)),
      id: uuidv4(), // Generate a new ID for the duplicated question
      question: `${questionToDuplicate.question} (Copy)`, // Add "(Copy)" to the question text
      imageFile: null // Don't duplicate the image file, just set it to null
    };

    // Add the duplicated question right after the original one
    setQuestions((prevQuestions) => {
      const originalIndex = prevQuestions.findIndex(q => q.id === questionToDuplicate.id);
      const newQuestions = [...prevQuestions];
      newQuestions.splice(originalIndex + 1, 0, duplicatedQuestion);
      return newQuestions;
    });
  };

  return (
    <div className="space-y-4">
      {/* Question Form Modal */}
      <QuestionForm
        visible={showQuestionModal}
        onClose={handleCloseModal}
        onSave={handleSaveQuestion}
        questionData={editingQuestion}
        getImageUrl={getImageUrl}
        saveFileChange={saveFileChange}
        onDeleteQuestion={handleQuestionDelete}
      />
      
      <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd} sensors={sensors}>
        <SortableContext items={questions.map((q) => q.id)} strategy={verticalListSortingStrategy}>
          <ul className="space-y-4">
            {questions.map((question, index) => (
              <QuestionItem
                key={question.id}
                question={question}
                onDeleteQuestion={handleQuestionDelete}
                onQuestionEdit={handleQuestionEdit}
                onQuestionDuplicate={handleQuestionDuplicate}
                index={index} 
                getImageUrl={getImageUrl}
              />
            ))}
          </ul>
        </SortableContext>
      </DndContext>
      
      {/* Empty state message */}
      {questions.length === 0 && (
        <div className="text-center py-8 bg-gray-50 border border-dashed border-gray-300 rounded-md">
          <p className="text-gray-500">No questions added yet. Click the "Add Question" button to get started.</p>
        </div>
      )}
    </div>
  );
};

export default QuestionList;
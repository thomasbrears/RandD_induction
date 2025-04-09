import { useState, useEffect } from "react";
import { FaEdit, FaCheck, FaTimes } from "react-icons/fa";
import { Button, Input } from "antd";
import TiptapEditor from "../TiptapEditor";

const ShortAnswerQuestion = ({ question, onChange, isExpanded, saveAllFields, updateFieldsBeingEdited }) => {
  const [editingField, setEditingField] = useState(null);
  const [localValues, setLocalValues] = useState({ ...question });

  useEffect(() => {
    if (editingField && (saveAllFields || !isExpanded)) {
      stopEditing(editingField, localValues[editingField]);
      setEditingField(null);
    }
    updateFieldsBeingEdited(`${question.id}_content`, editingField);
    
  }, [isExpanded, editingField, saveAllFields]);

  const startEditing = (field) => setEditingField(field);
  const stopEditing = (field, value) => {
    onChange(question.id, field, value);
    setEditingField(null);
  };

  const handleLocalChange = (field, value) => {
    setLocalValues((prev) => ({ ...prev, [field]: value }));
  };

  const handleCancel = (field) => {
    setLocalValues((prev) => ({ ...prev, [field]: question[field] }));
    setEditingField(null);
  };

  return (
    <div className="p-4 bg-white shadow rounded-md">
      <div className="flex justify-between items-center mb-4">
        {editingField === "question" ? (
          <div className="flex w-full">
            <Input
              autoFocus
              className="flex-grow"
              value={localValues.question}
              onChange={(e) => handleLocalChange("question", e.target.value)}
              placeholder="Enter question"
            />
            <div className="ml-2 flex gap-1">
              <Button
                type="primary"
                onClick={() => stopEditing("question", localValues.question)}
                icon={<FaCheck />}
                className="bg-green-500 text-white"
              />
              <Button
                danger
                onClick={() => handleCancel("question")}
                icon={<FaTimes />}
                className="bg-red-500 text-white"
              />
            </div>
          </div>
        ) : (
          <>
            <h3 className="text-lg font-semibold flex-grow">{question.question}</h3>
            <Button
              type="link"
              onClick={() => startEditing("question")}
              icon={<FaEdit />}
            />
          </>
        )}
      </div>

      {question.description && (
        <div className="mb-4 bg-gray-50 p-3 rounded-md">
          <div dangerouslySetInnerHTML={{ __html: question.description }} />
        </div>
      )}

      <div className="mt-4">
        <p className="font-semibold mb-2">Sample Expected Answer (Reference Only):</p>
        {editingField === "sampleAnswer" ? (
          <div className="flex flex-col gap-2">
            <Input.TextArea
              autoFocus
              rows={4}
              value={localValues.sampleAnswer || ""}
              onChange={(e) => handleLocalChange("sampleAnswer", e.target.value)}
              placeholder="Enter a sample answer for reference"
            />
            <div className="flex gap-1 justify-end">
              <Button
                type="primary"
                onClick={() => stopEditing("sampleAnswer", localValues.sampleAnswer)}
                icon={<FaCheck />}
                className="bg-green-500 text-white"
              />
              <Button
                danger
                onClick={() => handleCancel("sampleAnswer")}
                icon={<FaTimes />}
                className="bg-red-500 text-white"
              />
            </div>
          </div>
        ) : (
          <div className="flex justify-between items-start">
            <div className="bg-gray-100 p-3 rounded-md flex-grow">
              {localValues.sampleAnswer ? (
                <p className="text-gray-700">{localValues.sampleAnswer}</p>
              ) : (
                <p className="text-gray-400 italic">No sample answer provided</p>
              )}
            </div>
            <Button
              type="link"
              onClick={() => startEditing("sampleAnswer")}
              icon={<FaEdit />}
              className="ml-2"
            />
          </div>
        )}
        <p className="text-xs text-gray-500 mt-1">
          This sample answer is for your reference only and won't be shown to the user.
        </p>
      </div>
    </div>
  );
};

export default ShortAnswerQuestion; 
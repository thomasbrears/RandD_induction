import { useState, useEffect } from "react";
import { FaEdit, FaCheck, FaTimes } from "react-icons/fa";
import { Button, Input } from "antd";
import TiptapEditor from "../TiptapEditor";

const InformationQuestion = ({ question, onChange, isExpanded, saveAllFields, updateFieldsBeingEdited }) => {
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
    <div className="p-4 bg-white shadow rounded-md border-l-4 border-blue-500">
      <div className="flex justify-between items-center mb-4">
        {editingField === "question" ? (
          <div className="flex w-full">
            <Input
              autoFocus
              className="flex-grow"
              value={localValues.question}
              onChange={(e) => handleLocalChange("question", e.target.value)}
              placeholder="Enter information title"
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

      <div className="mb-4">
        <p className="font-semibold mb-2">Information Content:</p>
        {editingField === "description" ? (
          <div className="flex flex-col gap-2">
            <TiptapEditor 
              localDescription={localValues.description || ""} 
              handleLocalChange={(field, value) => handleLocalChange("description", value)} 
            />
            <div className="flex gap-1 justify-end mt-2">
              <Button
                type="primary"
                onClick={() => stopEditing("description", localValues.description)}
                icon={<FaCheck />}
                className="bg-green-500 text-white"
              />
              <Button
                danger
                onClick={() => handleCancel("description")}
                icon={<FaTimes />}
                className="bg-red-500 text-white"
              />
            </div>
          </div>
        ) : (
          <div className="flex justify-between items-start">
            <div className="bg-blue-50 p-4 rounded-md flex-grow border border-blue-200">
              {localValues.description ? (
                <div dangerouslySetInnerHTML={{ __html: localValues.description }} />
              ) : (
                <p className="text-gray-400 italic">No information content provided. Click edit to add content.</p>
              )}
            </div>
            <Button
              type="link"
              onClick={() => startEditing("description")}
              icon={<FaEdit />}
              className="ml-2"
            />
          </div>
        )}
      </div>
      
      <div className="mt-4 bg-gray-100 p-3 rounded-md">
        <p className="text-sm text-gray-600">
          <span className="font-semibold">Note:</span> Information questions don't require user responses. They're used to display important information to users.
        </p>
      </div>
    </div>
  );
};

export default InformationQuestion; 
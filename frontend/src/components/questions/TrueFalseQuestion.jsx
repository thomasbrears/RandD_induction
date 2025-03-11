import { useState, useEffect } from "react";
import { FaEdit, FaCheck, FaTimes } from "react-icons/fa";
import { Button } from "antd";
import ReactQuill from "react-quill";
import {MODULES, FORMATS} from "../../models/QuillConfig";

const TrueFalseQuestion = ({ question, onChange, isExpanded, saveAllFields, updateFieldsBeingEdited }) => {
  const [editingField, setEditingField] = useState(null);
  const [localValues, setLocalValues] = useState({ ...question });

  useEffect(() => {
    if ((saveAllFields)||(!isExpanded && editingField)) {
      stopEditing(editingField, localValues[editingField]);
      setEditingField(null);
    }
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

  const handleTrueFalseAnswerSelect = (index) => {
    setLocalValues((prev) => ({
      ...prev,
      answers: [index],
    }));
    onChange(question.id, "answers", [index]);
  };

  return (
    <div className="p-4 rounded-md bg-white">
      {/* Description */}
      <div className="mb-2">
        <div className="flex items-center">
          <p className="font-semibold mr-2">Description: <span className="font-normal text-gray-500">(optional)</span></p>
          {editingField === "description" ? (
            <div className="flex gap-2">
              {/* Update Button */}
              <Button
                onClick={() => stopEditing("description", localValues.description)}
                className="bg-gray-800 font-normal text-white px-2 py-1 rounded-md text-sm flex items-center"
                title="Save Changes"
              >
                <FaCheck className="inline mr-2" /> Update
              </Button>
              {/* Cancel Button */}
              <Button
                onClick={() => handleCancel("description")}
                className="bg-red-500 text-white px-2 py-1 rounded-md text-sm flex items-center h-8"
                title="Discard Changes"
              >
                <FaTimes className="mr-1 w-4 h-4" /> Cancel
              </Button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => startEditing("description")}
              className="ml-2 text-gray-600 hover:text-gray-800"
              title="Edit description"
            >
              <FaEdit />
            </button>
          )}
        </div>

        {editingField === "description" ? (
          <div className="prose !max-w-none w-full mt-2">
            <ReactQuill
              value={localValues.description}
              onChange={(value) => handleLocalChange("description", value)}
              placeholder="Enter description..."
              className="w-full h-50 p-2 text-base focus:ring-gray-800 focus:border-gray-800"
              modules={MODULES}
              formats={FORMATS}
            />
          </div>
        ) : (
          <div className="prose !max-w-none w-full break-words mt-2">
            <p className="text-base cursor-pointer text-gray-600" dangerouslySetInnerHTML={{ __html: question.description || "No description" }} />
          </div>
        )}
      </div>

      {/* Options (True/False) */}
      <div className="mt-4">
        <div className="flex justify-between items-center">
          <p className="font-semibold">Options:</p>
          <p className="text-base text-gray-500">Choose the correct answer.</p>
        </div>

        {localValues.options.map((option, index) => (
          <div
            key={index}
            className={`flex items-center gap-2 mt-2 p-2 rounded-md cursor-pointer border-2 ${localValues.answers.length > 0 && localValues.answers[0] === index
              ? "bg-green-100 border-green-500"
              : "bg-gray-200 border-gray-400"
              }`}
            onClick={() => handleTrueFalseAnswerSelect(index)}
          >
            <input
              type="radio"
              name="trueFalseAnswer"
              value={index}
              checked={localValues.answers.length > 0 ? localValues.answers[0] === index : index === 0}
              onChange={() => handleTrueFalseAnswerSelect(index)}
              className="cursor-pointer"
            />
            <span className="text-gray-700 text-base">{option}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TrueFalseQuestion;
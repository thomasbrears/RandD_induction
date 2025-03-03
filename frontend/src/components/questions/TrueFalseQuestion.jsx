import { useState } from "react";
import { FaEdit, FaCheck } from "react-icons/fa";
import ReactQuill from "react-quill";

const TrueFalseQuestion = ({ question, onChange }) => {
  const [editingField, setEditingField] = useState(null);
  const [localValues, setLocalValues] = useState({ ...question });

  // Define the toolbar options
  const MODULES = {
    toolbar: [["bold", "italic", "underline"]],
  };

  const FORMATS = ["bold", "italic", "underline"];

  const startEditing = (field) => setEditingField(field);
  const stopEditing = () => {
    onChange(question.id, localValues);
    setEditingField(null);
  };

  const handleChange = (field, value) => {
    setLocalValues((prev) => ({ ...prev, [field]: value }));
    onChange(question.id, field, value);
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
          <p className="font-semibold mr-2">Description:</p>
          {editingField === "description" ? (
            <button
              type="button"
              onClick={stopEditing}
              className="bg-gray-800 font-normal text-white px-3 py-1 rounded-md text-sm flex items-center"
            >
              <FaCheck className="inline mr-2" /> Update
            </button>
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
              onChange={(value) => handleChange("description", value)}
              placeholder="Enter description"
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
          <p className="text-sm text-gray-500">Choose the correct answer.</p>
        </div>

        {localValues.options.map((option, index) => (
          <div
            key={index}
            className={`flex items-center gap-2 mt-2 p-2 rounded-md cursor-pointer border-2 ${localValues.answers.length > 0 && localValues.answers[0] === index
              ? "bg-green-100 border-green-500"
              : "bg-white border-gray-300"
              }`}
            onClick={() => handleTrueFalseAnswerSelect(index)}
          >
            <input
              type="radio"
              name="trueFalseAnswer"
              checked={localValues.answers.length > 0 ? localValues.answers[0] === index : index === 0}
              onChange={() => handleTrueFalseAnswerSelect(index)}
              className="cursor-pointer"
            />
            <span className="text-gray-700 text-sm">{option}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TrueFalseQuestion;
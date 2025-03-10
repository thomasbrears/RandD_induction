import { useState, useEffect } from "react";
import { Input, Button } from "antd";
import { FaEdit, FaCheck, FaTimes } from "react-icons/fa";
import ReactQuill from "react-quill";
import {MODULES, FORMATS} from "../../models/QuillConfig";

const MultichoiceQuestion = ({ question, onChange, isExpanded}) => {
  const [editingField, setEditingField] = useState(null);
  const [localValues, setLocalValues] = useState({ ...question });

  useEffect(() => {
    if (!isExpanded && editingField) {
      if (editingField.startsWith("option-")) {
        stopEditing("options", localValues.options);
      } else {
        stopEditing(editingField, localValues[editingField]);
      }
      setEditingField(null);
    }
  }, [isExpanded, editingField]);

  const startEditing = (field) => setEditingField(field);
  const stopEditing = (field, value) => {
    onChange(question.id, field, value);
    setEditingField(null);
  };

  const handleChange = (field, value) => {
    setLocalValues((prev) => ({ ...prev, [field]: value }));
    onChange(question.id, field, value);
  };

  const handleLocalChange = (field, value) => {
    setLocalValues((prev) => ({ ...prev, [field]: value }));
  };

  const handleCancel = (field) => {
    setLocalValues((prev) => ({ ...prev, [field]: question[field] }));
    setEditingField(null);
  };

  const handleAddOption = () => {
    handleChange("options", [...localValues.options, ""]);
  };

  const handleRemoveOption = (index) => {
    const newOptions = [...localValues.options];
    newOptions.splice(index, 1);

    const newAnswers =
      Array.isArray(localValues.answers) && localValues.answers.length > 0
        ? localValues.answers
          .map((answerIndex) => (answerIndex > index ? answerIndex - 1 : answerIndex))
          .filter((answerIndex) => answerIndex !== index)
        : [];

    handleChange("options", newOptions);
    handleChange("answers", newAnswers);
  };

  const handleAnswerSelect = (index) => {
    let newAnswers = [...localValues.answers];

    if (newAnswers.includes(index)) {
      newAnswers = newAnswers.filter(answer => answer !== index);
    } else {
      newAnswers.push(index);
    }

    handleChange("answers", newAnswers);
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

      {/* Options */}
      <div>
        <div className="flex justify-between items-center">
          <p className="font-semibold">Options:</p>
          <Button
            onClick={handleAddOption}
            className="text-white bg-gray-800 hover:bg-gray-900 px-4 py-2 rounded-md"
            title="Add Option"
          >
            Add Option
          </Button>
        </div>

        {localValues.options.map((option, index) => (
          <div
            key={index}
            className={`flex items-start gap-2 mt-2 p-2 rounded-md border-2 transition-colors ${localValues.answers.includes(index)
              ? "bg-green-100 border-green-500"
              : "bg-gray-200 border-gray-400"
              }`}
          >
            {/* Custom Checkbox */}
            <button
              type="button"
              onClick={() => handleAnswerSelect(index)}
              className={`relative w-7 h-7 flex items-center justify-center rounded-md cursor-pointer transition-all ${localValues.answers.includes(index) ? "bg-green-500" : "bg-gray-400"
                }`}
              title={
                localValues.answers.includes(index) ? "Correct answer" : "Incorrect answer"
              }
            >
              <span className="group">
                {localValues.answers.includes(index) ? (
                  <FaCheck className="text-white w-5 h-5" />
                ) : (
                  <FaTimes className="text-white w-5 h-5" />
                )}
              </span>
            </button>

            {/* Editable Option Text */}
            {editingField === `option-${index}` ? (
              <div className="flex flex-1 flex-col gap-2">
                {/* Input Area */}
                <Input.TextArea
                  className="flex-1 min-w-0"
                  placeholder="Enter your answer option"
                  value={localValues.options[index]}
                  onChange={(e) => {
                    const newOptions = [...localValues.options];
                    newOptions[index] = e.target.value;
                    handleLocalChange("options", newOptions);
                  }}
                  autoSize={{ minRows: 1, maxRows: 5 }}
                  maxLength={500}
                  showCount={true}
                />

                <div className="flex gap-2">
                  {/* Update Button */}
                  <Button
                    onClick={() => stopEditing("options", localValues.options)}
                    className="bg-gray-800 text-white px-3 py-1 rounded-md text-sm flex items-center h-8"
                    title="Save Changes"
                  >
                    <FaCheck className="mr-1 w-4 h-4" /> Update
                  </Button>

                  {/* Cancel Button */}
                  <Button
                    onClick={() => handleCancel("options")}
                    className="bg-red-500 text-white px-3 py-1 rounded-md text-sm flex items-center h-8"
                    title="Discard Changes"
                  >
                    <FaTimes className="mr-1 w-4 h-4" /> Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div
                className="cursor-pointer text-gray-600 flex-1 break-words min-w-0"
                onClick={() => startEditing(`option-${index}`)}
                title="Edit Option Text"
              >
                {option} <FaEdit className="inline-block ml-2 text-gray-500" />
              </div>
            )}

            {/* Remove Option Button */}
            <Button
              onClick={() => handleRemoveOption(index)}
              className="text-white bg-red-500 hover:bg-red-600 px-3 py-1 rounded-md self-start"
              title="Remove Option"
            >
              Remove
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MultichoiceQuestion;
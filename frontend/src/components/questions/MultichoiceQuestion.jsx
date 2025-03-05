import { useState } from "react";
import { Input, Button, Checkbox } from "antd";
import { FaEdit, FaCheck } from "react-icons/fa";
import ReactQuill from "react-quill";
import { Check, X } from "lucide-react";

const MultichoiceQuestion = ({ question, onChange }) => {
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

  const handleAddOption = () => {
    handleChange("options", [...localValues.options, ""]);
  };

  const handleRemoveOption = (index) => {
    const newOptions = [...localValues.options];
    newOptions.splice(index, 1);

    const newAnswers = localValues.answers
      .map(answerIndex => (answerIndex > index ? answerIndex - 1 : answerIndex))
      .filter(answerIndex => answerIndex !== index);

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

      {/* Options */}
      <div>
        <div className="flex justify-between items-center">
          <p className="font-semibold">Options:</p>
          <Button
            onClick={handleAddOption}
            className="text-white bg-gray-800 hover:bg-gray-900 px-4 py-2 rounded-md"
          >
            Add Option
          </Button>
        </div>

        {localValues.options.map((option, index) => (
          <div
            key={index}
            className={`flex items-center gap-2 mt-2 p-2 rounded-md border-2 transition-colors ${localValues.answers.includes(index)
              ? "bg-green-100 border-green-500"
              : "bg-gray-200 border-gray-400"
              }`}
          >
            <button
              type="button"
              onClick={() => handleAnswerSelect(index)}
              className={`relative w-7 h-7 flex items-center justify-center rounded-md cursor-pointer transition-all ${localValues.answers.includes(index) ? "bg-green-500" : "bg-gray-400"
                }`}
            >
              <span className="group">
                {localValues.answers.includes(index) ? (
                  <Check className="text-white w-5 h-5" />
                ) : (
                  <X className="text-white w-5 h-5" />
                )}
                {/* Tooltip */}
                <span className="absolute left-1/2 transform -translate-x-1/2 bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black text-white text-xs rounded px-2 py-1 whitespace-nowrap">
                  {localValues.answers.includes(index) ? "Correct answer" : "Incorrect answer"}
                </span>
              </span>
            </button>

            {/* Editable option text */}
            {editingField === `option-${index}` ? (
              <Input
                className="flex-1"
                placeholder="Enter your answer option"
                value={localValues.options[index]}
                onChange={(e) => {
                  const newOptions = [...localValues.options];
                  newOptions[index] = e.target.value;
                  handleChange("options", newOptions);
                }}
                onBlur={stopEditing}
              />
            ) : (
              <span className="cursor-pointer text-gray-600 flex-1" onClick={() => startEditing(`option-${index}`)}>
                {option} <FaEdit className="inline-block ml-2 text-gray-500" />
              </span>
            )}

            {/* Remove option button */}
            <Button
              onClick={() => handleRemoveOption(index)}
              className="text-white bg-red-500 hover:bg-red-600 px-3 py-1 rounded-md"
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
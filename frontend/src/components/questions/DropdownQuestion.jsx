import { useState } from "react";
import { Input, Checkbox } from "antd";
import { FaEdit, FaCheck} from "react-icons/fa";
import ReactQuill from "react-quill";

const DropdownQuestion = ({ question, onChange }) => {
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
        <p className="font-semibold">Options:</p>
        {localValues.options.map((option, index) => (
          <div key={index} className="flex items-center gap-2">
            <Checkbox checked={question.answers.includes(index)} />
            {editingField === `option-${index}` ? (
              <Input
                value={localValues.options[index]}
                onChange={(e) => {
                  const newOptions = [...localValues.options];
                  newOptions[index] = e.target.value;
                  handleChange("options", newOptions);
                }}
                onBlur={stopEditing}
              />
            ) : (
              <span className="cursor-pointer text-gray-600" onClick={() => startEditing(`option-${index}`)}>
                {option} <FaEdit className="inline-block ml-2 text-gray-500" />
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default DropdownQuestion;
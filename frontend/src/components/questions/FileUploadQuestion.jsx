import { useState } from "react";
import { Input } from "antd";
import { FaEdit } from "react-icons/fa";

const FileUploadQuestion = ({ question, onChange }) => {
const [editingField, setEditingField] = useState(null);
  const [localValues, setLocalValues] = useState({ ...question });

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
        <p className="font-semibold">Description:</p>
        {editingField === "description" ? (
          <Input.TextArea
            value={localValues.description}
            onChange={(e) => handleChange("description", e.target.value)}
            onBlur={stopEditing}
            autoSize={{ minRows: 1, maxRows: 5 }}
            onPressEnter={stopEditing}
            allowClear={true}
          />
        ) : (
          <p className="cursor-pointer text-gray-600 cursor-text break-words w-full" onClick={() => startEditing("description")}>
            {question.description || "No description"} <FaEdit className="inline-block ml-2 text-gray-500" />
          </p>
        )}
      </div>
    </div>
  );
};

export default FileUploadQuestion;
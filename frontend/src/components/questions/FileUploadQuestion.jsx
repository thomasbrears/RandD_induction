import { useState, useEffect } from "react";
import { FaEdit, FaCheck, FaTimes } from "react-icons/fa";
import { Button } from "antd";
import ReactQuill from "react-quill";
import {MODULES, FORMATS} from "../../models/QuillConfig";

const FileUploadQuestion = ({ question, onChange, isExpanded }) => {
  const [editingField, setEditingField] = useState(null);
  const [localValues, setLocalValues] = useState({ ...question });

  useEffect(() => {
    if (!isExpanded && editingField) {
      stopEditing(editingField, localValues[editingField]);
      setEditingField(null);
    }
  }, [isExpanded, editingField]);

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
              >
                <FaCheck className="inline mr-2" /> Update
              </Button>
              {/* Cancel Button */}
              <Button
                onClick={() => handleCancel("description")}
                className="bg-red-500 text-white px-2 py-1 rounded-md text-sm flex items-center h-8"
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
    </div >
  );
};

export default FileUploadQuestion;
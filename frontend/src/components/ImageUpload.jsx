import React, { useRef} from "react";
import { messageWarning} from '../utils/notificationService';

const ImageUpload = ({  fileUrl, saveFileChange }) => {
    const fileInputRef = useRef(null);
    const maxSize = 10 * 1024 * 1024;

    const handleFile = (file) => {
        if (file.size > maxSize) {
            messageWarning("File size exceeds 10MB limit.");
            return;
        }
        saveFileChange(file);
        fileInputRef.current.value = null; 
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) handleFile(file);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        if (file) handleFile(file);
    };

    const handleDeleteImage = () => {
        saveFileChange(null);
        fileInputRef.current.value = null; 
    };

    const openFileDialog = () => fileInputRef.current?.click();

    return (
        <div className="mt-6">
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="sr-only"
            />

            {!fileUrl ? (
                <div
                    onClick={openFileDialog}
                    onDrop={handleDrop}
                    onDragOver={(e) => e.preventDefault()}
                    className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md cursor-pointer hover:border-gray-400 transition-colors"
                >
                    <div className="space-y-1 text-center">
                        <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                            <path
                                d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                                strokeWidth={2}
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
                        <div className="flex flex-col sm:flex-row text-sm text-gray-600 justify-center">
                            <span className="cursor-pointer text-gray-800 hover:text-gray-700">Upload a file</span>
                            <p className="pl-1 mt-1 sm:mt-0">or drag and drop</p>
                        </div>
                        <p className="text-xs text-gray-500">PNG, JPG, JPEG up to 10MB</p>
                    </div>
                </div>
            ) : (
                <div className="mt-4 flex flex-col items-center space-y-4">
                    <img
                        src={fileUrl}
                        alt="Uploaded"
                        className="max-w-full max-h-64 object-contain border border-gray-300 rounded-md"
                    />
                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={openFileDialog}
                            className="inline-flex items-center px-4 py-2 bg-gray-800 text-white text-sm font-medium rounded-md hover:bg-gray-900"
                        >
                            Change Image
                        </button>
                        <button
                            type="button"
                            onClick={handleDeleteImage}
                            className="inline-flex items-center px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700"
                        >
                            Delete Image
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ImageUpload;
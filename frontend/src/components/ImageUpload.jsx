import React, { useRef, useState, useEffect } from "react";
import { getSignedUrl, uploadFile, deleteFile } from "../api/FileApi";
import { messageWarning, notifySuccess } from '../utils/notificationService';
import useAuth from "../hooks/useAuth";

const ImageUpload = ({ questionData, saveFileChange }) => {
    const { user, loading: authLoading } = useAuth();
    const [loading, setLoading] = useState(false);
    const [fileUrl, setFileUrl] = useState(null);
    const [fileName, setFileName] = useState(null);
    const fileInputRef = useRef(null);

    useEffect(() => {
        saveFileChange(fileName);
    }, [fileName]);

    useEffect(() => {
        setFileName(null);
        setFileUrl(null);
        if (questionData && questionData.imageFile) {
            setFileName(questionData.imageFile);

            if (!authLoading) {
                const fetchImage = async () => {
                    try {
                        const result = await getSignedUrl(user, fileName);
                        setFileUrl(result.url);
                    } catch (err) {
                        messageWarning(err.response?.data?.message || "An error occurred");
                    }
                };
                fetchImage();
            }
        }
    }, [questionData]);

    const handleUpload = async (file) => {
        try {
            setLoading(true);
            if (fileName) await deleteFile(user, fileName); // delete old if exists
            const response = await uploadFile(user, file);
            setFileUrl(response.url);
            setFileName(response.gcsFileName);
        } catch (err) {
            messageWarning("Upload failed:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
          const maxSize = 10 * 1024 * 1024; // 10MB in bytes
          if (file.size > maxSize) {
            messageWarning("File size exceeds 10MB limit.");
            return;
          }
          handleUpload(file);
        }
      };

    const handleDrop = (e) => {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        if (file) {
          const maxSize = 10 * 1024 * 1024;
          if (file.size > maxSize) {
            messageWarning("File size exceeds 10MB limit.");
            return;
          }
          handleUpload(file);
        }
      };

    const handleDeleteImage = async () => {
        try {
            setLoading(true);
            await deleteFile(user, fileName);
            setFileUrl(null);
            setFileName(null);
        } catch (err) {
            messageWarning("Delete failed:", err);
        } finally {
            setLoading(false);
        }
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
                        <svg
                            className="mx-auto h-12 w-12 text-gray-400"
                            stroke="currentColor"
                            fill="none"
                            viewBox="0 0 48 48"
                            aria-hidden="true"
                        >
                            <path
                                d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                                strokeWidth={2}
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
                        <div className="flex flex-col sm:flex-row text-sm text-gray-600 justify-center">
                            <label
                                className="relative cursor-pointer bg-white rounded-md font-medium text-gray-800 hover:text-gray-700 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-gray-500"
                            >
                                <span>Upload a file</span>
                            </label>
                            <p className="pl-1 mt-1 sm:mt-0">or drag and drop</p>
                        </div>
                        <p className="text-xs text-gray-500">PNG, JPG, JPEG up to 10MB</p>
                        {loading && <p className="text-sm text-gray-400 mt-2">Uploading...</p>}
                    </div>
                </div>
            ) : (
                <>
                    {fileUrl && !loading && (
                        <div className="mt-4 flex flex-col items-center space-y-4">
                            <img
                                src={fileUrl}
                                alt="Uploaded"
                                className="max-w-full max-h-64 object-contain border border-gray-300 rounded-md"
                            />

                            <div className="flex gap-3">
                                {/* Change Image Button */}
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (fileInputRef.current) {
                                            fileInputRef.current.click();
                                        }
                                    }}
                                    className="inline-flex items-center px-4 py-2 bg-gray-800 text-white text-sm font-medium rounded-md hover:bg-gray-900"
                                >
                                    Change Image
                                </button>

                                {/* Delete Image Button */}
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
                </>
            )}
        </div>
    );
};

export default ImageUpload;
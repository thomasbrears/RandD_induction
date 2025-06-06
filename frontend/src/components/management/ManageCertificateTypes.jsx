import React, { useState, useEffect } from "react";
import { FaEdit, FaTrashAlt } from 'react-icons/fa';
import { Button, Popconfirm, Skeleton } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { notifySuccess, notifyError, messageWarning } from "../../utils/notificationService";
import { 
  getAllCertificateTypes, 
  addCertificateType, 
  updateCertificateType, 
  deleteCertificateType 
} from "../../api/CertificateTypeApi";

const ManageCertificateTypes = () => {
  const [newCertificateTypeName, setNewCertificateTypeName] = useState(""); 
  const [certificateTypeName, setCertificateTypeName] = useState("");
  const [certificateTypes, setCertificateTypes] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState("");
  const [filteredCertificateTypes, setFilteredCertificateTypes] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Fetch certificate types
  useEffect(() => {
    const fetchCertificateTypes = async () => {
      try {
        const certificateTypesList = await getAllCertificateTypes();
        setCertificateTypes(certificateTypesList);
        setFilteredCertificateTypes(certificateTypesList);
      } catch (error) {
        console.error("Error fetching certificate types:", error);
        notifyError("Failed to fetch certificate types", error.message);
      } finally {
        setIsLoading(false); 
      }
    };

    fetchCertificateTypes();
  }, []);

  // Update filtered certificate types immediately after any change
  useEffect(() => {
    setFilteredCertificateTypes(certificateTypes.filter((type) =>
      type.name.toLowerCase().includes(searchQuery.toLowerCase())
    ));
  }, [certificateTypes, searchQuery]);

  // Handle certificate type name change for adding new certificate type
  const handleNewNameChange = (e) => {
    setNewCertificateTypeName(e.target.value);
  };

  // Handle certificate type name change for editing
  const handleEditNameChange = (e) => {
    setCertificateTypeName(e.target.value);
  };

  // Submit new certificate type
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newCertificateTypeName.trim()) {
      messageWarning("Please enter a certificate type name");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await addCertificateType(newCertificateTypeName);

      notifySuccess("Certificate type added successfully", `"${newCertificateTypeName}" has been added to your certificate types list.`);
      setNewCertificateTypeName("");
      
      // Update the certificate type list
      setCertificateTypes((prevTypes) => [
        ...prevTypes,
        { id: response.id, name: newCertificateTypeName },
      ]);
    } catch (error) {
      notifyError("Failed to add certificate type", error.response?.data?.message || error.message);
      console.error("Error adding certificate type:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Start editing certificate type
  const handleEdit = (id, currentName) => {
    setEditingId(id);
    setCertificateTypeName(currentName);
    setIsEditing(true);
  };

  // Update certificate type name
  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!certificateTypeName.trim()) {
      messageWarning("Please enter a certificate type name");
      return;
    }

    setIsSubmitting(true);

    try {
      await updateCertificateType(editingId, certificateTypeName);

      notifySuccess("Certificate type updated", `Certificate type has been renamed to "${certificateTypeName}"`);
      setCertificateTypeName("");
      setIsEditing(false);

      // Update the certificate type list with the new name
      setCertificateTypes((prevTypes) =>
        prevTypes.map((type) =>
          type.id === editingId
            ? { ...type, name: certificateTypeName }
            : type
        )
      );
    } catch (error) {
      notifyError("Failed to update certificate type", error.response?.data?.message || error.message);
      console.error("Error updating certificate type:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete certificate type
  const handleDelete = async (id) => {
    try {
      await deleteCertificateType(id);

      // Find the name of the deleted certificate type for the notification
      const deletedType = certificateTypes.find(type => type.id === id);
      notifySuccess(
        "Certificate type deleted", 
        deletedType ? `"${deletedType.name}" has been removed` : ""
      );

      // Remove the deleted certificate type from the state
      setCertificateTypes((prevTypes) =>
        prevTypes.filter((type) => type.id !== id)
      );
    } catch (error) {
      notifyError("Failed to delete certificate type", error.response?.data?.message || error.message);
      console.error("Error deleting certificate type:", error);
    }
  };

  // Handle search query change
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  return (
    <div className="flex justify-center items-center mt-2 px-4 sm:px-6 md:px-0">
      <div className="w-full max-w-2xl p-6 bg-white shadow-lg rounded-lg">
        <h2 className="text-xl font-semibold mb-4 text-center">Manage Certificate Types</h2>

        {/* Add a New Certificate Type Section */}
        <div className="mb-6 p-4 bg-gray-100 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Add a New Certificate Type</h2>
          <div className="flex flex-col sm:flex-row sm:space-x-2 space-y-2 sm:space-y-0">
            <input
              type="text"
              value={newCertificateTypeName}
              onChange={handleNewNameChange}
              className="border border-gray-300 rounded-md px-3 py-1 w-full sm:flex-1"
              placeholder="Enter certificate type name"
              maxLength={50}
            />
            <Button
              type="primary"
              onClick={handleSubmit}
              loading={isSubmitting}
              icon={<PlusOutlined />}
              className="w-full sm:w-auto mt-2 sm:mt-0"
            >
              {isSubmitting ? "Adding..." : "Add Certificate Type"}
            </Button>
          </div>
        </div>

        {/* Certificate Types List */}
        <div className="p-4 bg-gray-100 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Current Certificate Types</h2>
          {/* Search field */}
          <div className="mb-4">
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Search certificate types..."
              className="border border-gray-300 rounded-md px-3 py-1 w-full"
            />
          </div>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, index) => (
                <Skeleton key={index} active />
              ))}
            </div>
          ) : filteredCertificateTypes.length === 0 ? (
            <p className="text-gray-500">No certificate types found.</p>
          ) : (
            <ul className="space-y-3">
              {filteredCertificateTypes.map((type) => (
                <li key={type.id} className="bg-white p-3 rounded-lg shadow">
                  {isEditing && editingId === type.id ? (
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                      <input
                        type="text"
                        value={certificateTypeName}
                        onChange={handleEditNameChange}
                        className="border border-gray-300 rounded-md px-3 py-1 w-full md:flex-1"
                        maxLength={50}
                      />
                      <div className="flex mt-3 md:mt-0 md:ml-4 space-x-2">
                        <Button
                          className="px-3 py-1 rounded-md text-xs sm:text-sm"
                          type="primary"
                          onClick={handleUpdate}
                          loading={isSubmitting}
                        >
                          {isSubmitting ? "Saving..." : "Save"}
                        </Button>
                        <Button
                          className="px-3 py-1 rounded-md text-xs sm:text-sm"
                          type="default"
                          onClick={() => setIsEditing(false)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                      <span className="mb-3 md:mb-0">{type.name}</span>
                      <div className="flex space-x-2">
                        <Button
                          className="px-3 py-1 rounded-md text-xs sm:text-sm"                     
                          type="primary"
                          onClick={() => handleEdit(type.id, type.name)}
                        >
                          <FaEdit className="inline-block mr-1" /> Edit
                        </Button>
                        <Popconfirm
                          title="Are you sure you want to delete this certificate type?"
                          onConfirm={() => handleDelete(type.id)}
                          okText="Yes, Delete"
                          cancelText="No, Cancel"
                        >
                          <button className="bg-red-600 hover:bg-red-800 text-white px-3 py-1 rounded-md text-xs sm:text-sm">
                            <FaTrashAlt className="inline-block mr-1" /> Delete
                          </button>
                        </Popconfirm>
                      </div>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default ManageCertificateTypes;
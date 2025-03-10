import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { db } from "../../firebaseConfig";
import { collection, getDocs, doc, setDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { FaEdit, FaTrashAlt } from 'react-icons/fa';
import { Button, Popconfirm, Skeleton } from 'antd';
import { PlusOutlined } from '@ant-design/icons';

const ManageDepartments = () => {
  const [newDepartmentName, setNewDepartmentName] = useState(""); 
  const [newDepartmentEmail, setNewDepartmentEmail] = useState(""); // New state for email
  const [departmentName, setDepartmentName] = useState("");
  const [departmentEmail, setDepartmentEmail] = useState(""); // New state for email in edit mode
  const [departments, setDepartments] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState("");
  const [filteredDepartments, setFilteredDepartments] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddingNew, setIsAddingNew] = useState(false); 
  const [isLoading, setIsLoading] = useState(true);

  // Fetch departments from Firestore
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const snapshot = await getDocs(collection(db, "departments"));
        const departmentsList = snapshot.docs.map((doc) => ({
          id: doc.id,
          name: doc.data().name,
          email: doc.data().email || "" // Include email field and default to empty string if not present
        }));
        setDepartments(departmentsList);
        setFilteredDepartments(departmentsList);
      } catch (error) {
        console.error("Error fetching departments:", error);
        toast.error("Failed to fetch departments.");
      } finally {
        setIsLoading(false); 
      }
    };

    fetchDepartments();
  }, []);

  // Update filtered departments immediately after any change
  useEffect(() => {
    setFilteredDepartments(departments.filter((dep) =>
      dep.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (dep.email && dep.email.toLowerCase().includes(searchQuery.toLowerCase()))
    ));
  }, [departments, searchQuery]);

  // Handle department name change for adding new department
  const handleNewNameChange = (e) => {
    setNewDepartmentName(e.target.value);
  };

  // Handle department email change for adding new department
  const handleNewEmailChange = (e) => {
    setNewDepartmentEmail(e.target.value);
  };

  // Handle department name change for editing
  const handleEditNameChange = (e) => {
    setDepartmentName(e.target.value);
  };

  // Handle department email change for editing
  const handleEditEmailChange = (e) => {
    setDepartmentEmail(e.target.value);
  };

  // Submit new department to Firestore
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newDepartmentName.trim()) {
      toast.warn("Please enter a department name.");
      return;
    }

    if (!newDepartmentEmail.trim()) {
      toast.warn("Please enter a department email.");
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newDepartmentEmail)) {
      toast.warn("Please enter a valid email address.");
      return;
    }

    setIsSubmitting(true);

    try {
      const departmentRef = doc(db, "departments", newDepartmentName);
      await setDoc(departmentRef, {
        name: newDepartmentName,
        email: newDepartmentEmail, // Add email to the document
      });

      toast.success("Department added successfully!");
      
      // Clear input fields after successful submission
      setNewDepartmentName("");
      setNewDepartmentEmail("");

      // Update the department list without fetching from Firestore
      setDepartments((prevDepartments) => [
        ...prevDepartments,
        { id: newDepartmentName, name: newDepartmentName, email: newDepartmentEmail },
      ]);
      setIsAddingNew(false); // Close input field after submission
    } catch (error) {
      toast.error("Failed to add department.");
      console.error("Error adding department:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Start editing department
  const handleEdit = (id, currentName, currentEmail) => {
    setEditingId(id);
    setDepartmentName(currentName);
    setDepartmentEmail(currentEmail || ""); // Set email for editing, default to empty string if null
    setIsEditing(true);
  };

  // Update department in Firestore
  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!departmentName.trim()) {
      toast.warn("Please enter a department name.");
      return;
    }

    if (!departmentEmail.trim()) {
      toast.warn("Please enter a department email.");
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(departmentEmail)) {
      toast.warn("Please enter a valid email address.");
      return;
    }

    setIsSubmitting(true);

    try {
      const departmentRef = doc(db, "departments", editingId);
      await updateDoc(departmentRef, {
        name: departmentName,
        email: departmentEmail, // Update email as well
      });

      toast.success("Department updated successfully!");
      
      // Clear input fields after successful update
      setDepartmentName("");
      setDepartmentEmail("");
      setIsEditing(false); // Switch back to add mode

      // Update the department list with the new name and email
      setDepartments((prevDepartments) =>
        prevDepartments.map((department) =>
          department.id === editingId
            ? { ...department, name: departmentName, email: departmentEmail }
            : department
        )
      );
    } catch (error) {
      toast.error("Failed to update department.");
      console.error("Error updating department:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete department
  const handleDelete = async (id) => {
    try {
      const departmentRef = doc(db, "departments", id);
      await deleteDoc(departmentRef);

      toast.success("Department deleted successfully!");

      // Remove the deleted department from the state
      setDepartments((prevDepartments) =>
        prevDepartments.filter((department) => department.id !== id)
      );
    } catch (error) {
      toast.error("Failed to delete department.");
      console.error("Error deleting department:", error);
    }
  };

  // Handle search query change
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  return (
    <div className="flex justify-center items-center mt-2 px-4 sm:px-6 md:px-0">
      <div className="w-full max-w-2xl p-6 bg-white shadow-lg rounded-lg">
        <h2 className="text-xl font-semibold mb-4 text-center">Manage Departments</h2>

        {/* Add a New Department Section */}
        <div className="mb-6 p-4 bg-gray-100 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Add a New Department</h2>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <input
                type="text"
                value={newDepartmentName}
                onChange={handleNewNameChange}
                className="border border-gray-300 rounded-md px-3 py-1 w-full"
                placeholder="Enter department name"
              />
            </div>
            <div>
              <input
                type="email"
                value={newDepartmentEmail}
                onChange={handleNewEmailChange}
                className="border border-gray-300 rounded-md px-3 py-1 w-full"
                placeholder="Enter department email"
              />
            </div>
            <div className="flex justify-left">
              <Button
                type="primary"
                htmlType="submit"
                loading={isSubmitting}
                icon={<PlusOutlined />}
                className="w-full sm:w-auto"
              >
                {isSubmitting ? "Adding..." : "Add Department"}
              </Button>
            </div>
          </form>
        </div>

        {/* Departments List */}
        <div className="p-4 bg-gray-100 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Current Departments</h2>
          {/* Search field */}
          <div className="mb-4">
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Search departments..."
              className="border border-gray-300 rounded-md px-3 py-1 w-full"
            />
          </div>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(2)].map((_, index) => (
                <Skeleton key={index} active />
              ))}
            </div>
          ) : filteredDepartments.length === 0 ? (
            <p className="text-gray-500">No departments found.</p>
          ) : (
            <ul className="space-y-3">
              {filteredDepartments.map((dep) => (
                <li key={dep.id} className="bg-white p-3 rounded-lg shadow">
                  {isEditing && editingId === dep.id ? (
                    <div className="flex flex-col space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Department Name</label>
                        <input
                          type="text"
                          value={departmentName}
                          onChange={handleEditNameChange}
                          className="border border-gray-300 rounded-md px-3 py-1 w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Department Email</label>
                        <input
                          type="email"
                          value={departmentEmail}
                          onChange={handleEditEmailChange}
                          className="border border-gray-300 rounded-md px-3 py-1 w-full"
                        />
                      </div>
                      <div className="flex justify-end space-x-2">
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
                    <div className="flex justify-between items-center">
                      <div className="flex flex-col mb-2">
                        <span className="font-medium">{dep.name}</span>
                        <span className="text-sm text-gray-500">{dep.email || "No email set"}</span>
                      </div>
                      <div className="flex justify-end space-x-2">
                        <Button
                          className="px-3 py-1 rounded-md text-xs sm:text-sm"                     
                          type="primary"
                          onClick={() => handleEdit(dep.id, dep.name, dep.email)}
                        >
                          <FaEdit className="inline-block mr-1" /> Edit
                        </Button>
                        <Popconfirm
                          title="Are you sure you want to delete this department?"
                          onConfirm={() => handleDelete(dep.id)}
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

export default ManageDepartments;
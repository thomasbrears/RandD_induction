import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { db } from "../../firebaseConfig";
import { collection, getDocs, doc, setDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { FaEdit, FaTrashAlt } from 'react-icons/fa';
import { Button, Popconfirm } from 'antd';
import { PlusOutlined } from '@ant-design/icons';

const ManageDepartments = () => {
  const [newDepartmentName, setNewDepartmentName] = useState(""); 
  const [departmentName, setDepartmentName] = useState("");
  const [departments, setDepartments] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState("");
  const [filteredDepartments, setFilteredDepartments] = useState([]); // New state for filtered departments
  const [searchQuery, setSearchQuery] = useState("");
  const [setIsAddingNew] = useState(false); 

  // Fetch departments from Firestore
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const snapshot = await getDocs(collection(db, "departments"));
        const departmentsList = snapshot.docs.map((doc) => ({
          id: doc.id,
          name: doc.data().name,
        }));
        setDepartments(departmentsList);
        setFilteredDepartments(departmentsList); // Set filtered departments to the full list initially
      } catch (error) {
        console.error("Error fetching departments:", error);
        toast.error("Failed to fetch departments.");
      }
    };

    fetchDepartments();
  }, []);

  // Update filtered departments immediately after any change
  useEffect(() => {
    setFilteredDepartments(departments.filter((dep) =>
      dep.name.toLowerCase().includes(searchQuery.toLowerCase())
    ));
  }, [departments, searchQuery]);

  // Handle department name change for adding new department
  const handleNewNameChange = (e) => {
    setNewDepartmentName(e.target.value);
  };

  // Handle department name change for editing
  const handleEditNameChange = (e) => {
    setDepartmentName(e.target.value);
  };

  // Submit new department to Firestore
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newDepartmentName.trim()) {
      toast.warn("Please enter a department name.");
      return;
    }

    setIsSubmitting(true);

    try {
      const departmentRef = doc(db, "departments", newDepartmentName);
      await setDoc(departmentRef, {
        name: newDepartmentName,
      });

      toast.success("Department added successfully!");
      setNewDepartmentName(""); // Clear input field after successful submission

      // Update the department list without fetching from Firestore
      setDepartments((prevDepartments) => [
        ...prevDepartments,
        { id: newDepartmentName, name: newDepartmentName },
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
  const handleEdit = (id, currentName) => {
    setEditingId(id);
    setDepartmentName(currentName); // Set the department name for editing
    setIsEditing(true);
  };

  // Update department name in Firestore
  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!departmentName.trim()) {
      toast.warn("Please enter a department name.");
      return;
    }

    setIsSubmitting(true);

    try {
      const departmentRef = doc(db, "departments", editingId);
      await updateDoc(departmentRef, {
        name: departmentName,
      });

      toast.success("Department updated successfully!");
      setDepartmentName(""); // Clear input field after successful update
      setIsEditing(false); // Switch back to add mode

      // Update the department list with the new name
      setDepartments((prevDepartments) =>
        prevDepartments.map((department) =>
          department.id === editingId
            ? { ...department, name: departmentName }
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
      const departmentRef = doc(db, "departments", id);  // Use the id passed in directly
      await deleteDoc(departmentRef);  // Delete from Firestore

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
    const filtered = departments.filter((dep) =>
      dep.name.toLowerCase().includes(e.target.value.toLowerCase())
    );
    setFilteredDepartments(filtered); // Update filtered departments based on search
  };

  return (
    <div className="flex justify-center items-center mt-2">
      <div className="w-full max-w-2xl p-6 bg-white shadow-lg rounded-lg">
        <h2 className="text-xl font-semibold mb-4 text-center">Manage Departments</h2>

        {/* Add a New Department Section */}
        <div className="mb-6 p-4 bg-gray-100 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Add a New Department</h2>
          <div className="flex space-x-2">
            <input
              type="text"
              value={newDepartmentName}
              onChange={handleNewNameChange}
              className="border border-gray-300 rounded-md px-3 py-1 flex-1"
              placeholder="Enter department name"
            />
            <Button 
              type="primary" 
              onClick={handleSubmit} 
              loading={isSubmitting}
              icon={<PlusOutlined />}
            >
              {isSubmitting ? "Adding..." : "Add Department"}
            </Button>
          </div>
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
          {filteredDepartments.length === 0 ? (
            <p className="text-gray-500">No departments found.</p>
          ) : (
            <ul className="space-y-3">
              {filteredDepartments.map((dep) => (
                <li key={dep.id} className="flex items-center justify-between bg-white p-3 rounded-lg shadow">
                  {isEditing && editingId === dep.id ? (
                    <>
                      <input
                        type="text"
                        value={departmentName}
                        onChange={(e) => setDepartmentName(e.target.value)}
                        className="border border-gray-300 rounded-md px-3 py-1 flex-1"
                      />
                      <Button
                        type="primary"
                        onClick={handleUpdate}
                        loading={isSubmitting}
                        className="ml-4"
                      >
                        {isSubmitting ? "Saving..." : "Save"}
                      </Button>
                      <Button
                        type="default"
                        onClick={() => setIsEditing(false)}
                        className="ml-4"
                      >
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <>
                      <span>{dep.name}</span>
                      <div className="flex space-x-2">
                        <Button
                          type="primary"
                          onClick={() => { setEditingId(dep.id); setDepartmentName(dep.name); setIsEditing(true); }}
                        >
                          <FaEdit className="inline-block mr-2" /> Edit
                        </Button>
                        <Popconfirm
                          title="Are you sure you want to delete this department?"
                          onConfirm={() => handleDelete(dep.id)}
                          okText="Yes, Delete"
                          cancelText="No, Cancel"
                        >
                          <button className="bg-red-600 text-white px-3 py-1 rounded-md">
                            <FaTrashAlt className="inline-block mr-2" /> Delete
                          </button>
                        </Popconfirm>
                      </div>
                    </>
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
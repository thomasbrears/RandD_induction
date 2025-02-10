import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { db } from "../../firebaseConfig";
import { collection, getDocs, doc, setDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { FaEdit, FaTrashAlt, FaPlusCircle } from 'react-icons/fa';
import ConfirmationModal from "../ConfirmationModal";

const ManageDepartments = () => {
  const [newDepartmentName, setNewDepartmentName] = useState(""); 
  const [departmentName, setDepartmentName] = useState("");
  const [departments, setDepartments] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [departmentToDelete, setDepartmentToDelete] = useState(null);
  const [isAddingNew, setIsAddingNew] = useState(false); 

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
      } catch (error) {
        console.error("Error fetching departments:", error);
        toast.error("Failed to fetch departments.");
      }
    };

    fetchDepartments();
  }, []);

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

  // Delete department from Firestore
  const handleDelete = (id) => {
    setDepartmentToDelete(id);
    setIsModalOpen(true);
  };

  const confirmDelete = async () => {
    try {
      const departmentRef = doc(db, "departments", departmentToDelete);
      await deleteDoc(departmentRef);

      toast.success("Department deleted successfully!");

      // Remove deleted department from the state
      setDepartments((prevDepartments) =>
        prevDepartments.filter((department) => department.id !== departmentToDelete)
      );
      setIsModalOpen(false);
    } catch (error) {
      toast.error("Failed to delete department.");
      console.error("Error deleting department:", error);
      setIsModalOpen(false);
    }
  };

  const cancelDelete = () => {
    setIsModalOpen(false);
  };

  return (
    <div className="grid grid-cols-1 gap-6 mb-6">        
      {/* Add New Department Section */}
      <div className="p-6">
        <h2 className="text-xl font-semibold mb-2">Manage Departments</h2>
        <p className="text-gray-600"> Create, Edit and Delete departments here. </p>
                
        <h2 className="text-lg font-semibold mt-6 mb-2">Add a New Department</h2>
        
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={newDepartmentName} // Use newDepartmentName for adding new department
              onChange={handleNewNameChange}
              className="border border-gray-300 rounded-md px-3 py-1"
              placeholder="Enter department name"
            />
            <button
              onClick={handleSubmit}
              className="bg-blue-600 text-white px-4 py-1 rounded-md text-sm"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Adding..." : "Add Department"}
            </button>
            
          </div>
        
        {/* Faint line under Add New Department */}
        <div className="border-t border-gray-300 mt-4 pt-4">
            <h2 className="text-lg font-semibold mb-2">Current Departments</h2>
        </div>

        {/* Display message if no departments */}
        {departments.length === 0 ? (
        <p className="text-gray-500">No current departmetns.</p>
        ) : (
            // List of existing departments 
            <ul className="space-y-2 mt-4">
            {departments.map((department) => (
                <li key={department.id} className="flex items-center space-x-4 border-b text-bold border-gray-200 py-2">
                {isEditing && editingId === department.id ? (
                    <>
                    <input
                        type="text"
                        value={departmentName} // Use departmentName for editing
                        onChange={handleEditNameChange}
                        className="border border-gray-300 rounded-md px-3 py-1"
                    />
                    <button
                        onClick={handleUpdate}
                        className="bg-blue-600 text-white px-3 py-1 rounded-md text-sm"
                    >
                        Save
                    </button>
                    <button
                        onClick={() => {
                        setIsEditing(false); // Reset editing mode
                        setDepartmentName(""); // Clear the edit field
                        }}
                        className="bg-black text-white px-3 py-1 rounded-md text-sm"
                    >
                        Cancel
                    </button>
                    </>
                ) : (
                    <>
                    <span>{department.name}</span>
                    <div className="flex space-x-2">
                        <button
                        onClick={() => handleEdit(department.id, department.name)}
                        className="bg-blue-600 text-white px-3 py-1 rounded-md text-sm flex items-center space-x-1"
                        >
                        <FaEdit className="text-xs" />
                        <span className="text-xs">Edit</span>
                        </button>
                        <button
                        onClick={() => handleDelete(department.id)}
                        className="bg-red-600 text-white px-3 py-1 rounded-md text-sm flex items-center space-x-1"
                        >
                        <FaTrashAlt className="text-xs" />
                        <span className="text-xs">Delete</span>
                        </button>
                    </div>
                    </>
                )}
                </li>
            ))}
            </ul>
        )}
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={isModalOpen}
        message="Are you sure you want to delete this department?"
        subtext="This action cannot be undone."
        onCancel={cancelDelete}
        onConfirm={confirmDelete}
        confirmLabel="Delete"
        cancelLabel="Cancel"
      />
    </div>
  );
};

export default ManageDepartments;

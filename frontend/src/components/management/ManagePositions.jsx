import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { db } from "../../firebaseConfig";
import { collection, getDocs, doc, setDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { FaEdit, FaTrashAlt, FaPlusCircle } from 'react-icons/fa';
import ConfirmationModal from "../ConfirmationModal";

const ManagePositions = () => {
  const [newPositionName, setNewPositionName] = useState(""); 
  const [positionName, setPositionName] = useState("");
  const [positions, setPositions] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [positionToDelete, setPositionToDelete] = useState(null);
  const [isAddingNew, setIsAddingNew] = useState(false); 

  // Fetch positions from Firestore
  useEffect(() => {
    const fetchPositions = async () => {
      try {
        const snapshot = await getDocs(collection(db, "positions"));
        const positionsList = snapshot.docs.map((doc) => ({
          id: doc.id,
          name: doc.data().name,
        }));
        setPositions(positionsList);
      } catch (error) {
        console.error("Error fetching positions:", error);
        toast.error("Failed to fetch positions.");
      }
    };

    fetchPositions();
  }, []);

  // Handle position name change for adding new position
  const handleNewNameChange = (e) => {
    setNewPositionName(e.target.value);
  };

  // Handle position name change for editing
  const handleEditNameChange = (e) => {
    setPositionName(e.target.value);
  };

  // Submit new position to Firestore
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newPositionName.trim()) {
      toast.warn("Please enter a position name.");
      return;
    }

    setIsSubmitting(true);

    try {
      const positionRef = doc(db, "positions", newPositionName);
      await setDoc(positionRef, {
        name: newPositionName,
      });

      toast.success("Position added successfully!");
      setNewPositionName(""); // Clear input field after successful submission

      // Update the position list without fetching from Firestore
      setPositions((prevPositions) => [
        ...prevPositions,
        { id: newPositionName, name: newPositionName },
      ]);
      setIsAddingNew(false); // Close input field after submission
    } catch (error) {
      toast.error("Failed to add position.");
      console.error("Error adding position:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Start editing position
  const handleEdit = (id, currentName) => {
    setEditingId(id);
    setPositionName(currentName); // Set the position name for editing
    setIsEditing(true);
  };

  // Update position name in Firestore
  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!positionName.trim()) {
      toast.warn("Please enter a position name.");
      return;
    }

    setIsSubmitting(true);

    try {
      const positionRef = doc(db, "positions", editingId);
      await updateDoc(positionRef, {
        name: positionName,
      });

      toast.success("Position updated successfully!");
      setPositionName(""); // Clear input field after successful update
      setIsEditing(false); // Switch back to add mode

      // Update the position list with the new name
      setPositions((prevPositions) =>
        prevPositions.map((position) =>
          position.id === editingId
            ? { ...position, name: positionName }
            : position
        )
      );
    } catch (error) {
      toast.error("Failed to update position.");
      console.error("Error updating position:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete position from Firestore
  const handleDelete = (id) => {
    setPositionToDelete(id);
    setIsModalOpen(true);
  };

  const confirmDelete = async () => {
    try {
      const positionRef = doc(db, "positions", positionToDelete);
      await deleteDoc(positionRef);

      toast.success("Position deleted successfully!");

      // Remove deleted position from the state
      setPositions((prevPositions) =>
        prevPositions.filter((position) => position.id !== positionToDelete)
      );
      setIsModalOpen(false);
    } catch (error) {
      toast.error("Failed to delete position.");
      console.error("Error deleting position:", error);
      setIsModalOpen(false);
    }
  };

  const cancelDelete = () => {
    setIsModalOpen(false);
  };

  return (
    <div className="grid grid-cols-1 gap-6 mb-6">        
      {/* Add New Position Section */}
      <div className="p-6">
        <h2 className="text-xl font-semibold mb-2">Manage Positions</h2>
        <p className="text-gray-600"> Create, Edit and Delete positions here. </p>
                
        <h2 className="text-lg font-semibold mt-6 mb-2">Add a New Position</h2>
        
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={newPositionName} // Use newPositionName for adding new position
            onChange={handleNewNameChange}
            className="border border-gray-300 rounded-md px-3 py-1"
            placeholder="Enter position name"
          />
          <button
            onClick={handleSubmit}
            className="bg-blue-600 text-white px-4 py-1 rounded-md text-sm"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Adding..." : "Add Position"}
          </button>
        </div>
        
        {/* Faint line under Add New Position */}
        <div className="border-t border-gray-300 mt-4 pt-4">
            <h2 className="text-lg font-semibold mb-2">Current Positions</h2>
        </div>

        {/* Display message if no positions */}
        {positions.length === 0 ? (
          <p className="text-gray-500">No current positions.</p>
        ) : (
          // List of existing positions
          <ul className="space-y-2 mt-4">
            {positions.map((position) => (
              <li key={position.id} className="flex items-center space-x-4 border-b text-bold border-gray-200 py-2">
                {isEditing && editingId === position.id ? (
                  <>
                    <input
                      type="text"
                      value={positionName} // Use positionName for editing
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
                        setPositionName(""); // Clear the edit field
                      }}
                      className="bg-black text-white px-3 py-1 rounded-md text-sm"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <span>{position.name}</span>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEdit(position.id, position.name)}
                        className="bg-blue-600 text-white px-3 py-1 rounded-md text-sm flex items-center space-x-1"
                      >
                        <FaEdit className="text-xs" />
                        <span className="text-xs">Edit</span>
                      </button>
                      <button
                        onClick={() => handleDelete(position.id)}
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
        message="Are you sure you want to delete this position?"
        subtext="This action cannot be undone."
        onCancel={cancelDelete}
        onConfirm={confirmDelete}
        confirmLabel="Delete"
        cancelLabel="Cancel"
      />
    </div>
  );
};

export default ManagePositions;

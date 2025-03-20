import React, { useState, useEffect } from "react";
import { db } from "../../firebaseConfig";
import { collection, getDocs, doc, setDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { FaEdit, FaTrashAlt } from 'react-icons/fa';
import { Button, Popconfirm, Skeleton } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { notifySuccess, notifyError, messageWarning } from "../../utils/notificationService";

const ManagePositions = () => {
  const [newPositionName, setNewPositionName] = useState(""); 
  const [positionName, setPositionName] = useState("");
  const [positions, setPositions] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState("");
  const [filteredPositions, setFilteredPositions] = useState([]); // New state for filtered positions
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddingNew, setIsAddingNew] = useState(false); 
  const [isLoading, setIsLoading] = useState(true);

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
        setFilteredPositions(positionsList); // Set filtered positions to the full list initially
      } catch (error) {
        console.error("Error fetching positions:", error);
        notifyError("Failed to fetch positions");
      } finally {
        setIsLoading(false); 
      }
    };

    fetchPositions();
  }, []);

  // Update filtered positions immediately after any change
  useEffect(() => {
    setFilteredPositions(positions.filter((dep) =>
      dep.name.toLowerCase().includes(searchQuery.toLowerCase())
    ));
  }, [positions, searchQuery]);

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
      messageWarning("Please enter a position name");
      return;
    }

    setIsSubmitting(true);

    try {
      const positionRef = doc(db, "positions", newPositionName);
      await setDoc(positionRef, {
        name: newPositionName,
      });

      notifySuccess("Position added successfully");
      setNewPositionName(""); // Clear input field after successful submission

      // Update the position list without fetching from Firestore
      setPositions((prevPositions) => [
        ...prevPositions,
        { id: newPositionName, name: newPositionName },
      ]);
      setIsAddingNew(false); // Close input field after submission
    } catch (error) {
      notifyError("Failed to add position", error.message);
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
      messageWarning("Please enter a position name");
      return;
    }

    setIsSubmitting(true);

    try {
      const positionRef = doc(db, "positions", editingId);
      await updateDoc(positionRef, {
        name: positionName,
      });

      notifySuccess("Position updated successfully");
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
      notifyError("Failed to update position", error.message);
      console.error("Error updating position:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete position
  const handleDelete = async (id) => {
    try {
      const positionRef = doc(db, "positions", id);  // Use the id passed in directly
      await deleteDoc(positionRef);  // Delete from Firestore

      notifySuccess("Position deleted successfully");

      // Remove the deleted position from the state
      setPositions((prevPositions) =>
        prevPositions.filter((position) => position.id !== id)
      );
    } catch (error) {
      notifyError("Failed to delete position", error.message);
      console.error("Error deleting position:", error);
    }
  };

  // Handle search query change
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    const filtered = positions.filter((dep) =>
      dep.name.toLowerCase().includes(e.target.value.toLowerCase())
    );
    setFilteredPositions(filtered); // Update filtered positions based on search
  };

  return (
    <div className="flex justify-center items-center mt-2 px-4 sm:px-6 md:px-0">
      <div className="w-full max-w-2xl p-6 bg-white shadow-lg rounded-lg">
        <h2 className="text-xl font-semibold mb-4 text-center">Manage Positions</h2>

        {/* Add a New Position Section */}
        <div className="mb-6 p-4 bg-gray-100 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Add a New Position</h2>
          <div className="flex flex-col sm:flex-row sm:space-x-2 space-y-2 sm:space-y-0">
            <input
              type="text"
              value={newPositionName}
              onChange={handleNewNameChange}
              className="border border-gray-300 rounded-md px-3 py-1 w-full sm:flex-1"
              placeholder="Enter position name"
            />
            <Button
              type="primary"
              onClick={handleSubmit}
              loading={isSubmitting}
              icon={<PlusOutlined />}
              className="w-full sm:w-auto mt-2 sm:mt-0"
            >
              {isSubmitting ? "Adding..." : "Add Position"}
            </Button>
          </div>
        </div>

        {/* Positions List */}
        <div className="p-4 bg-gray-100 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Current Positions</h2>
          {/* Search field */}
          <div className="mb-4">
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Search positions..."
              className="border border-gray-300 rounded-md px-3 py-1 w-full"
            />
          </div>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(2)].map((_, index) => (
                <Skeleton key={index} active />
              ))}
            </div>
          ) : filteredPositions.length === 0 ? (
            <p className="text-gray-500">No positions found.</p>
          ) : (
            <ul className="space-y-3">
              {filteredPositions.map((dep) => (
                <li key={dep.id} className="bg-white p-3 rounded-lg shadow">
                  {isEditing && editingId === dep.id ? (
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                      <input
                        type="text"
                        value={positionName}
                        onChange={(e) => setPositionName(e.target.value)}
                        className="border border-gray-300 rounded-md px-3 py-1 w-full md:flex-1"
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
                      <span className="mb-3 md:mb-0">{dep.name}</span>
                      <div className="flex space-x-2">
                        <Button
                          className="px-3 py-1 rounded-md text-xs sm:text-sm"                     
                          type="primary"
                          onClick={() => { setEditingId(dep.id); setPositionName(dep.name); setIsEditing(true); }}
                        >
                          <FaEdit className="inline-block mr-1" /> Edit
                        </Button>
                        <Popconfirm
                          title="Are you sure you want to delete this position?"
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

export default ManagePositions;
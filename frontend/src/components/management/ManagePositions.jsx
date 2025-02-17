import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { db } from "../../firebaseConfig";
import { collection, getDocs, doc, setDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { FaEdit, FaTrashAlt, FaPlusCircle } from 'react-icons/fa';
import { Popconfirm, Button } from 'antd';
import { PlusOutlined } from '@ant-design/icons';

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
        toast.error("Failed to fetch positions.");
      }
    };

    fetchPositions();
  }, []);

  // Update filtered positions immediately after any change
  useEffect(() => {
    setFilteredPositions(positions.filter((pos) =>
      pos.name.toLowerCase().includes(searchQuery.toLowerCase())
    ));
  }, [positions, searchQuery]); // This will re-run whenever positions or search query changes

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

  // Delete position
  const handleDelete = async (id) => {
    try {
        const positionRef = doc(db, "positions", id);  // Use the id passed in directly
        await deleteDoc(positionRef);  // Delete from Firestore

        toast.success("Position deleted successfully!");

        // Remove the deleted position from the state and update filtered positions
        setPositions((prevPositions) =>
          prevPositions.filter((position) => position.id !== id)
        );
    } catch (error) {
        toast.error("Failed to delete position.");
        console.error("Error deleting position:", error);
    }
  };

  // Handle search query change
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    const filtered = positions.filter((pos) =>
      pos.name.toLowerCase().includes(e.target.value.toLowerCase())
    );
    setFilteredPositions(filtered); // Update filtered positions based on search
  };

  return (
    <div className="flex justify-center items-center mt-2">
      <div className="w-full max-w-2xl p-6 bg-white shadow-lg rounded-lg">
        <h2 className="text-xl font-semibold mb-4 text-center">Manage Positions</h2>

        {/* Add New Position */}
        <div className="mb-6 p-4 bg-gray-100 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Add a New Position</h2>
          <div className="flex space-x-2">
            <input
              type="text"
              value={newPositionName}
              onChange={handleNewNameChange}
              className="border border-gray-300 rounded-md px-3 py-1 flex-1"
              placeholder="Enter position name"
            />
            <Button 
              type="primary" 
              onClick={handleSubmit} 
              loading={isSubmitting}
              icon={<PlusOutlined />}
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
          {filteredPositions.length === 0 ? (
            <p className="text-gray-500">No positions found.</p>
          ) : (
            <ul className="space-y-3">
              {filteredPositions.map((pos) => (
                <li key={pos.id} className="flex items-center justify-between bg-white p-3 rounded-lg shadow">
                  {isEditing && editingId === pos.id ? (
                    <>
                      <input
                        type="text"
                        value={positionName}
                        onChange={(e) => setPositionName(e.target.value)}
                        className="border border-gray-300 rounded-md px-3 py-1 flex-1"
                      />
                      <Button
                        type="primary"
                        onClick={handleUpdate}
                        loading={isSubmitting} // Use loading state for the Save button
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
                      <span>{pos.name}</span>
                      <div className="flex space-x-2">
                        <Button
                          type="primary"
                          onClick={() => { setEditingId(pos.id); setPositionName(pos.name); setIsEditing(true); }}
                        >
                          <FaEdit className="inline-block mr-2" /> Edit
                        </Button>
                        <Popconfirm
                          title="Are you sure you want to delete this Position?"
                          onConfirm={() => handleDelete(pos.id)}
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

export default ManagePositions;
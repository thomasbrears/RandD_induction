import React, { useState, useEffect } from "react";
import { db } from "../../firebaseConfig";
import { collection, getDocs, doc, setDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { FaEdit, FaTrashAlt } from 'react-icons/fa';
import { Button, Popconfirm, Skeleton } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { notifySuccess, notifyError, messageWarning } from "../../utils/notificationService";

const ManageLocations = () => {
  const [newLocationName, setNewLocationName] = useState(""); 
  const [locationName, setLocationName] = useState("");
  const [locations, setLocations] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState("");
  const [filteredLocations, setFilteredLocations] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddingNew, setIsAddingNew] = useState(false); 
  const [isLoading, setIsLoading] = useState(true);

  // Fetch locations from Firestore
  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const snapshot = await getDocs(collection(db, "locations"));
        const locationsList = snapshot.docs.map((doc) => ({
          id: doc.id,
          name: doc.data().name,
        }));
        setLocations(locationsList);
        setFilteredLocations(locationsList);
      } catch (error) {
        console.error("Error fetching locations:", error);
        notifyError("Failed to fetch locations", error.message);
      } finally {
        setIsLoading(false); 
      }
    };

    fetchLocations();
  }, []);

  // Update filtered locations immediately after any change
  useEffect(() => {
    setFilteredLocations(locations.filter((dep) =>
      dep.name.toLowerCase().includes(searchQuery.toLowerCase())
    ));
  }, [locations, searchQuery]);

  // Handle location name change for adding new location
  const handleNewNameChange = (e) => {
    setNewLocationName(e.target.value);
  };

  // Handle location name change for editing
  const handleEditNameChange = (e) => {
    setLocationName(e.target.value);
  };

  // Submit new location to Firestore
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newLocationName.trim()) {
      messageWarning("Please enter a location name");
      return;
    }

    setIsSubmitting(true);

    try {
      const locationRef = doc(db, "locations", newLocationName);
      await setDoc(locationRef, {
        name: newLocationName,
      });

      notifySuccess("Location added successfully", `"${newLocationName}" has been added to your locations list.`);
      setNewLocationName("");
      
      // Update the location list without fetching from Firestore
      setLocations((prevLocations) => [
        ...prevLocations,
        { id: newLocationName, name: newLocationName },
      ]);
      setIsAddingNew(false); // Close input field after submission
    } catch (error) {
      notifyError("Failed to add location", error.message);
      console.error("Error adding location:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Start editing location
  const handleEdit = (id, currentName) => {
    setEditingId(id);
    setLocationName(currentName); // Set the location name for editing
    setIsEditing(true);
  };

  // Update location name in Firestore
  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!locationName.trim()) {
      messageWarning("Please enter a location name");
      return;
    }

    setIsSubmitting(true);

    try {
      const locationRef = doc(db, "locations", editingId);
      await updateDoc(locationRef, {
        name: locationName,
      });

      notifySuccess("Location updated", `Location has been renamed to "${locationName}"`);
      setLocationName("");
      setIsEditing(false);

      // Update the location list with the new name
      setLocations((prevLocations) =>
        prevLocations.map((location) =>
          location.id === editingId
            ? { ...location, name: locationName }
            : location
        )
      );
    } catch (error) {
      notifyError("Failed to update location", error.message);
      console.error("Error updating location:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete location
  const handleDelete = async (id) => {
    try {
      const locationRef = doc(db, "locations", id);  // Use the id passed in directly
      await deleteDoc(locationRef);  // Delete from Firestore

      // Find the name of the deleted location for the notification
      const deletedLocation = locations.find(loc => loc.id === id);
      notifySuccess(
        "Location deleted", 
        deletedLocation ? `"${deletedLocation.name}" has been removed` : ""
      );

      // Remove the deleted location from the state
      setLocations((prevLocations) =>
        prevLocations.filter((location) => location.id !== id)
      );
    } catch (error) {
      notifyError("Failed to delete location", error.message);
      console.error("Error deleting location:", error);
    }
  };

  // Handle search query change
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    const filtered = locations.filter((dep) =>
      dep.name.toLowerCase().includes(e.target.value.toLowerCase())
    );
    setFilteredLocations(filtered);
  };

  return (
    <div className="flex justify-center items-center mt-2 px-4 sm:px-6 md:px-0">
      <div className="w-full max-w-2xl p-6 bg-white shadow-lg rounded-lg">
        <h2 className="text-xl font-semibold mb-4 text-center">Manage Locations</h2>

        {/* Add a New Location Section */}
        <div className="mb-6 p-4 bg-gray-100 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Add a New Location</h2>
          <div className="flex flex-col sm:flex-row sm:space-x-2 space-y-2 sm:space-y-0">
            <input
              type="text"
              value={newLocationName}
              onChange={handleNewNameChange}
              className="border border-gray-300 rounded-md px-3 py-1 w-full sm:flex-1"
              placeholder="Enter location name"
            />
            <Button
              type="primary"
              onClick={handleSubmit}
              loading={isSubmitting}
              icon={<PlusOutlined />}
              className="w-full sm:w-auto mt-2 sm:mt-0"
            >
              {isSubmitting ? "Adding..." : "Add Location"}
            </Button>
          </div>
        </div>

        {/* Locations List */}
        <div className="p-4 bg-gray-100 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Current Locations</h2>
          {/* Search field */}
          <div className="mb-4">
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Search locations..."
              className="border border-gray-300 rounded-md px-3 py-1 w-full"
            />
          </div>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(1)].map((_, index) => (
                <Skeleton key={index} active />
              ))}
            </div>
          ) : filteredLocations.length === 0 ? (
            <p className="text-gray-500">No locations found.</p>
          ) : (
            <ul className="space-y-3">
              {filteredLocations.map((dep) => (
                <li key={dep.id} className="bg-white p-3 rounded-lg shadow">
                  {isEditing && editingId === dep.id ? (
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                      <input
                        type="text"
                        value={locationName}
                        onChange={(e) => setLocationName(e.target.value)}
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
                          onClick={() => { setEditingId(dep.id); setLocationName(dep.name); setIsEditing(true); }}
                        >
                          <FaEdit className="inline-block mr-1" /> Edit
                        </Button>
                        <Popconfirm
                          title="Are you sure you want to delete this location?"
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

export default ManageLocations;
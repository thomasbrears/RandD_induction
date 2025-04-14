import { db } from "../firebase.js";

// Get all locations
export const getAllLocations = async (req, res) => {
  try {
    const snapshot = await db.collection("locations").get();
    const locations = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    res.json(locations);
  } catch (error) {
    console.error("Error fetching locations:", error);
    res.status(500).send(error);
  } 
};

// Create a new location
export const createLocation = async (req, res) => {
  const { name } = req.body;

  // Validate name
  if (!name || typeof name !== 'string' || name.trim() === '') {
    return res.status(400).json({ message: "Name is required" });
  }

  // Validate character limit
  if (name.length > 50) {
    return res.status(400).json({ message: "Name must be 50 characters or less" });
  }

  try {
    const locationRef = db.collection("locations").doc(id);
    const doc = await locationRef.get();

    if (!doc.exists) {
      return res.status(404).json({ message: "Location not found" });
    }

    const trimmedName = name.trim();
    await locationRef.update({ name: trimmedName });
    res.status(200).json({ message: "Location updated successfully", id, name: trimmedName });
  } catch (error) {
    console.error("Error updating location:", error);
    res.status(500).send(error);
  }
};

// Update location
export const updateLocation = async (req, res) => {
  const { name } = req.body;
  const { id } = req.params;

  // Validate name
  if (!name || typeof name !== 'string' || name.trim() === '') {
    return res.status(400).json({ message: "Name is required" });
  }

  try {
    const trimmedName = name.trim();
    await db.collection("locations").doc(id).update({ name: trimmedName });
    res.status(200).json({ message: "Location updated successfully", id, name: trimmedName });
  } catch (error) {
    console.error("Error updating location:", error);
    res.status(500).send(error);
  }
};

// Delete location
export const deleteLocation = async (req, res) => {
  const { id } = req.params;
  try {
    const locationRef = db.collection("locations").doc(id);
    const doc = await locationRef.get();

    if (!doc.exists) {
      return res.status(404).json({ message: "Location not found" });
    }

    await locationRef.delete();
    res.status(200).json({ message: "Location deleted successfully" });
  } catch (error) {
    console.error("Error deleting location:", error);
    res.status(500).send(error);
  }
};




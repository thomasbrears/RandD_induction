import { db } from "../firebase.js";

// Get all locations
export const getAllLocations = async (req, res) => {
  try {
    const snapshot = await db.collection("locations").get();  // Locations collection
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
  try {
    const newLocation = await db.collection("locations").add({ name });
    res.status(201).json({ id: newLocation.id, name });
  } catch (error) {
    console.error("Error adding location:", error);
    res.status(500).send(error);
  }
};

// Update location
export const updateLocation = async (req, res) => {
  const { name } = req.body;
  const { id } = req.params;
  try {
    await db.collection("locations").doc(id).update({ name });
    res.status(200).send("Location updated successfully");
  } catch (error) {
    console.error("Error updating location:", error);
    res.status(500).send(error);
  }
};

// Delete location
export const deleteLocation = async (req, res) => {
  const { id } = req.params;
  try {
    await db.collection("locations").doc(id).delete();
    res.status(200).send("Location deleted successfully");
  } catch (error) {
    console.error("Error deleting location:", error);
    res.status(500).send(error);
  }
};

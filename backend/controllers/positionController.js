import { db } from "../firebase.js";

// Utility function to validate the 'name' field
const validateName = (name) => {
  if (!name || typeof name !== "string" || name.trim() === "") {
    return "Name is required";
  }
  if (name.length > 100) {
    return "Name must not exceed 100 characters";
  }
  return null;
};

// Get all positions
export const getAllPositions = async (req, res) => {
  try {
    const snapshot = await db.collection("positions").get();
    const positions = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    res.json(positions);
  } catch (error) {
    console.error("Error fetching positions:", error);
    res.status(500).send({ message: "Internal server error" });
  }
};

// Create a new position
export const createPosition = async (req, res) => {
  const { name } = req.body;

  const validationError = validateName(name);
  if (validationError) {
    return res.status(400).json({ message: validationError });
  }

  try {
    const newPosition = await db.collection("positions").add({ name: name.trim() });
    res.status(201).json({ id: newPosition.id, name: name.trim() });
  } catch (error) {
    console.error("Error adding position:", error);
    res.status(500).send({ message: "Internal server error" });
  }
};

// Update position
export const updatePosition = async (req, res) => {
  const { name } = req.body;
  const { id } = req.params;

  const validationError = validateName(name);
  if (validationError) {
    return res.status(400).json({ message: validationError });
  }

  try {
    await db.collection("positions").doc(id).update({ name: name.trim() });
    res.status(200).json({ message: "Position updated successfully" });
  } catch (error) {
    console.error("Error updating position:", error);
    res.status(500).send({ message: "Internal server error" });
  }
};

// Delete position
export const deletePosition = async (req, res) => {
  const { id } = req.params;
  try {
    await db.collection("positions").doc(id).delete();
    res.status(200).json({ message: "Position deleted successfully" });
  } catch (error) {
    console.error("Error deleting position:", error);
    res.status(500).send({ message: "Internal server error" });
  }
};

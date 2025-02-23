import { db } from "../firebase.js";  // Assuming you're using Firestore or Firebase Admin

// Get all positions
export const getAllPositions = async (req, res) => {
  try {
    const snapshot = await db.collection("positions").get();  // Positions collection
    const positions = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    res.json(positions);
  } catch (error) {
    console.error("Error fetching positions:", error);
    res.status(500).send(error);
  }
};

// Create a new position
export const createPosition = async (req, res) => {
  const { name } = req.body;
  try {
    const newPosition = await db.collection("positions").add({ name });
    res.status(201).json({ id: newPosition.id, name });
  } catch (error) {
    console.error("Error adding position:", error);
    res.status(500).send(error);
  }
};

// Update position
export const updatePosition = async (req, res) => {
  const { name } = req.body;
  const { id } = req.params;
  try {
    await db.collection("positions").doc(id).update({ name });
    res.status(200).send("Position updated successfully");
  } catch (error) {
    console.error("Error updating position:", error);
    res.status(500).send(error);
  }
};

// Delete position
export const deletePosition = async (req, res) => {
  const { id } = req.params;
  try {
    await db.collection("positions").doc(id).delete();
    res.status(200).send("Position deleted successfully");
  } catch (error) {
    console.error("Error deleting position:", error);
    res.status(500).send(error);
  }
};

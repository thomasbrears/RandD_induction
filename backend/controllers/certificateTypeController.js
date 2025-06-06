import { db } from "../firebase.js";

// Get all certificate types
export const getAllCertificateTypes = async (req, res) => {
  try {
    const snapshot = await db.collection("certificateTypes").get();
    const certificateTypes = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    res.json(certificateTypes);
  } catch (error) {
    console.error("Error fetching certificate types:", error);
    res.status(500).send(error);
  } 
};

// Create a new certificate type
export const createCertificateType = async (req, res) => {
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
    const trimmedName = name.trim();
    const docRef = await db.collection("certificateTypes").add({ name: trimmedName });
    res.status(201).json({ message: "Certificate type created successfully", id: docRef.id, name: trimmedName });
  } catch (error) {
    console.error("Error creating certificate type:", error);
    res.status(500).send(error);
  }
};

// Update certificate type
export const updateCertificateType = async (req, res) => {
  const { name } = req.body;
  const { id } = req.params;

  // Validate name
  if (!name || typeof name !== 'string' || name.trim() === '') {
    return res.status(400).json({ message: "Name is required" });
  }

  // Validate character limit
  if (name.length > 50) {
    return res.status(400).json({ message: "Name must be 50 characters or less" });
  }

  try {
    const certificateTypeRef = db.collection("certificateTypes").doc(id);
    const doc = await certificateTypeRef.get();

    if (!doc.exists) {
      return res.status(404).json({ message: "Certificate type not found" });
    }

    const trimmedName = name.trim();
    await certificateTypeRef.update({ name: trimmedName });
    res.status(200).json({ message: "Certificate type updated successfully", id, name: trimmedName });
  } catch (error) {
    console.error("Error updating certificate type:", error);
    res.status(500).send(error);
  }
};

// Delete certificate type
export const deleteCertificateType = async (req, res) => {
  const { id } = req.params;
  try {
    const certificateTypeRef = db.collection("certificateTypes").doc(id);
    const doc = await certificateTypeRef.get();

    if (!doc.exists) {
      return res.status(404).json({ message: "Certificate type not found" });
    }

    await certificateTypeRef.delete();
    res.status(200).json({ message: "Certificate type deleted successfully" });
  } catch (error) {
    console.error("Error deleting certificate type:", error);
    res.status(500).send(error);
  }
};
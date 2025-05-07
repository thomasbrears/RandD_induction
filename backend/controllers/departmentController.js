import { db } from "../firebase.js";

// Utility for email validation
const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

// Get all departments
export const getAllDepartments = async (req, res) => {
  try {
    const snapshot = await db.collection("departments").get();
    const departments = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    res.json(departments);
  } catch (error) {
    console.error("Error fetching departments:", error);
    res.status(500).send(error);
  }
};

// Create a new department
export const createDepartment = async (req, res) => {
  const { name, email } = req.body;

  // Validate name
  if (!name || typeof name !== 'string' || name.trim() === '') {
    return res.status(400).json({ message: 'Name is required' });
  }

  // Validate character limit
  if (name.length > 50) {
    return res.status(400).json({ message: 'Name must be 50 characters or less' });
  }
 
  // Validate email format if provided
  if (email && !isValidEmail(email)) {
    return res.status(400).json({ message: 'Invalid email format' });
  }

  try {
    const departmentData = {
      name: name.trim(),
      email: email?.trim() || `${name.toLowerCase().replace(/\s+/g, '.')}@aut.ac.nz`,
      createdAt: new Date(),
    };

    const newDepartment = await db.collection("departments").add(departmentData);
    res.status(201).json({
      id: newDepartment.id,
      ...departmentData,
    });
  } catch (error) {
    console.error("Error adding department:", error);
    res.status(500).send(error);
  }
};

// Update department
export const updateDepartment = async (req, res) => {
  const { name, email } = req.body;
  const { id } = req.params;

  if (!name || typeof name !== 'string' || name.trim() === '') {
    return res.status(400).json({ message: 'Name is required' });
  }

  if (name.length > 50) {
    return res.status(400).json({ message: 'Name must be 50 characters or less' });
  }

  if (email && !isValidEmail(email)) {
    return res.status(400).json({ message: 'Invalid email format' });
  }

  try {
    const departmentRef = db.collection("departments").doc(id);
    const doc = await departmentRef.get();

    if (!doc.exists) {
      return res.status(404).json({ message: "Department not found" });
    }

    const updateData = {
      name: name.trim(),
      updatedAt: new Date(),
    };

    if (email !== undefined) {
      updateData.email = email.trim();
    }

    await departmentRef.update(updateData);
    res.status(200).json({
      message: "Department updated successfully",
      id,
      ...updateData,
    });
  } catch (error) {
    console.error("Error updating department:", error);
    res.status(500).send(error);
  }
};

// Delete department
export const deleteDepartment = async (req, res) => {
  const { id } = req.params;
  try {
    await db.collection("departments").doc(id).delete();
    res.status(200).json({ message: "Department deleted successfully" });
  } catch (error) {
    console.error("Error deleting department:", error);
    res.status(500).send(error);
  }
};
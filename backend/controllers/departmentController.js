import { db } from "../firebase.js";

// Get all departments
export const getAllDepartments = async (req, res) => {
  try {
    const snapshot = await db.collection("departments").get();  // Departments collection
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
  const { name } = req.body;
  try {
    const newDepartment = await db.collection("departments").add({ name });
    res.status(201).json({ id: newDepartment.id, name });
  } catch (error) {
    console.error("Error adding department:", error);
    res.status(500).send(error);
  }
};

// Update department
export const updateDepartment = async (req, res) => {
  const { name } = req.body;
  const { id } = req.params;
  try {
    await db.collection("departments").doc(id).update({ name });
    res.status(200).send("Department updated successfully");
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
    res.status(200).send("Department deleted successfully");
  } catch (error) {
    console.error("Error deleting department:", error);
    res.status(500).send(error);
  }
};

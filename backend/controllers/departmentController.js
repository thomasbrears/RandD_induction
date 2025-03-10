import { db } from "../firebase.js";

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
  
  // Validate required fields
  if (!name) {
    return res.status(400).json({ message: 'Department name is required' });
  }
  
  // Validate email format if provided
  if (email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }
  }
  
  try {
    // Create department with both name and email
    const departmentData = {
      name,
      email: email || `${name.toLowerCase().replace(/\s+/g, '.')}@autevents.example.com`, // Default email if not provided
      createdAt: new Date()
    };
    
    const newDepartment = await db.collection("departments").add(departmentData);
    res.status(201).json({ 
      id: newDepartment.id, 
      ...departmentData 
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
  
  // Validate required fields
  if (!name) {
    return res.status(400).json({ message: 'Department name is required' });
  }
  
  // Validate email format if provided
  if (email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }
  }
  
  try {
    const updateData = {
      name,
      updatedAt: new Date()
    };
    
    // Only include email in the update if it's provided
    if (email !== undefined) {
      updateData.email = email;
    }
    
    await db.collection("departments").doc(id).update(updateData);
    res.status(200).json({
      message: "Department updated successfully",
      id,
      ...updateData
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

// Migration script to add email field to existing departments
export const addEmailFieldToDepartments = async (req, res) => {
  try {
    const snapshot = await db.collection("departments").get();
    
    if (snapshot.empty) {
      return res.status(200).json({ message: "No departments found to update" });
    }
    
    const batch = db.batch();
    
    snapshot.docs.forEach(doc => {
      const departmentData = doc.data();
      if (!departmentData.email) {
        const departmentName = departmentData.name || "Unknown";
        const defaultEmail = `${departmentName.toLowerCase().replace(/\s+/g, '.')}@autevents.example.com`;
        batch.update(doc.ref, { email: defaultEmail });
      }
    });
    
    await batch.commit();
    res.status(200).json({ message: "Email fields added to all departments successfully" });
  } catch (error) {
    console.error("Error updating departments with email field:", error);
    res.status(500).send(error);
  }
};
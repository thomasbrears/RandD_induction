import { db } from "../firebase.js";
import Departments from "../models/Departments.js";

// Get all inductions
export const getAllInductions = async (req, res) => {
  try {
    const snapshot = await db.collection("inductions").get();
    const inductions = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.json(inductions);
  } catch (error) {
    console.error("Error fetching inductions:", error);
    res.status(500).send({ message: "Error fetching inductions", error: error.message });
  }
};

// Create a new induction
export const createInduction = async (req, res) => {
  const { name, department, description, questions, isDraft, expiryMonths } = req.body;

  // Only apply validation for non-draft inductions
  if (!isDraft) {
    // Basic validations
    if (!name || typeof name !== "string" || name.trim() === "") {
      return res.status(400).json({ message: "Name is required." });
    }

    if (name.length > 50) {
      return res.status(400).json({ message: "Name must be 50 characters or less." });
    }

    if (!department || typeof department !== 'string' || department.trim() === '') {
      return res.status(400).json({ message: "Department must be a non-empty string" });
    }

    if (description !== undefined && typeof description !== "string") {
      return res.status(400).json({ message: "Description must be a string." });
    }
  }

  try {
    const newInduction = {
      name: name?.trim() || (isDraft ? "(Draft Induction)" : ""),
      department: department || "",
      description: description?.trim() || "",
      questions: questions || [],
      isDraft: isDraft === true,
      expiryMonths: expiryMonths || null,
      createdAt: new Date(),
    };

    const addedInduction = await db.collection("inductions").add(newInduction);
    res.status(201).json({ id: addedInduction.id, ...newInduction });
  } catch (error) {
    console.error("Error creating induction:", error);
    res.status(500).send({ message: "Error creating induction", error: error.message });
  }
};


// Get a specific induction by ID
export const getInductionById = async (req, res) => {
  try {
    const id = req.query.id;
    if (!id) {
      return res.status(400).json({ message: "Induction ID is required" });
    }
    
    const inductionRef = db.collection("inductions").doc(id);
    const inductionDoc = await inductionRef.get();

    if (!inductionDoc.exists) {
      return res.status(404).json({ message: `Induction with ID ${id} not found` });
    }

    // Get the full document data
    const docData = inductionDoc.data();
    
    // Create the response object with all fields
    const inductionData = {
      id: id,
      name: docData.name || "",
      department: docData.department || Departments.RETAIL,
      description: docData.description || "",
      questions: docData.questions || [],
      isDraft: docData.isDraft === true, // Explicitly convert to boolean
      expiryMonths: inductionDoc.exists ? inductionDoc.data().expiryMonths : null,
      createdAt: docData.createdAt || null,
      updatedAt: docData.updatedAt || null
    };

    res.json(inductionData);
  } catch (error) {
    console.error("Error fetching induction:", error);
    res.status(500).send({ message: "Error fetching induction", error: error.message });
  }
};

export const updateInductionById = async (req, res) => {
  const { id, name, department, description, questions, expiryMonths } = req.body;

  if (!id || typeof id !== "string") {
    return res.status(400).json({ message: "Valid induction ID is required" });
  }

    // Validate the ID
    if (!id || typeof id !== "string") {
      console.error("Invalid ID:", id);
      return res.status(400).json({ message: "Valid induction ID is required" });
    }

    // Validate name
    if (name !== undefined) {
      if (typeof name !== "string") {
        console.error("Invalid name type:", typeof name);
        return res.status(400).json({ message: "Name must be a string" });
      }
      
      if (name.trim() === "") {
        console.error("Empty name");
        return res.status(400).json({ message: "Name cannot be empty" });
      }
      
      if (name.length > 50) {
        console.error("Name too long:", name.length);
        return res.status(400).json({ message: "Name must be 50 characters or less" });
      }
    }

    // Validate department is a string and not empty
    if (department !== undefined) {
      if (typeof department !== 'string' || department.trim() === '') {
        console.error("Invalid department:", department);
        return res.status(400).json({ message: "Department must be a non-empty string" });
      }
    }

    // Validate description
    if (description !== undefined && typeof description !== "string") {
      console.error("Invalid description type:", typeof description);
      return res.status(400).json({ message: "Description must be a string" });
    }

    // Validate questions array
    if (questions !== undefined) {
      if (!Array.isArray(questions)) {
        console.error("Invalid questions type:", typeof questions);
        return res.status(400).json({ message: "Questions must be an array" });
      }
    }
    
    // Check if induction exists
    const inductionRef = db.collection("inductions").doc(id);
    const inductionDoc = await inductionRef.get();

    if (!inductionDoc.exists) {
      console.error("Induction not found:", id);
      return res.status(404).json({ message: "Induction not found" });
    }

    // Prepare update data with type checking
    const updateData = {};
    
    if (name !== undefined) {
      updateData.name = name.trim();
    }
    
    if (department !== undefined) {
      updateData.department = department;
    }
    
    if (description !== undefined) {
      updateData.description = description.trim();
    }
    
    if (questions !== undefined) {
      updateData.questions = questions;
    }
    
    updateData.updatedAt = new Date();

    // Perform the update
    await inductionRef.update(updateData);
    
    // Return success response
    res.json({ 
      message: "Induction updated successfully", 
      id, 
      ...updateData 
    });
  } catch (error) {
    console.error("Error updating induction:", error);
    res.status(500).json({ 
      message: "Failed to update induction", 
      error: error.message,
      stack: error.stack
    });
  }
};

export const deleteInduction = async (req, res) => {
  try {
    const id = req.query.id;
    if (!id) {
      return res.status(400).json({ message: "Induction ID is required" });
    }

    const inductionRef = db.collection("inductions").doc(id);
    const inductionDoc = await inductionRef.get();

    if (!inductionDoc.exists) {
      return res.status(404).json({ message: "Induction not found" });
    }

    await inductionRef.delete();

    res.json({ message: "Induction deleted successfully" });
  } catch (error) {
    console.error("Error deleting induction:", error);
    res.status(500).json({ message: "Failed to delete induction", error });
  }
};

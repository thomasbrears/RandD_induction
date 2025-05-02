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
    res.status(500).send(error);
  }
};

// Create a new induction
export const createInduction = async (req, res) => {
  const { name, department, description, questions } = req.body;

  // Basic validations
  if (!name || typeof name !== "string" || name.trim() === "") {
    return res.status(400).json({ message: "Name is required." });
  }

  if (name.length > 50) {
    return res.status(400).json({ message: "Name must be 50 characters or less." });
  }

  /*if (!department || !Object.values(Departments).includes(department)) {
    return res.status(400).json({ message: "Invalid or missing department" });
  }*///Departments are changable now so this doesnt work

  if (description !== undefined && typeof description !== "string") {
    return res.status(400).json({ message: "Description must be a string." });
  }

  try {
    const newInduction = {
      name: name.trim(),
      department,
      description: description?.trim() || "",
      questions: questions || [],
      createdAt: new Date(),
    };

    const addedInduction = await db.collection("inductions").add(newInduction);
    res.status(201).json({ id: addedInduction.id, ...newInduction });
  } catch (error) {
    console.error("Error creating induction:", error);
    res.status(500).send(error);
  }
};


// Get a specific induction by ID
export const getInductionById = async (req, res) => {
  try {
    const id = req.query.id;
    const inductionRef = db.collection("inductions").doc(id);
    const inductionDoc = await inductionRef.get();

    const inductionData = {
      id: id,
      name: inductionDoc.exists ? inductionDoc.data().name : " ",
      department: inductionDoc.exists
        ? inductionDoc.data().department
        : Departments.RETAIL,
      description: inductionDoc.exists ? inductionDoc.data().description : " ",
      questions: inductionDoc.exists ? inductionDoc.data().questions : [],
    };

    res.json(inductionData);
  } catch (error) {
    console.error("Error fetching induction:", error);
    res.status(500).send(error);
  }
};

export const updateInductionById = async (req, res) => {
  const { id, name, department, description, questions } = req.body;

  if (!id || typeof id !== "string") {
    return res.status(400).json({ message: "Valid induction ID is required" });
  }

  if (name && (typeof name !== "string" || name.trim() === "")) {
    return res.status(400).json({ message: "Name must be a non-empty string if provided" });
  }

  if (name && name.length > 50) {
    return res.status(400).json({ message: "Name must be 50 characters or less" });
  }

  /*if (department && !Object.values(Departments).includes(department)) {
    return res.status(400).json({ message: "Invalid department" });
  }*///Departments are changable now so this doesnt work

  if (description !== undefined && typeof description !== "string") {
    return res.status(400).json({ message: "Description must be a string." });
  }

  try {
    const inductionRef = db.collection("inductions").doc(id);
    const inductionDoc = await inductionRef.get();

    if (!inductionDoc.exists) {
      return res.status(404).json({ message: "Induction not found" });
    }

    const updateData = {
      ...(name && { name: name.trim() }),
      ...(department && { department }),
      ...(description !== undefined && { description: description.trim() }),
      ...(questions !== undefined && { questions }),
      updatedAt: new Date(),
    };

    await inductionRef.update(updateData);
    res.json({ message: "Induction updated successfully", id, ...updateData });
  
  } catch (error) {
    console.error("Error updating induction:", error);
    res.status(500).send(error);
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

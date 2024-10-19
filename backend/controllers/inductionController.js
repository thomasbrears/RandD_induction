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
  const newInduction = req.body;

  try {
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

// Add an update induction endpoint (future implementation)

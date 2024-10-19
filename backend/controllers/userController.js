import admin from "firebase-admin";
import { db } from "../firebase.js";
import Positions from "../models/Positions.js";
import { sendEmail } from "../utils/mailjet.js";

// Get all users
export const getAllUsers = async (req, res) => {
  try {
    const listUsersResult = await admin.auth().listUsers();
    
    // Use Promise.all to wait for all users to be processed
    const users = await Promise.all(
      listUsersResult.users.map(async (userRecord) => ({
        uid: userRecord.uid,
        email: userRecord.email,
        permission: userRecord.customClaims ? userRecord.customClaims.role : "Unknown",
        firstName: userRecord.displayName ? userRecord.displayName.split(" ")[0] : "firstName",
        lastName: userRecord.displayName ? userRecord.displayName.split(" ")[1] || "" : "lastName",
      }))
    );

    res.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).send(error);
  }
};

// Get a specific user
export const getUser = async (req, res) => {
  try {
    const uid = req.query.uid;
    const userResult = await admin.auth().getUser(uid);

    //Firestore
    const userRef = db.collection("users").doc(uid);
    const userDoc = await userRef.get();

    const userData = {
      uid: userResult.uid,
      firstName: userResult.displayName
        ? userResult.displayName.split(" ")[0]
        : "",
      lastName: userResult.displayName
        ? userResult.displayName.split(" ")[1] || ""
        : "",
      email: userResult.email,
      permission: userResult.customClaims
        ? userResult.customClaims.role
        : Permissions.USER,
      position: userDoc.exists ? userDoc.data().position : Positions.TEAM,
      locations: userDoc.exists ? userDoc.data().locations : [],
      assignedInductions: userDoc.exists
        ? userDoc.data().assignedInductions
        : [],
    };

    res.json(userData);
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).send(error);
  }
};

// Create a new user
export const createUser = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      permission,
      position,
      locations,
      assignedInductions,
    } = req.body;

    if (!email || !permission) {
      return res
        .status(400)
        .json({ message: "Email and permission are required." });
    }

    const userRecord = await admin.auth().createUser({
      email: email,
      displayName: `${firstName} ${lastName}`,
      emailVerified: false,
      disabled: false,
    });

    //Custom Claim Token
    admin.auth().setCustomUserClaims(userRecord.uid, { role: permission });

    //FireStore
    try {
      const userRef = db.collection("users").doc(userRecord.uid);
      await userRef.set({
        position: position,
        locations: Array.isArray(locations) ? locations : [],
        assignedInductions: Array.isArray(assignedInductions)
          ? assignedInductions
          : [],
      });
    } catch (firestoreError) {
      console.error("Firestore error: ", firestoreError);
      return res.status(500).json({ message: "Error writing to Firestore." });
    }

    //Email
    /*await sendEmail(
      email,
      "Welcome to AUT Events! Your Induction Account Invitation",
      `
      <p>Dear ${firstName} ${lastName},</p>

      <p>Welcome to the AUT Events team! We’re excited to have you on board.</p>

      <p>An account has been created for you on the AUT Events Induction platform. This is where you'll complete important onboarding activities and access induction resources.</p>

      <p><strong>Getting Started:</strong></p>
      <ol>
        <li><strong>Visit the Homepage:</strong> Click the link below to visit the AUT Events Induction platform:
          <a href="${process.env.REACT_APP_VERCEL_DEPLOYMENT}">AUT Events Induction Homepage</a>
        </li>
        <li><strong>Log In:</strong> From the homepage, you can log in using your email address and you’ll be prompted to create a password. Or you can use the passwordless login option.</li>
      </ol>

      <p>One of our managers will guide you through the necessary induction process when you start with us.</p>

      <p>If you have any questions or issues accessing your account, feel free to reach out.</p>

      <p>We look forward to working with you!</p>

      <p>Best regards,</p>
      <p>AUT Events Team</p>
      `
    );*/

    res.status(201).json({
      uid: userRecord.uid,
      email: userRecord.email,
      role: permission,
      message: `User created successfully`,
    });
  } catch (error) {
    console.error("Error creating user", error);
    res.status(500).json({ message: "Error creating user: " + error.message });
  }
};

// Update a user
export const updateUser = async (req, res) => {
  try {
    const {
      uid,
      firstName,
      lastName,
      email,
      permission,
      position,
      locations,
      assignedInductions,
    } = req.body;

    const userResult = await admin.auth().updateUser(uid, {
      email: email,
      displayName: `${firstName} ${lastName}`,
    });

    admin.auth().setCustomUserClaims(uid, { role: permission });

    //Firestore
    const userRef = db.collection("users").doc(uid);
    await userRef.update({
      position: position,
      locations: Array.isArray(locations) ? locations : [],
      assignedInductions: Array.isArray(assignedInductions)
        ? assignedInductions
        : [],
    });

    res.json({
      data: userResult,
      message: "User updated and role set successfully",
    });
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).send(error);
  }
};

// Delete a user
export const deleteUser = async (req, res) => {
  try {
    const uid = req.query.uid;
    await admin.auth().deleteUser(uid);
    await db.collection("users").doc(uid).delete();

    res.status(200).json({
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).send(error);
  }
};

// Get assigned inductions for a user
export const getAssignedInductions = async (req, res) => {
  try {
    const uid = req.query.uid;

    // Firestore
    const userRef = db.collection("users").doc(uid);
    const userDoc = await userRef.get();

    const userData = {
      assignedInductions: userDoc.exists
        ? userDoc.data().assignedInductions
        : [],
    };

    res.json(userData);
  } catch (error) {
    console.error("Error fetching assigned inductions:", error);
    res.status(500).send(error);
  }
};
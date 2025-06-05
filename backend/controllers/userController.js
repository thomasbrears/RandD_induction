import admin from "firebase-admin";
import { db } from "../firebase.js";
import Positions from "../models/Positions.js";
import { sendEmail } from "../utils/mailjet.js";
import { format } from "date-fns";

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
      position: userDoc.exists ? userDoc.data().position : "",
      department: userDoc.exists ? userDoc.data().department : "",
      locations: userDoc.exists ? userDoc.data().locations : [],
      disabled: userResult.disabled,
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
      position, // optional
      department,
      locations,
      assignedInductions,
    } = req.body;

    // Validation for email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    // Validation for name field
    if (!firstName || !lastName) {
      return res.status(400).json({ message: "Name is required" });
    }

    // Position is optional - no validation needed

    // Validation for locations
    if (!Array.isArray(locations) || locations.length === 0) {
      return res.status(400).json({ message: "At least one location must be provided" });
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
        userFirstName: firstName,
        userLastName: lastName,
        permission: permission,
        position: position || "", // Default to empty string if not provided
        department: department,
        locations: Array.isArray(locations) ? locations : [],
        // Inductions are managed by a separate controller
      });
    } catch (firestoreError) {
      console.error("Firestore error: ", firestoreError);
      return res.status(500).json({ message: "Error writing to Firestore." });
    }

    // Fetch email settings
    const emailSettingsSnapshot = await db.collection("emailSettings").get();
    let replyToEmail = "autevents@brears.xyz"; // Default
    
    if (!emailSettingsSnapshot.empty) {
      const emailSettings = emailSettingsSnapshot.docs[0].data();
      replyToEmail = emailSettings.defaultReplyTo || replyToEmail;
    }

    // Prepare email content
    const emailSubject = `Welcome to AUT Events, ${firstName}! Your Induction Account Invitation`;
    const emailBody = `
      <h1>Kia ora ${firstName} ${lastName}!</h1>
      <p>Welcome to AUT Events! We're excited to have you on board and looking forward to working with you.</p>
      <p>An account has been created for you on the AUT Events Induction Portal. This is where you'll complete important onboarding activities and access induction resources.</p>
      
      <p><strong>Getting Started:</strong></p>
      <ol>
        <li><strong>Visit the Homepage:</strong> Click the button below to visit the AUT Events Induction Portal:</li>
        <a href="${process.env.REACT_APP_VERCEL_DEPLOYMENT}" class="button">AUT Events Induction Homepage</a>
        <li><strong>Log In:</strong> From the homepage, you can log in using this email address and choose the passwordless login option, or you can set a password <a href="${process.env.REACT_APP_VERCEL_DEPLOYMENT}/auth/reset-password">here</a>.</li>
      </ol>

      <p>One of our managers will guide you through the necessary induction process when you start with us.</p>

      <p>If you have any questions or issues accessing your account, feel free to reach out to us at <a href="mailto:events@aut.ac.nz">events@aut.ac.nz</a> or reply to this email.</p>

      <p>We look forward to working with you!</p>

      <p>Ngā mihi (kind regards),<br/>AUT Events Management</p>
    `;

    // Send welcome email
    await sendEmail(email, emailSubject, emailBody, replyToEmail, []);
    
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
      position, // optional
      department,
      locations,
      assignedInductions = [],
    } = req.body;

    // Validate required fields
    if (!uid || typeof uid !== "string") {
      return res.status(400).json({ message: "A valid UID is required." });
    }

    if (!firstName || typeof firstName !== "string" || firstName.trim() === "") {
      return res.status(400).json({ message: "First name is required." });
    }

    if (!lastName || typeof lastName !== "string") {
      return res.status(400).json({ message: "Last name is required." });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      return res.status(400).json({ message: "Invalid email format." });
    }

    if (!permission || typeof permission !== "string") {
      return res.status(400).json({ message: "Permission is required." });
    }

    // Position is optional - no validation needed

    if (!Array.isArray(locations) || locations.length === 0) {
      return res.status(400).json({ message: "At least one location must be provided." });
    }

    // Fetch existing user data
    const userRef = db.collection("users").doc(uid);
    const userDoc = await userRef.get();
    if (!userDoc.exists) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update user in Firebase Auth
    const userResult = await admin.auth().updateUser(uid, {
      email: email,
      displayName: `${firstName} ${lastName}`,
    });

    // Set custom user claims
    await admin.auth().setCustomUserClaims(uid, { role: permission });

    // Update Firestore
    await userRef.update({
      usersName: `${firstName} ${lastName}`,
      permission: permission,
      position: position || "", // Default to empty string if not provided
      department: department,
      locations: Array.isArray(locations) ? locations : [],
      // assignedInductions are no longer managed in this controller
    });

    res.json({
      data: userResult,
      message: "User updated successfully"
    });
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({
      error: error.message || "Unknown error occurred",
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
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

export const deactivateUser = async (req, res) => {
  try {
    const { uid } = req.body;
    if (!uid) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const user = await admin.auth().getUser(uid).catch(() => null);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    await admin.auth().updateUser(uid, { disabled: true });
    res.json({ message: "User deactivated successfully" });
  } catch (error) {
    console.error("Error deactivating user:", error);
    res.status(500).json({ message: error.message });
  }
};

export const reactivateUser = async (req, res) => {
  try {
    const { uid } = req.body;
    if (!uid) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const user = await admin.auth().getUser(uid).catch(() => null);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    await admin.auth().updateUser(uid, { disabled: false });
    res.json({ message: "User reactivated successfully" });
  } catch (error) {
    console.error("Error reactivating user:", error);
    res.status(500).json({ message: error.message });
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

// Get a specific assigned induction by its assignmentID
export const getAssignedInduction = async (req, res) => {
  try {
    const assignmentID = req.query.assignmentID;
    
    if (!assignmentID) {
      return res.status(400).json({ message: "No assignment ID provided" });
    }

    // Find the user with this assignment
    // First get all users (in a real app, you'd optimize this with an index/query)
    const usersSnapshot = await db.collection("users").get();
    
    let foundInduction = null;

    // Iterate through users to find the matching assignmentID
    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data();
      if (userData.assignedInductions) {
        const foundAssignment = userData.assignedInductions.find(
          assignment => assignment.assignmentID === assignmentID
        );
        
        if (foundAssignment) {
          // Now get the actual induction details
          const inductionRef = db.collection("inductions").doc(foundAssignment.id);
          const inductionDoc = await inductionRef.get();
          
          if (inductionDoc.exists) {
            foundInduction = {
              ...inductionDoc.data(),
              id: inductionDoc.id,
              assignmentID: assignmentID, // Include the assignmentID for reference
              status: foundAssignment.status,
              dueDate: foundAssignment.dueDate,
              availableFrom: foundAssignment.availableFrom,
              completionDate: foundAssignment.completionDate
            };
            break;
          }
        }
      }
    }

    if (!foundInduction) {
      return res.status(404).json({ message: "Assigned induction not found" });
    }

    res.json({ induction: foundInduction });
  } catch (error) {
    console.error("Error fetching assigned induction:", error);
    res.status(500).send(error);
  }
};
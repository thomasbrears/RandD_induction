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
      position: userDoc.exists ? userDoc.data().position : Positions.TEAM,
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
        <li><strong>Log In:</strong> From the homepage, you can log in using this email address and choose the passwordless login option, or you can set a password <a href="${process.env.REACT_APP_VERCEL_DEPLOYMENT}/reset-password">here</a>.</li>
      </ol>

      <p>One of our managers will guide you through the necessary induction process when you start with us.</p>

      <p>If you have any questions or issues accessing your account, feel free to reach out to us at <a href="mailto:events@aut.ac.nz">events@aut.ac.nz</a> or reply to this email.</p>

      <p>We look forward to working with you!</p>

      <p>Ngā mihi (kind regards),<br/>AUT Events Management</p>
    `;

    const replyToEmail = 'autevents@brears.xyz'; // reply to aut events
    const ccEmails = ['manager@brears.xyz']; // Cc Rinus

    // Send welcome email with ReplyTo and CC, using the default template
    await sendEmail(email, emailSubject, emailBody, replyToEmail, ccEmails);

    // Send emails for assigned inductions
    for (const induction of assignedInductions) {
      const formattedAvailableFrom = induction.availableFrom
        ? format(new Date(induction.availableFrom), "d MMMM yyyy")
        : "Unavailable";
      const formattedDueDate = induction.dueDate
        ? format(new Date(induction.dueDate), "d MMMM yyyy")
        : "Unavailable";

      const inductionEmailSubject = `You have a new induction to complete: ${induction.name || 'Unnamed Induction'}`;
      const inductionEmailBody = `
        <h1>Kia ora ${firstName} ${lastName}!</h1>
        <p>You have been assigned a new induction module to complete.</p>
        <br>
        
        <h3>Here are the details:</h3>
        <p><strong>Induction Name:</strong> ${induction.name || "Unnamed Induction"}</p>
        <p><strong>Available from:</strong> ${formattedAvailableFrom}</p>
        <p><strong>Due Date:</strong> ${formattedDueDate}</p>

        <br>
        <h3>How to complete the induction?</h3>
        <p>Simply head to our induction portal website (${process.env.REACT_APP_VERCEL_DEPLOYMENT}) and log in using this email address. Navigate to the "My Inductions" tab, find this induction, and click "Start".</p>
        <a href="${process.env.REACT_APP_VERCEL_DEPLOYMENT}/inductions/my-inductions" class="button">AUT Events Induction Portal</a>

        <p>If you have any questions, please feel free to reach out to your manager or reply to this email.</p>

        <p>Ngā mihi (kind regards),<br/>AUT Events Management</p>
      `;

      await sendEmail(email, inductionEmailSubject, inductionEmailBody, replyToEmail, ccEmails);
    }
    
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
      assignedInductions = [],
    } = req.body;

    // Fetch existing user data
    const userRef = db.collection("users").doc(uid);
    const userDoc = await userRef.get();
    if (!userDoc.exists) {
      return res.status(404).json({ message: "User not found" });
    }

    const existingData = userDoc.data();
    const existingInductions = existingData.assignedInductions || [];

    // Find newly added inductions
    const newInductions = assignedInductions.filter(
      (induction) =>
        !existingInductions.some((existing) => existing.id === induction.id)
    );

    // Update user in Firebase Auth
    const userResult = await admin.auth().updateUser(uid, {
      email: email,
      displayName: `${firstName} ${lastName}`,
    });

    // Set custom user claims
    admin.auth().setCustomUserClaims(uid, { role: permission });

    // Update Firestore
    await userRef.update({
      position: position,
      locations: Array.isArray(locations) ? locations : [],
      assignedInductions: assignedInductions,
    });

    // Send emails for new inductions
    for (const induction of newInductions) {
      const formattedAvailableFrom = induction.availableFrom
        ? format(new Date(induction.availableFrom), "d MMMM yyyy")
        : "Unavailable";
      const formattedDueDate = induction.dueDate
        ? format(new Date(induction.dueDate), "d MMMM yyyy")
        : "Unavailable";
      const description = induction.description || "No description available.";

      const emailSubject = `You have a new induction to complete: ${induction.name || 'Unnamed Induction'}`;
      const emailBody = `
        <h1>Kia ora ${firstName} ${lastName}!</h1>
        <p>You have been assigned a new induction module to complete.</p>
        <br>
        
        <h3>Here are the details:</h3>
        <p><strong>Induction Name:</strong> ${induction.name || "Unnamed Induction"}</p>
        <p><strong>Available from:</strong> ${formattedAvailableFrom}</p>
        <p><strong>Due Date:</strong> ${formattedDueDate}</p>

        <br>
        <h3>How to complete the induction?</h3>
        <p>Simply head to our induction portal website (${process.env.REACT_APP_VERCEL_DEPLOYMENT}) and log in using this email address. Navigate to the "My Inductions" tab, find this induction, and click "Start".</p>
        <a href="${process.env.REACT_APP_VERCEL_DEPLOYMENT}/inductions/my-inductions" class="button">AUT Events Induction Portal</a>

        <p>If you have any questions, please feel free to reach out to your manager or reply to this email.</p>

        <p>Ngā mihi (kind regards),<br/>AUT Events Management</p>
      `;

      const replyToEmail = 'autevents@brears.xyz';
      const ccEmails = ['manager@brears.xyz'];

      await sendEmail(email, emailSubject, emailBody, replyToEmail, ccEmails);
    }

    res.json({
      data: userResult,
      message: "User updated and role set successfully. Emails sent for new inductions.",
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

// Deactivate a user
export const deactivateUser = async (req, res) => {
  try {
    const uid = req.query.uid;
    
    // Disable the user in Firebase Authentication
    await admin.auth().updateUser(uid, { disabled: true });

    res.status(200).json({
      message: "User deactivated successfully",
    });
  } catch (error) {
    console.error("Error deactivating user:", error);
    res.status(500).send(error);
  }
};

// Reactivate a user
export const reactivateUser = async (req, res) => {
  try {
    const uid = req.query.uid;

    // Reactivate the user in Firebase Authentication
    await admin.auth().updateUser(uid, { disabled: false });

    res.status(200).json({
      message: "User reactivated successfully",
    });
  } catch (error) {
    console.error("Error reactivating user:", error);
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
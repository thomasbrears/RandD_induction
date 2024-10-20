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

    // Send welcome email
  	const emailSubject = `Welcome to AUT Events, ${firstName}! Your Induction Account Invitation`;
    const emailContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 0;
          padding: 0;
          background-color: #f4f4f4;
        }
        .email-container {
          background-color: #ffffff;
          max-width: 600px;
          margin: 0 auto;
          border: 1px solid #e0e0e0;
          border-radius: 10px;
          overflow: hidden;
        }
        .email-header {
          background-color: #000000;
          padding: 20px;
          text-align: center;
        }
        .email-header img {
          max-width: 200px;
        }
        .email-body {
          padding: 20px;
          color: #333333;
        }
        h1 {
          font-size: 24px;
          color: #333333;
        }
        p {
          font-size: 16px;
          line-height: 1.5;
        }
        a {
          color: #007bff;
          text-decoration: none;
        }
        .button {
          display: inline-block;
          padding: 12px 24px;
          margin: 20px 0;
          color: #fff;
          background-color: #000;
          border-radius: 5px;
          text-decoration: none;
          font-weight: bold;
        }
      </style>
    </head>
    <body>
      <div class="email-container">
        <div class="email-header">
          <img src="https://dev-aut-events-induction.vercel.app/images/AUTEventsInductionPortal.jpg" alt="AUT Events Induction Portal">
        </div>
        <div class="email-body">
          <h1>Kia ora ${firstName} ${lastName}!</h1>
          <p>Welcome to AUT Events! We're excited to have you on board and looking forward to working with you.</p>
          <p>An account has been created for you on the AUT Events Induction platform. This is where you'll complete important onboarding activities and access induction resources.</p>
          
          <p><strong>Getting Started:</strong></p>
          <ol>
            <li><strong>Visit the Homepage:</strong> Click the button below to visit the AUT Events Induction platform:</li>
            <a href="${process.env.REACT_APP_VERCEL_DEPLOYMENT}" class="button">AUT Events Induction Homepage</a>
            <li><strong>Log In:</strong> From the homepage, you can log in using this email address and choose the passwordless login option, or you can set a password <a href="${process.env.REACT_APP_VERCEL_DEPLOYMENT}/reset-password">here</a>.</li>
          </ol>

          <p>One of our managers will guide you through the necessary induction process when you start with us.</p>

          <p>If you have any questions or issues accessing your account, feel free to reach out to us at <a href="mailto:events@aut.ac.nz">events@aut.ac.nz</a> or reply to this email.</p>

          <p>We look forward to working with you!</p>

          <p>Ngā mihi (kind regards),<br/>AUT Events Management</p>
        </div>
      </div>
    </body>
    </html>
    `;

    const replyToEmail = 'autevents@brears.xyz'; // reply to aut events
    const ccEmails = ['manager@brears.xyz']; // Cc Rinus

    // Send welcome email with ReplyTo and CC
    await sendEmail(email, emailSubject, emailContent, replyToEmail, ccEmails);

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
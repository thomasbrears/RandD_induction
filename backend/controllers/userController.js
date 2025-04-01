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
    
    // Validate UID parameter
    if (!uid) {
      return res.status(400).json({ 
        message: "User ID is required",
        success: false
      });
    }
    
    // Validate UID format (assuming Firebase UIDs are strings with length > 5)
    if (typeof uid !== 'string' || uid.length < 5) {
      return res.status(400).json({ 
        message: "Invalid user ID format",
        success: false
      });
    }

    // Get user from Firebase Auth
    let userResult;
    try {
      userResult = await admin.auth().getUser(uid);
    } catch (authError) {
      return res.status(404).json({ 
        message: "User not found in authentication system",
        success: false,
        error: authError.message
      });
    }

    // Get user data from Firestore
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
      // Removed assignedInductions as they are now stored in the userInductions collection
    };

    res.json({
      success: true,
      data: userData
    });
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({
      message: "Server error while fetching user data",
      success: false,
      error: error.message
    });
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
      department,
      locations
    } = req.body;

    // Input validation
    const validationErrors = [];
    
    // Check required fields
    if (!email) validationErrors.push("Email is required");
    if (!permission) validationErrors.push("Permission role is required");
    if (!firstName) validationErrors.push("First name is required");
    if (!lastName) validationErrors.push("Last name is required");
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (email && !emailRegex.test(email)) {
      validationErrors.push("Invalid email format");
    }
    
    // Validate permission value (assuming you have predefined roles)
    const validPermissions = ["admin", "manager", "user"]; // Add your valid roles here
    if (permission && !validPermissions.includes(permission.toLowerCase())) {
      validationErrors.push(`Invalid permission role. Must be one of: ${validPermissions.join(", ")}`);
    }
    
    // Check locations is an array if provided
    if (locations && !Array.isArray(locations)) {
      validationErrors.push("Locations must be an array");
    }
    
    // Return validation errors if any
    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: validationErrors
      });
    }

    // Check if user already exists
    try {
      const existingUser = await admin.auth().getUserByEmail(email);
      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: "User with this email already exists"
        });
      }
    } catch (error) {
      if (error.code !== 'auth/user-not-found') {
        throw error;
      }
    }

    // Create the user in Firebase Auth
    const userRecord = await admin.auth().createUser({
      email: email,
      displayName: `${firstName} ${lastName}`,
      emailVerified: false,
      disabled: false,
    });

    // Set custom claims for role/permissions
    await admin.auth().setCustomUserClaims(userRecord.uid, { role: permission });

    // Create user document in Firestore
    try {
      const userRef = db.collection("users").doc(userRecord.uid);
      await userRef.set({
        userFirstName: firstName,
        userLastName: lastName,
        permission: permission,
        position: position || "",  // Default to empty string if not provided
        department: department || "", // Default to empty string if not provided
        locations: Array.isArray(locations) ? locations : [],
        createdAt: admin.firestore.FieldValue.serverTimestamp()
        // Removed assignedInductions as they are now stored in the userInductions collection
      });
    } catch (firestoreError) {
      // If Firestore creation fails, attempt to delete the Auth user to maintain consistency
      console.error("Firestore error: ", firestoreError);
      try {
        await admin.auth().deleteUser(userRecord.uid);
      } catch (deleteError) {
        console.error("Failed to clean up Auth user after Firestore error:", deleteError);
      }
      return res.status(500).json({ 
        success: false,
        message: "Error writing to Firestore.",
        error: firestoreError.message
      });
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

    // Send welcome email with ReplyTo and CC, using the default template
    await sendEmail(email, emailSubject, emailBody, replyToEmail);
    
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

export const updateUser = async (req, res) => {
  try {
    const {
      uid,
      firstName,
      lastName,
      email,
      permission,
      position,
      department,
      locations
    } = req.body;

    // Input validation
    const validationErrors = [];
    
    // Check required fields
    if (!uid) validationErrors.push("User ID is required");
    if (!email) validationErrors.push("Email is required");
    if (!permission) validationErrors.push("Permission role is required");
    if (!firstName) validationErrors.push("First name is required");
    if (!lastName) validationErrors.push("Last name is required");
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (email && !emailRegex.test(email)) {
      validationErrors.push("Invalid email format");
    }
    
    // Validate permission value
    const validPermissions = ["admin", "manager", "user"];
    if (permission && !validPermissions.includes(permission.toLowerCase())) {
      validationErrors.push(`Invalid permission role. Must be one of: ${validPermissions.join(", ")}`);
    }
    
    // Check locations is an array if provided
    if (locations && !Array.isArray(locations)) {
      validationErrors.push("Locations must be an array");
    }
    
    // Return validation errors if any
    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: validationErrors
      });
    }

    // Fetch existing user data to verify the user exists
    const userRef = db.collection("users").doc(uid);
    const userDoc = await userRef.get();
    if (!userDoc.exists) {
      return res.status(404).json({ 
        success: false,
        message: "User not found in database" 
      });
    }

    // Check if email is being changed and if it's already in use by another user
    try {
      const existingUser = await admin.auth().getUserByEmail(email);
      if (existingUser && existingUser.uid !== uid) {
        return res.status(409).json({
          success: false,
          message: "Email address is already in use by another user"
        });
      }
    } catch (error) {
      if (error.code !== 'auth/user-not-found') {
        throw error;
      }
    }

    // Update user in Firebase Auth
    const userResult = await admin.auth().updateUser(uid, {
      email: email,
      displayName: `${firstName} ${lastName}`,
    });

    // Set custom user claims
    await admin.auth().setCustomUserClaims(uid, { role: permission });

    // Prepare update object for Firestore
    const updateData = {
      userFirstName: firstName,
      userLastName: lastName,
      usersName: `${firstName} ${lastName}`,
      permission: permission,
      position: position || "",
      department: department || "",
      locations: Array.isArray(locations) ? locations : [],
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    // Update Firestore
    await userRef.update(updateData);

    res.json({
      success: true,
      message: "User updated successfully",
      data: {
        uid: userResult.uid,
        email: userResult.email,
        displayName: userResult.displayName,
        role: permission
      }
    });
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update user",
      error: error.message || "Unknown error occurred",
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Delete a user
export const deleteUser = async (req, res) => {
  try {
    const uid = req.query.uid;
    
    // Validate UID parameter
    if (!uid) {
      return res.status(400).json({ 
        success: false,
        message: "User ID is required" 
      });
    }
    
    // Check if user exists before attempting deletion
    try {
      await admin.auth().getUser(uid);
    } catch (authError) {
      if (authError.code === 'auth/user-not-found') {
        return res.status(404).json({
          success: false,
          message: "User not found in authentication system"
        });
      }
      throw authError; // Re-throw other auth errors
    }
    
    // Begin a Firestore batch to ensure atomicity
    const batch = db.batch();
    
    // Get any userInductions for this user to delete
    const userInductionsSnapshot = await db.collection("userInductions")
      .where("userId", "==", uid)
      .get();
    
    // Add deletion operations to the batch
    userInductionsSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    // Add user document deletion to batch
    const userRef = db.collection("users").doc(uid);
    batch.delete(userRef);
    
    // Execute the batch (all or nothing)
    await batch.commit();
    
    // Finally delete the authentication user
    await admin.auth().deleteUser(uid);

    res.status(200).json({
      success: true,
      message: "User and all associated data deleted successfully",
      deletedUserInductions: userInductionsSnapshot.size
    });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete user",
      error: error.message
    });
  }
};

// Deactivate a user
export const deactivateUser = async (req, res) => {
  try {
    const uid = req.query.uid;
    
    // Validate UID parameter
    if (!uid) {
      return res.status(400).json({ 
        success: false,
        message: "User ID is required" 
      });
    }
    
    // Check if user exists before attempting deactivation
    try {
      const userRecord = await admin.auth().getUser(uid);
      
      // Check if user is already disabled
      if (userRecord.disabled) {
        return res.status(400).json({
          success: false,
          message: "User is already deactivated"
        });
      }
    } catch (authError) {
      if (authError.code === 'auth/user-not-found') {
        return res.status(404).json({
          success: false,
          message: "User not found in authentication system"
        });
      }
      throw authError; // Re-throw other auth errors
    }
    
    // Disable the user in Firebase Authentication
    await admin.auth().updateUser(uid, { disabled: true });
    
    // Update user record in Firestore to reflect deactivation
    const userRef = db.collection("users").doc(uid);
    await userRef.update({
      disabled: true,
      disabledAt: admin.firestore.FieldValue.serverTimestamp()
    });

    res.status(200).json({
      success: true,
      message: "User deactivated successfully"
    });
  } catch (error) {
    console.error("Error deactivating user:", error);
    res.status(500).json({
      success: false,
      message: "Failed to deactivate user",
      error: error.message
    });
  }
};

// Reactivate a user
export const reactivateUser = async (req, res) => {
  try {
    const uid = req.query.uid;
    
    // Validate UID parameter
    if (!uid) {
      return res.status(400).json({ 
        success: false,
        message: "User ID is required" 
      });
    }
    
    // Check if user exists before attempting reactivation
    try {
      const userRecord = await admin.auth().getUser(uid);
      
      // Check if user is already enabled
      if (!userRecord.disabled) {
        return res.status(400).json({
          success: false,
          message: "User is already active"
        });
      }
    } catch (authError) {
      if (authError.code === 'auth/user-not-found') {
        return res.status(404).json({
          success: false,
          message: "User not found in authentication system"
        });
      }
      throw authError; // Re-throw other auth errors
    }

    // Reactivate the user in Firebase Authentication
    await admin.auth().updateUser(uid, { disabled: false });
    
    // Update user record in Firestore to reflect reactivation
    const userRef = db.collection("users").doc(uid);
    await userRef.update({
      disabled: false,
      reactivatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    res.status(200).json({
      success: true,
      message: "User reactivated successfully"
    });
  } catch (error) {
    console.error("Error reactivating user:", error);
    res.status(500).json({
      success: false,
      message: "Failed to reactivate user",
      error: error.message
    });
  }
};
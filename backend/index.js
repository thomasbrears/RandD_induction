import admin from "firebase-admin";
import express from "express";
import cors from "cors";
import { db } from "./firebase.js";
import Positions from "./models/Positions.js";
import Departments from "./models/Departments.js";
import { sendEmail } from "./utils/mailjet.js";

const app = express();
//app.use(cors());

// Cores middleware to allow cross-origin requests
//app.use(cors({
  //origin: 'https://dev-aut-events-induction.vercel.app',
  //methods: 'GET,POST,PUT,DELETE,OPTIONS',
  //credentials: true
//}));

// dynamic cors options
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? 'https://dev-aut-events-induction.vercel.app' 
    : true,  // Allow all origins in development
  methods: 'GET,POST,PUT,DELETE,OPTIONS',
  credentials: true
};

// CORS middleware to allow cross-origin requests
app.use(cors(corsOptions));

app.use(express.json());

//Middleware makes sure that anyone accessing endpoints is logged in TODO: role-based
app.use(async (req, res, next) => {
  const { authtoken } = req.headers;

  if (authtoken) {
    try {
      req.user = await admin.auth().verifyIdToken(authtoken);
    } catch (e) {
      return res.sendStatus(400);
    }
  } else {
    return res.sendStatus(401);
  }

  req.user = req.user || {};
  next();
});

app.get("/api/users", async (req, res) => {
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
});

app.get("/api/users/get-user", async (req, res) => {
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
});

app.post("/api/users/create-new-user", async (req, res) => {
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
});

app.put("/api/users/update-user", async (req, res) => {
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
});

app.delete("/api/users/delete-user", async (req, res) => {
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
});

app.get("/api/get-assigned-inductions", async (req, res) => {
  try {
    const uid = req.query.uid;

    //Firestore
    const userRef = db.collection("users").doc(uid);
    const userDoc = await userRef.get();

    const userData = {
      assignedInductions: userDoc.exists
        ? userDoc.data().assignedInductions
        : [],
    };

    res.json(userData);
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).send(error);
  }
});

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

//Induction endpoints
app.get("/api/inductions", async (req, res) => {
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
});

app.post("/api/create-induction", async (req, res) => {
  const newInduction = req.body;

  try {
    const addedInduction = await db.collection("inductions").add(newInduction);
    res.status(201).json({ id: addedInduction.id, ...newInduction });
  } catch (error) {
    console.error("Error creating induction:", error);
    res.status(500).send(error);
  }
});

//Don't know if this works
app.get("/api/get-induction", async (req, res) => {
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
});

//Add an update induction endpoint

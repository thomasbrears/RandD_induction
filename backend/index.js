import admin from 'firebase-admin';
import express from 'express';
import cors from 'cors';
import { db } from './firebase.js';
import Positions from './models/Positions.js';

const app = express();
app.use(cors());
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
      const users = [];
      const listUsersResult = await admin.auth().listUsers();
      listUsersResult.users.forEach(async (userRecord) => {
        users.push({
          uid: userRecord.uid,
          email: userRecord.email,
          permission: userRecord.customClaims ? userRecord.customClaims.role : "Unknown",
          firstName: userRecord.displayName ? userRecord.displayName.split(" ")[0] : "firstName",
          lastName: userRecord.displayName ? userRecord.displayName.split(" ")[1] || "" : "lastName",
        });
      });

      
      
      res.json(users);     
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).send(error);
    }
});

app.get("/api/get-user", async (req, res) => {
    try {
        const uid = req.query.uid;
        const userResult = await admin.auth().getUser(uid);
        
        //Firestore
        const userRef = db.collection('users').doc(uid);
        const userDoc = await userRef.get();

        const userData = {
            uid: userResult.uid,
            firstName: userResult.displayName ? userResult.displayName.split(" ")[0] : "",
            lastName: userResult.displayName ? userResult.displayName.split(" ")[1] || "" : "",
            email: userResult.email,
            permission: userResult.customClaims ? userResult.customClaims.role : Permissions.USER, 
            position: userDoc.exists ? userDoc.data().position : Positions.TEAM,
            locations: userDoc.exists ? userDoc.data().locations : [],
        };

        res.json(userData);     
    } catch (error) {
        console.error("Error fetching user:", error);
        res.status(500).send(error);
    }
});

app.post("/api/users/create-new-user", async(req,res)=>{
    try{
        const { firstName, lastName, email, permission, position, locations } = req.body;
        console.log(`${position} ${locations}`);
        if (!email || !permission) {
          return res.status(400).send("Email and permission are required");
        }

        const userRecord = await admin.auth().createUser({
            email: email,
            displayName: `${firstName} ${lastName}`,
            emailVerified: false,
            disabled: false,
        });

        //Custom Claim Token
        admin.auth().setCustomUserClaims(userRecord.uid, {role: permission});

        //FireStore
        try {
          const userRef = db.collection('users').doc(userRecord.uid);
          await userRef.set({
            position: position,
            locations: Array.isArray(locations) ? locations : [],
          });
        } catch (firestoreError) {
          console.error("Firestore error: ", firestoreError);
          throw new Error("Error writing to Firestore");
        }

        res.status(201).json({
            uid: userRecord.uid,
            email: userRecord.email,
            role: permission,
            message: "User created and role set successfully"
          });
    } catch (error){
        console.error("Error creating user", error);
        res.status(500).send(error);
    }
});

app.put("/api/update-user", async (req, res) => {
  try {
      const { uid, firstName, lastName, email, permission, position, locations } = req.body;

      const userResult = await admin.auth().updateUser(uid,{
        email: email,
        displayName: `${firstName} ${lastName}`,
      });

      admin.auth().setCustomUserClaims(uid, {role: permission});

      //Firestore
      const userRef = db.collection('users').doc(uid);
      await userRef.update({
        position: position,
        locations: Array.isArray(locations) ? locations : [],
      });

      res.json({
        data: userResult,
        message: "User updated and role set successfully"
      });    
  } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).send(error);
  }
});

app.delete("/api/delete-user", async (req, res) => {
  try {
      const uid = req.query.uid;
      const result = await admin.auth().updateUser(uid);
      res.status(201).json({
        message: "User deleted and successfully"
      });
  } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).send(error);
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

//Data endpoints
